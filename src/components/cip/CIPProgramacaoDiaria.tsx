import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { ordensProducao, capacidadeDiaria, FOLGA_PRODUCAO, cipKPIs, calcularDiasEquivalentes, getStatusCor, setoresProducao, OrdemProducao } from '@/data/cipData';
import { carteiraPedidos } from '@/data/civData';
import { KPICard } from '@/components/ui/KPICard';
import { ModuleCard } from '@/components/ui/ModuleCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Calendar, Clock, AlertTriangle, CheckCircle, Plus, Filter,
  ArrowUpDown, Factory, Package, Truck, Ban, X, ShoppingCart,
  FileText, Save, RefreshCw
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

const statusConfig = {
  aguardando: { label: 'Aguardando', color: '#f59e0b', icon: Clock },
  em_producao: { label: 'Em Produção', color: '#3b82f6', icon: Factory },
  concluido: { label: 'Concluído', color: '#22c55e', icon: CheckCircle },
  atrasado: { label: 'Atrasado', color: '#ef4444', icon: AlertTriangle },
  bloqueado: { label: 'Bloqueado', color: '#dc2626', icon: Ban },
};

const origemConfig = {
  manual: { label: 'Manual', color: '#8b5cf6' },
  pcp: { label: 'PCP', color: '#3b82f6' },
  erp: { label: 'ERP', color: '#22c55e' },
  sap: { label: 'SAP', color: '#f97316' },
};

const prioridadeConfig = {
  baixa: { label: 'Baixa', color: '#6b7280' },
  normal: { label: 'Normal', color: '#3b82f6' },
  alta: { label: 'Alta', color: '#f59e0b' },
  urgente: { label: 'Urgente', color: '#ef4444' },
};

interface NovaOP {
  op: string;
  produto: string;
  descricao: string;
  quantidade: number;
  dataProgramada: string;
  prazoEntrega: string;
  setor: string;
  origem: 'manual' | 'pcp' | 'erp' | 'sap';
  prioridade: 'baixa' | 'normal' | 'alta' | 'urgente';
  horasNecessarias: number;
  cliente: string;
}

