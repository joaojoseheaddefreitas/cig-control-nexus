import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, Legend,
} from 'recharts';
import { ordensProducao, cipKPIs, calcularDiasEquivalentes, setoresProducao } from '@/data/cipData';
import { KPICard } from '@/components/ui/KPICard';
import { ModuleCard } from '@/components/ui/ModuleCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { 
  Factory, CheckCircle, Clock, TrendingUp, Package, 
  ArrowDown, ArrowUp, RefreshCw, Save, AlertTriangle, Users
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';

interface BaixaProducao {
  data: string;
  op: string;
  setor: string;
  quantidade: number;
  refugo: number;
  retrabalho: number;
}

const producaoPorPeriodo = [
  { periodo: 'Sem 1', produzido: 142, meta: 150 },
  { periodo: 'Sem 2', produzido: 158, meta: 150 },
  { periodo: 'Sem 3', produzido: 145, meta: 150 },
  { periodo: 'Sem 4', produzido: 167, meta: 160 },
];

const baixasRecentes: BaixaProducao[] = [
  { data: '2025-01-27', op: '2025-001240', setor: 'Embalagem', quantidade: 5, refugo: 0, retrabalho: 1 },
  { data: '2025-01-27', op: '2025-001238', setor: 'Montagem Final', quantidade: 12, refugo: 1, retrabalho: 0 },
  { data: '2025-01-27', op: '2025-001235', setor: 'Costura', quantidade: 50, refugo: 2, retrabalho: 3 },
  { data: '2025-01-26', op: '2025-001232', setor: 'Revestimento', quantidade: 2, refugo: 0, retrabalho: 0 },
  { data: '2025-01-26', op: '2025-001230', setor: 'Colagem de Espuma', quantidade: 8, refugo: 0, retrabalho: 1 },
];

const producaoPorSetor = setoresProducao.slice(0, 8).map(s => ({
  setor: s.nome.substring(0, 15),
  produzido: Math.round(s.horasUtilizadas * 5),
  meta: Math.round(s.horasDisponiveis * 5),
  operadores: s.operadores,
}));

