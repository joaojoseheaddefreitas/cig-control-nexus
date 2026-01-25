import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
} from 'recharts';
import { ordensProducao, cipKPIs, calcularDiasEquivalentes } from '@/data/cipData';
import { KPICard } from '@/components/ui/KPICard';
import { ModuleCard } from '@/components/ui/ModuleCard';
import { Badge } from '@/components/ui/badge';
import { Package, Clock, AlertTriangle, TrendingUp, DollarSign } from 'lucide-react';

const carteiraStatus = [
  { status: 'A Programar', quantidade: 3, cor: '#6b7280' },
  { status: 'Em Produção', quantidade: 2, cor: '#3b82f6' },
  { status: 'Concluído', quantidade: 142, cor: '#22c55e' },
  { status: 'Bloqueado', quantidade: 1, cor: '#ef4444' },
];

const carteiraPorPrioridade = [
  { prioridade: 'Urgente', quantidade: 1, valor: 8500 },
  { prioridade: 'Alta', quantidade: 3, valor: 45000 },
  { prioridade: 'Normal', quantidade: 2, valor: 12000 },
  { prioridade: 'Baixa', quantidade: 0, valor: 0 },
];

export function CIPCarteira() {
  const totalOPs = ordensProducao.length;
  const valorTotal = ordensProducao.reduce((acc, op) => acc + (op.quantidade * 150), 0); // Estimativa
  const horasTotais = ordensProducao.reduce((acc, op) => acc + op.horasNecessarias, 0);
  const diasTotais = calcularDiasEquivalentes(horasTotais);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          title="Total OPs"
          value={totalOPs}
          subtitle="Em carteira"
          icon={<Package className="h-5 w-5" />}
          variant="cip"
        />
        <KPICard
          title="Valor Estimado"
          value={`R$ ${(valorTotal / 1000).toFixed(0)}k`}
          subtitle="Carteira total"
          icon={<DollarSign className="h-5 w-5" />}
          trend="up"
          trendValue="+15%"
          variant="cip"
        />
        <KPICard
          title="Horas Necessárias"
          value={`${horasTotais.toFixed(0)}h`}
          subtitle={`${diasTotais} dias de produção`}
          icon={<Clock className="h-5 w-5" />}
          variant="cip"
        />
        <KPICard
          title="Atrasadas"
          value={cipKPIs.opsAtrasadas}
          subtitle="Requerem atenção"
          icon={<AlertTriangle className="h-5 w-5" />}
          trend="down"
          trendValue="Atenção"
          variant="cip"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Carteira por Status */}
        <ModuleCard title="Carteira por Status" variant="cip">
          <div className="h-72 flex items-center">
            <div className="w-1/2">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie 
                    data={carteiraStatus} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={50} 
                    outerRadius={80} 
                    paddingAngle={3} 
                    dataKey="quantidade"
                  >
                    {carteiraStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.cor} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 space-y-3">
              {carteiraStatus.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.cor }} />
                    <span className="text-sm text-muted-foreground">{item.status}</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{item.quantidade}</span>
                </div>
              ))}
            </div>
          </div>
        </ModuleCard>

        {/* Carteira por Prioridade */}
        <ModuleCard title="Carteira por Prioridade" variant="cip">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={carteiraPorPrioridade}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="prioridade" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }} />
                <Bar dataKey="quantidade" fill="#f97316" name="Quantidade" radius={[4, 4, 0, 0]}>
                  {carteiraPorPrioridade.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={
                        entry.prioridade === 'Urgente' ? '#ef4444' :
                        entry.prioridade === 'Alta' ? '#f59e0b' :
                        entry.prioridade === 'Normal' ? '#3b82f6' :
                        '#6b7280'
                      } 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ModuleCard>
      </div>

      {/* Tabela de Carteira */}
      <ModuleCard title="Carteira de Produção Detalhada" variant="cip">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">OP</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Produto</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Cliente</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">Qtd</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">Prazo</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">Horas</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">Dias</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">Prioridade</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {ordensProducao.map((op) => (
                <tr key={op.id} className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                  <td className="py-3 px-4 font-mono text-foreground">{op.op}</td>
                  <td className="py-3 px-4">
                    <p className="text-foreground font-medium">{op.descricao}</p>
                    <p className="text-xs text-muted-foreground">{op.produto}</p>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{op.cliente || '-'}</td>
                  <td className="py-3 px-4 text-right font-bold text-foreground">{op.quantidade}</td>
                  <td className="py-3 px-4 text-center text-foreground">
                    {new Date(op.prazoEntrega).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="py-3 px-4 text-right text-foreground">{op.horasNecessarias.toFixed(1)}h</td>
                  <td className="py-3 px-4 text-right font-bold text-cip">
                    {calcularDiasEquivalentes(op.horasNecessarias)}d
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Badge variant={
                      op.prioridade === 'urgente' ? 'destructive' :
                      op.prioridade === 'alta' ? 'default' :
                      'secondary'
                    }>
                      {op.prioridade.charAt(0).toUpperCase() + op.prioridade.slice(1)}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Badge style={{ 
                      backgroundColor: 
                        op.status === 'concluido' ? '#22c55e' :
                        op.status === 'em_producao' ? '#3b82f6' :
                        op.status === 'bloqueado' ? '#ef4444' :
                        '#f59e0b',
                      color: '#fff'
                    }}>
                      {op.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ModuleCard>
    </div>
  );
}