export function CIPProgramacaoDiaria() {
  const [filtroData, setFiltroData] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('');
  const [filtroOrigem, setFiltroOrigem] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [localOPs, setLocalOPs] = useState<OrdemProducao[]>(ordensProducao);
  const [novaOP, setNovaOP] = useState<NovaOP>({
    op: '',
    produto: '',
    descricao: '',
    quantidade: 1,
    dataProgramada: new Date().toISOString().split('T')[0],
    prazoEntrega: '',
    setor: '',
    origem: 'manual',
    prioridade: 'normal',
    horasNecessarias: 1,
    cliente: '',
  });
  
  // Cálculos de capacidade
  const horasTotal = localOPs.reduce((acc, op) => acc + op.horasNecessarias, 0);
  const capacidadeLiquida = cipKPIs.capacidadeTotal * (1 - FOLGA_PRODUCAO);
  const ocupacaoAtual = (horasTotal / capacidadeLiquida) * 100;
  const horasRestantes = capacidadeLiquida - horasTotal;
  const diasRestantes = Math.max(0, Math.ceil(horasRestantes / 8));
  
  // Status geral
  const statusGeral = getStatusCor(ocupacaoAtual);
  
  // Pedidos CIV disponíveis para importar
  const pedidosDisponiveis = carteiraPedidos.filter(p => p.status === 'a_programar');
  
  const opsFiltradas = localOPs.filter(op => {
    if (filtroStatus && op.status !== filtroStatus) return false;
    if (filtroData && op.dataProgramada !== filtroData) return false;
    if (filtroOrigem && op.origem !== filtroOrigem) return false;
    return true;
  });

  const chartCapacidade = capacidadeDiaria.map(d => ({
    dia: new Date(d.data).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }),
    ocupacao: d.ocupacaoPercentual,
    limite: 85,
    status: d.status,
  }));

  // Gerar novo número de OP
  const gerarNovaOP = () => {
    const ano = new Date().getFullYear();
    const numero = (localOPs.length + 1).toString().padStart(6, '0');
    return `${ano}-${numero}`;
  };

  // Calcular horas necessárias baseado na quantidade
  const calcularHoras = (quantidade: number, setor: string) => {
    const setorInfo = setoresProducao.find(s => s.nome === setor);
    if (!setorInfo) return quantidade * 0.5;
    const horasPorUnidade = setorInfo.horasNecessarias / 100;
    return quantidade * horasPorUnidade;
  };

  // Verificar se pode adicionar nova OP (capacidade disponível)
  const verificarCapacidade = (horasNovas: number) => {
    const novaOcupacao = ((horasTotal + horasNovas) / capacidadeLiquida) * 100;
    return {
      podeAdicionar: novaOcupacao <= 100,
      novaOcupacao,
      diasNecessarios: Math.ceil(horasNovas / 8),
    };
  };

  // Adicionar nova OP manual
  const handleAdicionarOP = () => {
    if (!novaOP.op || !novaOP.produto || !novaOP.setor) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const verificacao = verificarCapacidade(novaOP.horasNecessarias);
    
    if (!verificacao.podeAdicionar) {
      toast.error(`❌ BLOQUEADO: Capacidade excedida! Nova ocupação seria ${verificacao.novaOcupacao.toFixed(0)}%`);
      return;
    }

    const novaOrdem: OrdemProducao = {
      id: `OP${localOPs.length + 1}`,
      op: novaOP.op,
      produto: novaOP.produto,
      descricao: novaOP.descricao,
      quantidade: novaOP.quantidade,
      dataProgramada: novaOP.dataProgramada,
      prazoEntrega: novaOP.prazoEntrega,
      setor: novaOP.setor,
      status: 'aguardando',
      origem: novaOP.origem,
      horasNecessarias: novaOP.horasNecessarias,
      horasRealizadas: 0,
      prioridade: novaOP.prioridade,
      cliente: novaOP.cliente,
    };

    setLocalOPs([...localOPs, novaOrdem]);
    toast.success(`✅ OP ${novaOP.op} adicionada! Ocupação: ${verificacao.novaOcupacao.toFixed(0)}% | ${verificacao.diasNecessarios} dias`);
    setIsDialogOpen(false);
    setNovaOP({
      op: gerarNovaOP(),
      produto: '',
      descricao: '',
      quantidade: 1,
      dataProgramada: new Date().toISOString().split('T')[0],
      prazoEntrega: '',
      setor: '',
      origem: 'manual',
      prioridade: 'normal',
      horasNecessarias: 1,
      cliente: '',
    });
  };

  // Importar pedido da carteira CIV
  const handleImportarPedido = (pedido: typeof carteiraPedidos[0]) => {
    const horasEstimadas = pedido.quantidade * 0.3;
    const verificacao = verificarCapacidade(horasEstimadas);
    
    if (!verificacao.podeAdicionar) {
      toast.error(`❌ BLOQUEADO: Capacidade excedida! Nova ocupação seria ${verificacao.novaOcupacao.toFixed(0)}%`);
      return;
    }

    const novaOrdem: OrdemProducao = {
      id: `OP${localOPs.length + 1}`,
      op: `${new Date().getFullYear()}-${(localOPs.length + 1).toString().padStart(6, '0')}`,
      produto: pedido.produto.split(' ')[0],
      descricao: pedido.produto,
      quantidade: pedido.quantidade,
      dataProgramada: new Date().toISOString().split('T')[0],
      prazoEntrega: pedido.prazoPrometido,
      setor: 'Montagem da Estrutura',
      status: 'aguardando',
      origem: 'pcp',
      horasNecessarias: horasEstimadas,
      horasRealizadas: 0,
      prioridade: pedido.prioridade === 'urgente' ? 'urgente' : pedido.prioridade === 'alta' ? 'alta' : 'normal',
      cliente: pedido.cliente,
    };

    setLocalOPs([...localOPs, novaOrdem]);
    toast.success(`✅ Pedido ${pedido.id} importado como OP! Ocupação: ${verificacao.novaOcupacao.toFixed(0)}%`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Indicador Principal de Capacidade - OBRIGATÓRIO */}
      <div className={`p-6 rounded-lg border-2 ${
        statusGeral === 'verde' ? 'bg-green-500/10 border-green-500/50' :
        statusGeral === 'amarelo' ? 'bg-amber-500/10 border-amber-500/50' :
        'bg-red-500/10 border-red-500/50'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${
              statusGeral === 'verde' ? 'bg-green-500 text-white' :
              statusGeral === 'amarelo' ? 'bg-amber-500 text-white' :
              'bg-red-500 text-white'
            }`}>
              {statusGeral === 'verde' ? '🟢' : statusGeral === 'amarelo' ? '🟡' : '🔴'}
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">Capacidade Produtiva</h3>
              <p className={`text-sm ${
                statusGeral === 'verde' ? 'text-green-400' :
                statusGeral === 'amarelo' ? 'text-amber-400' :
                'text-red-400'
              }`}>
                {statusGeral === 'verde' ? 'Dentro da capacidade - Aceita novos pedidos' :
                 statusGeral === 'amarelo' ? 'Próximo do limite - Avaliar com cuidado' :
                 'Capacidade excedida - BLOQUEADO para novos pedidos'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-xs text-muted-foreground">OCUPAÇÃO</p>
              <p className="text-3xl font-bold text-foreground">{Math.min(100, ocupacaoAtual).toFixed(0)}%</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">HORAS PROG.</p>
              <p className="text-3xl font-bold text-cip">{horasTotal.toFixed(0)}h</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">HORAS LIVRES</p>
              <p className="text-3xl font-bold text-green-400">{Math.max(0, horasRestantes).toFixed(0)}h</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">DIAS LIVRES</p>
              <p className="text-3xl font-bold text-green-400">{diasRestantes} dias</p>
            </div>
          </div>
        </div>
        
        {/* Barra de Progresso */}
        <div className="mt-4">
          <div className="h-4 bg-secondary rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all ${
                statusGeral === 'verde' ? 'bg-green-500' :
                statusGeral === 'amarelo' ? 'bg-amber-500' :
                'bg-red-500'
              }`}
              style={{ width: `${Math.min(100, ocupacaoAtual)}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-muted-foreground">
            <span>0%</span>
            <span className="text-green-500">Ideal &lt;70%</span>
            <span className="text-amber-500">Atenção 70-85%</span>
            <span className="text-red-500">Crítico &gt;85%</span>
            <span>100%</span>
          </div>
        </div>
        
        {/* Folga Fixa */}
        <div className="mt-4 p-3 bg-secondary/50 rounded-lg flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            ⚠️ Folga fixa de <strong className="text-cip">{(FOLGA_PRODUCAO * 100).toFixed(0)}%</strong> já descontada da capacidade total ({cipKPIs.capacidadeTotal.toFixed(0)}h → {capacidadeLiquida.toFixed(0)}h líquidas)
          </span>
          <Badge variant="outline">Não editável</Badge>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <KPICard
          title="OPs Programadas"
          value={localOPs.length}
          subtitle="Hoje + próximos dias"
          icon={<Calendar className="h-5 w-5" />}
          variant="cip"
        />
        <KPICard
          title="Em Produção"
          value={localOPs.filter(o => o.status === 'em_producao').length}
          subtitle="Ativas agora"
          icon={<Factory className="h-5 w-5" />}
          trend="up"
          trendValue="Normal"
          variant="cip"
        />
        <KPICard
          title="Aguardando"
          value={localOPs.filter(o => o.status === 'aguardando').length}
          subtitle="Na fila"
          icon={<Clock className="h-5 w-5" />}
          variant="cip"
        />
        <KPICard
          title="Bloqueadas"
          value={localOPs.filter(o => o.status === 'bloqueado').length}
          subtitle="Aguardando material"
          icon={<Ban className="h-5 w-5" />}
          trend="down"
          trendValue="Atenção"
          variant="cip"
        />
        <KPICard
          title="Pedidos CIV"
          value={pedidosDisponiveis.length}
          subtitle="A programar"
          icon={<ShoppingCart className="h-5 w-5" />}
          variant="civ"
        />
      </div>

      {/* Gráfico de Ocupação */}
      <ModuleCard title="Ocupação Programada por Dia" variant="cip">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartCapacidade}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
              <XAxis dataKey="dia" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }} formatter={(value: number) => [`${value}%`, 'Ocupação']} />
              <Bar dataKey="ocupacao" radius={[4, 4, 0, 0]} barSize={40}>
                {chartCapacidade.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={
                      entry.status === 'verde' ? '#22c55e' :
                      entry.status === 'amarelo' ? '#f59e0b' :
                      '#ef4444'
                    } 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ModuleCard>

      {/* Filtros e Ações */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <select 
            className="px-3 py-2 bg-secondary border border-border rounded-md text-sm"
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
          >
            <option value="">Todos os Status</option>
            {Object.entries(statusConfig).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>
          <select 
            className="px-3 py-2 bg-secondary border border-border rounded-md text-sm"
            value={filtroOrigem}
            onChange={(e) => setFiltroOrigem(e.target.value)}
          >
            <option value="">Todas as Origens</option>
            {Object.entries(origemConfig).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>
          <Input 
            type="date" 
            className="w-auto"
            value={filtroData}
            onChange={(e) => setFiltroData(e.target.value)}
          />
          <Button variant="outline" size="sm" onClick={() => { setFiltroStatus(''); setFiltroOrigem(''); setFiltroData(''); }}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Limpar
          </Button>
        </div>
        <div className="flex gap-2">
          {/* Botão Importar da Carteira */}
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-civ text-civ hover:bg-civ/10">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Importar Pedidos CIV ({pedidosDisponiveis.length})
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-civ" />
                  Importar Pedidos da Carteira CIV
                </DialogTitle>
                <DialogDescription>
                  Selecione os pedidos da carteira de vendas para programar na produção
                </DialogDescription>
              </DialogHeader>
              <div className="max-h-96 overflow-y-auto">
                {pedidosDisponiveis.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nenhum pedido disponível para programar</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left py-2 px-3">Pedido</th>
                        <th className="text-left py-2 px-3">Cliente</th>
                        <th className="text-left py-2 px-3">Produto</th>
                        <th className="text-right py-2 px-3">Qtd</th>
                        <th className="text-center py-2 px-3">Prazo</th>
                        <th className="text-center py-2 px-3">Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pedidosDisponiveis.map((pedido) => (
                        <tr key={pedido.id} className="border-b border-border/30 hover:bg-secondary/30">
                          <td className="py-2 px-3 font-mono">{pedido.id}</td>
                          <td className="py-2 px-3">{pedido.cliente}</td>
                          <td className="py-2 px-3">{pedido.produto}</td>
                          <td className="py-2 px-3 text-right">{pedido.quantidade}</td>
                          <td className="py-2 px-3 text-center">{new Date(pedido.prazoPrometido).toLocaleDateString('pt-BR')}</td>
                          <td className="py-2 px-3 text-center">
                            <Button 
                              size="sm" 
                              className="bg-cip hover:bg-cip/90 text-white"
                              onClick={() => handleImportarPedido(pedido)}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Programar
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* Botão Nova OP Manual */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-cip hover:bg-cip/90 text-white"
                disabled={statusGeral === 'vermelho'}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova OP Manual
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-cip" />
                  Nova Ordem de Produção
                </DialogTitle>
                <DialogDescription>
                  Entrada manual de carga diária, OP e OC
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="op">Número OP *</Label>
                  <Input
                    id="op"
                    value={novaOP.op || gerarNovaOP()}
                    onChange={(e) => setNovaOP({...novaOP, op: e.target.value})}
                    placeholder="2025-000001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="produto">Código Produto *</Label>
                  <Input
                    id="produto"
                    value={novaOP.produto}
                    onChange={(e) => setNovaOP({...novaOP, produto: e.target.value})}
                    placeholder="112401"
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Input
                    id="descricao"
                    value={novaOP.descricao}
                    onChange={(e) => setNovaOP({...novaOP, descricao: e.target.value})}
                    placeholder="SOFÁ FLEX 02 LUGARES"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantidade">Quantidade *</Label>
                  <Input
                    id="quantidade"
                    type="number"
                    min="1"
                    value={novaOP.quantidade}
                    onChange={(e) => {
                      const qtd = parseInt(e.target.value) || 1;
                      const horas = calcularHoras(qtd, novaOP.setor);
                      setNovaOP({...novaOP, quantidade: qtd, horasNecessarias: horas});
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="setor">Setor *</Label>
                  <Select value={novaOP.setor} onValueChange={(v) => {
                    const horas = calcularHoras(novaOP.quantidade, v);
                    setNovaOP({...novaOP, setor: v, horasNecessarias: horas});
                  }}>
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
                  <Label htmlFor="dataProgramada">Data Programada *</Label>
                  <Input
                    id="dataProgramada"
                    type="date"
                    value={novaOP.dataProgramada}
                    onChange={(e) => setNovaOP({...novaOP, dataProgramada: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prazoEntrega">Prazo Entrega *</Label>
                  <Input
                    id="prazoEntrega"
                    type="date"
                    value={novaOP.prazoEntrega}
                    onChange={(e) => setNovaOP({...novaOP, prazoEntrega: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="origem">Origem</Label>
                  <Select value={novaOP.origem} onValueChange={(v: any) => setNovaOP({...novaOP, origem: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="pcp">PCP</SelectItem>
                      <SelectItem value="erp">ERP</SelectItem>
                      <SelectItem value="sap">SAP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prioridade">Prioridade</Label>
                  <Select value={novaOP.prioridade} onValueChange={(v: any) => setNovaOP({...novaOP, prioridade: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baixa">Baixa</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cliente">Cliente</Label>
                  <Input
                    id="cliente"
                    value={novaOP.cliente}
                    onChange={(e) => setNovaOP({...novaOP, cliente: e.target.value})}
                    placeholder="Nome do cliente"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="horas">Horas Necessárias</Label>
                  <Input
                    id="horas"
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={novaOP.horasNecessarias}
                    onChange={(e) => setNovaOP({...novaOP, horasNecessarias: parseFloat(e.target.value) || 1})}
                  />
                </div>
              </div>

              {/* Preview de impacto */}
              <div className="p-4 bg-secondary/50 rounded-lg">
                <h4 className="text-sm font-medium mb-2">Impacto na Capacidade:</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Horas Adicionais</p>
                    <p className="text-lg font-bold text-cip">{novaOP.horasNecessarias.toFixed(1)}h</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Dias Adicionais</p>
                    <p className="text-lg font-bold text-cip">{Math.ceil(novaOP.horasNecessarias / 8)}d</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Nova Ocupação</p>
                    <p className={`text-lg font-bold ${verificarCapacidade(novaOP.horasNecessarias).novaOcupacao > 85 ? 'text-red-500' : 'text-green-500'}`}>
                      {Math.min(100, verificarCapacidade(novaOP.horasNecessarias).novaOcupacao).toFixed(0)}%
                    </p>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  className="bg-cip hover:bg-cip/90 text-white"
                  onClick={handleAdicionarOP}
                  disabled={!verificarCapacidade(novaOP.horasNecessarias).podeAdicionar}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Salvar OP
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tabela de OPs */}
      <ModuleCard title="Carga Diária Programada" variant="cip">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">OP</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Produto</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">Qtd</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">Data Prog.</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">Prazo</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Setor</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">Origem</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">Prioridade</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">Horas</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">Dias</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {opsFiltradas.map((op) => {
                const StatusIcon = statusConfig[op.status].icon;
                const diasNecessarios = calcularDiasEquivalentes(op.horasNecessarias);
                
                return (
                  <tr key={op.id} className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                    <td className="py-3 px-4 font-mono text-foreground">{op.op}</td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-foreground font-medium">{op.produto}</p>
                        <p className="text-xs text-muted-foreground">{op.descricao}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right text-foreground font-semibold">{op.quantidade}</td>
                    <td className="py-3 px-4 text-center text-muted-foreground">
                      {new Date(op.dataProgramada).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3 px-4 text-center text-foreground">
                      {new Date(op.prazoEntrega).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{op.setor}</td>
                    <td className="py-3 px-4 text-center">
                      <Badge style={{ backgroundColor: origemConfig[op.origem].color + '20', color: origemConfig[op.origem].color, border: `1px solid ${origemConfig[op.origem].color}` }}>
                        {origemConfig[op.origem].label}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge style={{ backgroundColor: prioridadeConfig[op.prioridade].color + '20', color: prioridadeConfig[op.prioridade].color }}>
                        {prioridadeConfig[op.prioridade].label}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="text-foreground">{op.horasNecessarias.toFixed(1)}h</div>
                      <div className="text-xs text-muted-foreground">{op.horasRealizadas.toFixed(1)}h feito</div>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-cip">
                      {diasNecessarios}d
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <StatusIcon className="h-4 w-4" style={{ color: statusConfig[op.status].color }} />
                        <Badge style={{ backgroundColor: statusConfig[op.status].color, color: '#fff' }}>
                          {statusConfig[op.status].label}
                        </Badge>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </ModuleCard>

      {/* Legenda */}
      <div className="p-4 bg-secondary/30 rounded-lg">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-3">Legenda de Status:</p>
            <div className="flex flex-wrap gap-4">
              {Object.entries(statusConfig).map(([key, config]) => {
                const Icon = config.icon;
                return (
                  <div key={key} className="flex items-center gap-2">
                    <Icon className="h-4 w-4" style={{ color: config.color }} />
                    <span className="text-xs" style={{ color: config.color }}>{config.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-3">Legenda de Origem:</p>
            <div className="flex flex-wrap gap-4">
              {Object.entries(origemConfig).map(([key, config]) => (
                <div key={key} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: config.color }} />
                  <span className="text-xs" style={{ color: config.color }}>{config.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
