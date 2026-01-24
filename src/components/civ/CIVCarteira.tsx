import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { carteiraPedidos } from '@/data/civData';
import { KPICard } from '@/components/ui/KPICard';
import { ModuleCard } from '@/components/ui/ModuleCard';
import { Badge } from '@/components/ui/badge';
import { FileText, DollarSign, Clock, AlertTriangle } from 'lucide-react';

const statusColors: Record<string, string> = {
  a_programar: '#3b82f6',
  em_producao: '#f59e0b',
  produzido: '#22c55e',
  faturado: '#14b8a6',
};

const statusLabels: Record<string, string> = {
  a_programar: 'A Programar',
  em_producao: 'Em Produção',
  produzido: 'Produzido',
  faturado: 'Faturado',
};

const prioridadeColors: Record<string, string> = {
  normal: '#6b7280',
  alta: '#f59e0b',
  urgente: '#ef4444',
};

export function CIVCarteira() {
  const totalPedidos = carteiraPedidos.length;
  const valorTotal = carteiraPedidos.reduce((acc, p) => acc + p.valor, 0);
  const pedidosUrgentes = carteiraPedidos.filter(p => p.prioridade === 'urgente').length;
  const aProgramar = carteiraPedidos.filter(p => p.status === 'a_programar').length;

  const pedidosPorStatus = [
    { status: 'A Programar', quantidade: carteiraPedidos.filter(p => p.status === 'a_programar').length, color: '#3b82f6' },
    { status: 'Em Produção', quantidade: carteiraPedidos.filter(p => p.status === 'em_producao').length, color: '#f59e0b' },
    { status: 'Produzido', quantidade: carteiraPedidos.filter(p => p.status === 'produzido').length, color: '#22c55e' },
    { status: 'Faturado', quantidade: carteiraPedidos.filter(p => p.status === 'faturado').length, color: '#14b8a6' },
  ];

  const valorPorCanal = [
    { canal: 'B2B', valor: carteiraPedidos.filter(p => p.canal === 'B2B').reduce((acc, p) => acc + p.valor, 0) },
    { canal: 'Varejo', valor: carteiraPedidos.filter(p => p.canal === 'Varejo').reduce((acc, p) => acc + p.valor, 0) },
    { canal: 'Projeto', valor: carteiraPedidos.filter(p => p.canal === 'Projeto').reduce((acc, p) => acc + p.valor, 0) },
    { canal: 'Digital', valor: carteiraPedidos.filter(p => p.canal === 'Digital').reduce((acc, p) => acc + p.valor, 0) },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          title="Total Pedidos"
          value={totalPedidos}
          subtitle="Em carteira"
          icon={<FileText className="h-5 w-5" />}
          variant="civ"
        />
        <KPICard
          title="Valor Total"
          value={`R$ ${(valorTotal / 1000).toFixed(0)}k`}
          subtitle="Carteira"
          icon={<DollarSign className="h-5 w-5" />}
          trend="up"
          trendValue="+22%"
          variant="civ"
        />
        <KPICard
          title="A Programar"
          value={aProgramar}
          subtitle="Aguardando CIP"
          icon={<Clock className="h-5 w-5" />}
          variant="civ"
        />
        <KPICard
          title="Urgentes"
          value={pedidosUrgentes}
          subtitle="Prioridade máxima"
          icon={<AlertTriangle className="h-5 w-5" />}
          trend="down"
          trendValue="-2"
          variant="civ"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ModuleCard title="Pedidos por Status" variant="civ">
          <div className="h-72 flex items-center">
            <div className="w-1/2">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie 
                    data={pedidosPorStatus} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={50} 
                    outerRadius={80} 
                    paddingAngle={3} 
                    dataKey="quantidade"
                  >
                    {pedidosPorStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 space-y-3">
              {pedidosPorStatus.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-muted-foreground">{item.status}</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{item.quantidade}</span>
                </div>
              ))}
            </div>
          </div>
        </ModuleCard>

        <ModuleCard title="Valor por Canal" variant="civ">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={valorPorCanal}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="canal" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }} formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Valor']} />
                <Bar dataKey="valor" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ModuleCard>
      </div>

      {/* Tabela de Carteira */}
      <ModuleCard title="Carteira Total de Pedidos" variant="civ">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Pedido</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Cliente</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Loja/Canal</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Produto</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">Qtd</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">Valor</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">Margem</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">Prazo</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">Prioridade</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {carteiraPedidos.map((pedido) => (
                <tr key={pedido.id} className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                  <td className="py-3 px-4 font-mono text-foreground">{pedido.id}</td>
                  <td className="py-3 px-4 text-foreground">{pedido.cliente}</td>
                  <td className="py-3 px-4 text-muted-foreground">{pedido.loja} / {pedido.canal}</td>
                  <td className="py-3 px-4 text-foreground">{pedido.produto}</td>
                  <td className="py-3 px-4 text-right text-foreground">{pedido.quantidade}</td>
                  <td className="py-3 px-4 text-right text-foreground">R$ {pedido.valor.toLocaleString('pt-BR')}</td>
                  <td className="py-3 px-4 text-right text-civ font-semibold">{pedido.margem}%</td>
                  <td className="py-3 px-4 text-center text-muted-foreground">{new Date(pedido.prazoPrometido).toLocaleDateString('pt-BR')}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: prioridadeColors[pedido.prioridade] }} title={pedido.prioridade} />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Badge style={{ backgroundColor: statusColors[pedido.status], color: '#fff' }}>
                      {statusLabels[pedido.status]}
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
