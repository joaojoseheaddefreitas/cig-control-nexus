import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, Legend, ComposedChart,
} from 'recharts';
import { civKPIs, civChartData } from '@/data/civData';
import { KPICard } from '@/components/ui/KPICard';
import { ModuleCard } from '@/components/ui/ModuleCard';
import { DollarSign, ShoppingCart, Target, TrendingUp, Percent } from 'lucide-react';

const COLORS = ['#22c55e', '#3b82f6', '#f97316', '#8b5cf6', '#14b8a6'];

const pedidosStatus = [
  { status: 'Aprovados', quantidade: 245, color: '#22c55e' },
  { status: 'Pendentes', quantidade: 87, color: '#f59e0b' },
  { status: 'Em Produção', quantidade: 156, color: '#3b82f6' },
  { status: 'Entregues', quantidade: 412, color: '#14b8a6' },
];

export function CIVDashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard
          title="Total Vendido"
          value={`R$ ${(civKPIs.totalVendido / 1000).toFixed(1)}k`}
          subtitle="Este mês"
          icon={<DollarSign className="h-5 w-5" />}
          trend="up"
          trendValue="+12.5%"
          variant="civ"
        />
        <KPICard
          title="Faturamento"
          value={`R$ ${(civKPIs.faturamento / 1000).toFixed(1)}k`}
          subtitle="Realizado"
          icon={<TrendingUp className="h-5 w-5" />}
          trend="up"
          trendValue="+8.3%"
          variant="civ"
        />
        <KPICard
          title="Pedidos Aberto"
          value={civKPIs.pedidosAberto}
          subtitle="Em carteira"
          icon={<ShoppingCart className="h-5 w-5" />}
          trend="up"
          trendValue="+28"
          variant="civ"
        />
        <KPICard
          title="Ticket Médio"
          value={`R$ ${civKPIs.ticketMedio}`}
          subtitle="Por pedido"
          icon={<Target className="h-5 w-5" />}
          trend="up"
          trendValue="+3.8%"
          variant="civ"
        />
        <KPICard
          title="Margem Média"
          value={`${civKPIs.margemMedia}%`}
          subtitle="Sobre vendas"
          icon={<Percent className="h-5 w-5" />}
          trend="down"
          trendValue="-0.5%"
          variant="civ"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vendas por Período */}
        <ModuleCard title="Vendas por Período" variant="civ">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={civChartData.vendasPeriodo}>
                <defs>
                  <linearGradient id="colorVendasCiv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="mes" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }} formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, '']} />
                <Area type="monotone" dataKey="vendas" stroke="#22c55e" strokeWidth={2} fill="url(#colorVendasCiv)" name="Vendas" />
                <Line type="monotone" dataKey="meta" stroke="#6b7280" strokeDasharray="5 5" strokeWidth={1.5} dot={false} name="Meta" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ModuleCard>

        {/* Faturamento por Canal */}
        <ModuleCard title="Faturamento por Canal" variant="civ">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={civChartData.faturamentoPorCanal} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={true} vertical={false} />
                <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="canal" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={{ stroke: '#333' }} width={100} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }} formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Valor']} />
                <Bar dataKey="valor" radius={[0, 4, 4, 0]} barSize={18}>
                  {civChartData.faturamentoPorCanal.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ModuleCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pedidos por Status */}
        <ModuleCard title="Pedidos por Status" variant="civ">
          <div className="h-72 flex items-center">
            <div className="w-1/2">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pedidosStatus} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="quantidade">
                    {pedidosStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 space-y-3">
              {pedidosStatus.map((item, index) => (
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

        {/* Demanda x Capacidade */}
        <ModuleCard title="Demanda x Capacidade (CIP)" variant="civ">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={civChartData.demandaVsCapacidade}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="mes" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }} />
                <Legend />
                <Bar dataKey="demanda" fill="#22c55e" name="Demanda" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="capacidade" stroke="#f97316" strokeWidth={2} dot={{ fill: '#f97316' }} name="Capacidade" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </ModuleCard>
      </div>
    </div>
  );
}