export function CIPProducao() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [localBaixas, setLocalBaixas] = useState<BaixaProducao[]>(baixasRecentes);
  const [novaBaixa, setNovaBaixa] = useState<BaixaProducao>({
    data: new Date().toISOString().split('T')[0],
    op: '',
    setor: '',
    quantidade: 1,
    refugo: 0,
    retrabalho: 0,
  });

  const opsEmProducao = ordensProducao.filter(o => o.status === 'em_producao');
  const opsConcluidas = cipKPIs.opsConcluidas;
  const totalProduzidoHoje = localBaixas
    .filter(b => b.data === new Date().toISOString().split('T')[0])
    .reduce((acc, b) => acc + b.quantidade, 0);
  const totalRefugoHoje = localBaixas
    .filter(b => b.data === new Date().toISOString().split('T')[0])
    .reduce((acc, b) => acc + b.refugo, 0);
  const totalRetrabalhoHoje = localBaixas
    .filter(b => b.data === new Date().toISOString().split('T')[0])
    .reduce((acc, b) => acc + b.retrabalho, 0);
  const metaDia = 180;
  const percentualMeta = (totalProduzidoHoje / metaDia) * 100;

  // Total de funcionários
  const totalFuncionarios = setoresProducao.reduce((acc, s) => acc + s.operadores, 0);

  const handleRegistrarBaixa = () => {
    if (!novaBaixa.op || !novaBaixa.setor || novaBaixa.quantidade <= 0) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setLocalBaixas([novaBaixa, ...localBaixas]);
    toast.success(`✅ Baixa registrada! OP ${novaBaixa.op} - ${novaBaixa.quantidade} unidades`);
    setIsDialogOpen(false);
    setNovaBaixa({
      data: new Date().toISOString().split('T')[0],
      op: '',
      setor: '',
      quantidade: 1,
      refugo: 0,
      retrabalho: 0,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <KPICard
          title="Produzido Hoje"
          value={totalProduzidoHoje}
          subtitle={`Meta: ${metaDia} unidades`}
          icon={<Factory className="h-5 w-5" />}
          trend={percentualMeta >= 90 ? 'up' : 'down'}
          trendValue={`${percentualMeta.toFixed(0)}% da meta`}
          variant="cip"
        />
        <KPICard
          title="OPs em Produção"
          value={opsEmProducao.length}
          subtitle="Ativas agora"
          icon={<RefreshCw className="h-5 w-5" />}
          variant="cip"
        />
        <KPICard
          title="Baixas do Dia"
          value={localBaixas.filter(b => b.data === new Date().toISOString().split('T')[0]).length}
          subtitle="Registradas"
          icon={<ArrowDown className="h-5 w-5" />}
          trend="up"
          trendValue="+12%"
          variant="cip"
        />
        <KPICard
          title="Refugo Hoje"
          value={totalRefugoHoje}
          subtitle="Unidades perdidas"
          icon={<AlertTriangle className="h-5 w-5" />}
          trend="down"
          trendValue="Monitorar"
          variant="cip"
        />
        <KPICard
          title="Retrabalho Hoje"
          value={totalRetrabalhoHoje}
          subtitle="Unidades reprocessadas"
          icon={<RefreshCw className="h-5 w-5" />}
          variant="cip"
        />
        <KPICard
          title="Funcionários"
          value={totalFuncionarios}
          subtitle="Em produção"
          icon={<Users className="h-5 w-5" />}
          variant="cip"
        />
      </div>

      {/* Progresso do Dia + Ação de Baixa */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ModuleCard title="Progresso da Produção - Hoje" variant="cip" className="lg:col-span-2">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-3xl font-bold text-foreground">{totalProduzidoHoje} <span className="text-lg text-muted-foreground">/ {metaDia}</span></p>
                <p className="text-sm text-muted-foreground">unidades produzidas</p>
              </div>
              <div className={`text-4xl font-bold ${percentualMeta >= 90 ? 'text-green-500' : percentualMeta >= 70 ? 'text-amber-500' : 'text-red-500'}`}>
                {percentualMeta.toFixed(0)}%
              </div>
            </div>
            <Progress value={Math.min(100, percentualMeta)} className="h-4" />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>0%</span>
              <span className="text-amber-500">70%</span>
              <span className="text-green-500">90%</span>
              <span>100%</span>
            </div>
          </div>
        </ModuleCard>

        {/* Card de Registro de Baixa */}
        <ModuleCard title="Registrar Baixa" variant="cip">
          <div className="p-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Registre a produção diária de cada setor com refugo e retrabalho.
            </p>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full bg-cip hover:bg-cip/90 text-white">
                  <ArrowDown className="h-4 w-4 mr-2" />
                  Nova Baixa de Produção
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <ArrowDown className="h-5 w-5 text-cip" />
                    Registro de Baixa de Produção
                  </DialogTitle>
                  <DialogDescription>
                    Campos obrigatórios: Data, OP, Setor, Quantidade, Refugo, Retrabalho
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid grid-cols-2 gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="data">Data *</Label>
                    <Input
                      id="data"
                      type="date"
                      value={novaBaixa.data}
                      onChange={(e) => setNovaBaixa({...novaBaixa, data: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="op">OP *</Label>
                    <Select value={novaBaixa.op} onValueChange={(v) => setNovaBaixa({...novaBaixa, op: v})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a OP" />
                      </SelectTrigger>
                      <SelectContent>
                        {ordensProducao.filter(o => o.status === 'em_producao').map((op) => (
                          <SelectItem key={op.id} value={op.op}>{op.op} - {op.descricao}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="setor">Setor *</Label>
                    <Select value={novaBaixa.setor} onValueChange={(v) => setNovaBaixa({...novaBaixa, setor: v})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o setor" />
                      </SelectTrigger>
                      <SelectContent>
                        {setoresProducao.map((s) => (
                          <SelectItem key={s.id} value={s.nome}>{s.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantidade">Quantidade *</Label>
                    <Input
                      id="quantidade"
                      type="number"
                      min="1"
                      value={novaBaixa.quantidade}
                      onChange={(e) => setNovaBaixa({...novaBaixa, quantidade: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="refugo">Refugo</Label>
                    <Input
                      id="refugo"
                      type="number"
                      min="0"
                      value={novaBaixa.refugo}
                      onChange={(e) => setNovaBaixa({...novaBaixa, refugo: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="retrabalho">Retrabalho</Label>
                    <Input
                      id="retrabalho"
                      type="number"
                      min="0"
                      value={novaBaixa.retrabalho}
                      onChange={(e) => setNovaBaixa({...novaBaixa, retrabalho: parseInt(e.target.value) || 0})}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    className="bg-cip hover:bg-cip/90 text-white"
                    onClick={handleRegistrarBaixa}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Registrar Baixa
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </ModuleCard>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Produção por Período */}
        <ModuleCard title="Produção Semanal vs Meta" variant="cip">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={producaoPorPeriodo}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="periodo" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }} />
                <Legend />
                <Bar dataKey="produzido" fill="#22c55e" name="Produzido" radius={[4, 4, 0, 0]} />
                <Bar dataKey="meta" fill="#6b7280" name="Meta" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ModuleCard>

        {/* Produção por Setor com Funcionários */}
        <ModuleCard title="Produção por Setor (Operadores)" variant="cip">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={producaoPorSetor} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={true} vertical={false} />
                <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} />
                <YAxis type="category" dataKey="setor" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={{ stroke: '#333' }} width={120} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }}
                  formatter={(value: number, name: string, props: any) => [
                    `${value} un (${props.payload.operadores} operadores)`,
                    name
                  ]}
                />
                <Bar dataKey="produzido" fill="#f97316" name="Produzido" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ModuleCard>
      </div>

      {/* OPs em Produção */}
      <ModuleCard title="Ordens em Produção" variant="cip">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">OP</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Produto</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">Qtd</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Setor Atual</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">Progresso</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">Prazo</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">Ação</th>
              </tr>
            </thead>
            <tbody>
              {opsEmProducao.map((op) => {
                const progresso = (op.horasRealizadas / op.horasNecessarias) * 100;
                return (
                  <tr key={op.id} className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                    <td className="py-3 px-4 font-mono text-foreground">{op.op}</td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-foreground font-medium">{op.descricao}</p>
                        <p className="text-xs text-muted-foreground">{op.cliente}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-foreground">{op.quantidade}</td>
                    <td className="py-3 px-4 text-muted-foreground">{op.setor}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Progress value={progresso} className="h-2 flex-1" />
                        <span className="text-xs text-foreground w-10">{progresso.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center text-foreground">
                      {new Date(op.prazoEntrega).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-xs"
                        onClick={() => {
                          setNovaBaixa({...novaBaixa, op: op.op, setor: op.setor});
                          setIsDialogOpen(true);
                        }}
                      >
                        <ArrowDown className="h-3 w-3 mr-1" />
                        Baixa
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </ModuleCard>

      {/* Histórico de Baixas */}
      <ModuleCard title="Histórico de Baixas de Produção" variant="cip">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Data</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">OP</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Setor</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">Quantidade</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">Refugo</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">Retrabalho</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">Aproveitamento</th>
              </tr>
            </thead>
            <tbody>
              {localBaixas.map((baixa, index) => {
                const aproveitamento = ((baixa.quantidade - baixa.refugo) / baixa.quantidade) * 100;
                return (
                  <tr key={index} className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                    <td className="py-3 px-4 text-foreground">{new Date(baixa.data).toLocaleDateString('pt-BR')}</td>
                    <td className="py-3 px-4 font-mono text-foreground">{baixa.op}</td>
                    <td className="py-3 px-4 text-muted-foreground">{baixa.setor}</td>
                    <td className="py-3 px-4 text-right font-bold text-green-500">+{baixa.quantidade}</td>
                    <td className="py-3 px-4 text-right text-red-500">{baixa.refugo > 0 ? `-${baixa.refugo}` : '0'}</td>
                    <td className="py-3 px-4 text-right text-amber-500">{baixa.retrabalho > 0 ? baixa.retrabalho : '0'}</td>
                    <td className="py-3 px-4 text-right">
                      <Badge variant={aproveitamento >= 95 ? 'default' : aproveitamento >= 90 ? 'secondary' : 'destructive'}>
                        {aproveitamento.toFixed(0)}%
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </ModuleCard>
    </div>
  );
}
