import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
  ComposedChart,
} from 'recharts';
import { executiveKPIs, chartData, products } from '@/data/cigData';
import { KPICard } from '@/components/ui/KPICard';
import { ModuleCard } from '@/components/ui/ModuleCard';
import {
  TrendingUp,
  Users,
  ShoppingCart,
  DollarSign,
  Target,
  BarChart2,
  FileText,
  UserCheck,
  Brain,
  ArrowUpRight,
} from 'lucide-react';

const COLORS = ['#22c55e', '#34d399', '#4ade80', '#6ee7b7', '#a7f3d0'];

// Mock data for CIV
const leadsData = [
  { mes: 'Jan', leads: 120, convertidos: 45 },
  { mes: 'Fev', leads: 145, convertidos: 58 },
  { mes: 'Mar', leads: 132, convertidos: 52 },
  { mes: 'Abr', leads: 168, convertidos: 71 },
  { mes: 'Mai', leads: 185, convertidos: 82 },
  { mes: 'Jun', leads: 210, convertidos: 95 },
];

const pipelineData = [
  { etapa: 'Prospecção', quantidade: 85, valor: 425000 },
  { etapa: 'Qualificação', quantidade: 62, valor: 310000 },
  { etapa: 'Proposta', quantidade: 38, valor: 228000 },
  { etapa: 'Negociação', quantidade: 24, valor: 192000 },
  { etapa: 'Fechamento', quantidade: 15, valor: 135000 },
];

const ticketMedioData = [
  { mes: 'Jan', ticket: 215 },
  { mes: 'Fev', ticket: 228 },
  { mes: 'Mar', ticket: 235 },
  { mes: 'Abr', ticket: 242 },
  { mes: 'Mai', ticket: 240 },
  { mes: 'Jun', ticket: 248 },
];

const pedidosStatus = [
  { status: 'Aprovados', quantidade: 245, color: '#22c55e' },
  { status: 'Pendentes', quantidade: 87, color: '#f59e0b' },
  { status: 'Em Produção', quantidade: 156, color: '#3b82f6' },
  { status: 'Entregues', quantidade: 412, color: '#14b8a6' },
];

type TabType = 'dashboard' | 'leads' | 'carteira' | 'pipeline' | 'faturamento' | 'clientes' | 'produtos' | 'ia' | 'analytics';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
  { id: 'leads', label: 'Leads', icon: UserCheck },
  { id: 'carteira', label: 'Carteira de Pedidos', icon: FileText },
  { id: 'pipeline', label: 'Pipeline', icon: Target },
  { id: 'faturamento', label: 'Faturamento', icon: DollarSign },
  { id: 'clientes', label: 'Clientes', icon: Users },
  { id: 'produtos', label: 'Produtos', icon: ShoppingCart },
  { id: 'ia', label: 'Inteligência IA', icon: Brain },
  { id: 'analytics', label: 'Analytics', icon: TrendingUp },
];

export function DashboardCIV() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  return (
    <div className="flex animate-fade-in">
      {/* Sidebar */}
      <aside className="w-56 min-h-[calc(100vh-8rem)] border-r border-border/50 bg-card/30 p-4">
        <div className="mb-6">
          <h3 className="text-civ font-display text-lg font-bold">CIV</h3>
          <p className="text-xs text-muted-foreground">Inteligência de Vendas</p>
        </div>
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as TabType)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all ${
                activeTab === item.id
                  ? 'bg-civ/20 text-civ'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <main className="flex-1 p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground">
              Central de Inteligência de Vendas
            </h2>
            <p className="text-muted-foreground mt-1">
              Gestão comercial e análise de desempenho de vendas
            </p>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Faturamento Total"
            value={`R$ ${(executiveKPIs.civ.faturamentoTotal / 1000).toFixed(1)}k`}
            subtitle="Este mês"
            icon={<DollarSign className="h-5 w-5" />}
            trend="up"
            trendValue="+12.5% vs mês anterior"
            variant="civ"
          />
          <KPICard
            title="Pedidos Ativos"
            value={executiveKPIs.civ.pedidosAtivos}
            subtitle="Em carteira"
            icon={<ShoppingCart className="h-5 w-5" />}
            trend="up"
            trendValue="+28 novos"
            variant="civ"
          />
          <KPICard
            title="Ticket Médio"
            value={`R$ ${executiveKPIs.civ.ticketMedio.toFixed(0)}`}
            subtitle="Por pedido"
            icon={<Target className="h-5 w-5" />}
            trend="up"
            trendValue="+3.8%"
            variant="civ"
          />
          <KPICard
            title="Taxa de Conversão"
            value="42%"
            subtitle="Leads → Vendas"
            icon={<TrendingUp className="h-5 w-5" />}
            trend="up"
            trendValue="+5.2%"
            variant="civ"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Vendas por Período */}
          <ModuleCard title="Vendas por Período" variant="civ">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData.faturamentoPeriodo}>
                  <defs>
                    <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }} formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, '']} />
                  <Area type="monotone" dataKey="valor" stroke="#22c55e" strokeWidth={2} fill="url(#colorVendas)" name="Faturado" />
                  <Line type="monotone" dataKey="meta" stroke="#6b7280" strokeDasharray="5 5" strokeWidth={1.5} dot={false} name="Meta" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ModuleCard>

          {/* Conversão de Leads */}
          <ModuleCard title="Conversão de Leads" variant="civ">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={leadsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }} />
                  <Legend />
                  <Bar dataKey="leads" fill="#4ade80" name="Leads Recebidos" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="convertidos" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e' }} name="Convertidos" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </ModuleCard>

          {/* Ticket Médio */}
          <ModuleCard title="Evolução do Ticket Médio" variant="civ">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ticketMedioData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} tickFormatter={(v) => `R$${v}`} />
                  <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }} formatter={(value: number) => [`R$ ${value}`, 'Ticket Médio']} />
                  <Line type="monotone" dataKey="ticket" stroke="#22c55e" strokeWidth={3} dot={{ fill: '#22c55e', strokeWidth: 2, r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ModuleCard>

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
        </div>

        {/* Pipeline de Vendas */}
        <ModuleCard title="Pipeline de Vendas" variant="civ">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={true} vertical={false} />
                <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="etapa" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} width={100} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }} formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Valor']} />
                <Bar dataKey="valor" fill="#22c55e" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ModuleCard>
      </main>
    </div>
  );
}
