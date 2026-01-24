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
  ComposedChart,
  Legend,
} from 'recharts';
import { executiveKPIs, chartData } from '@/data/cigData';
import { KPICard } from '@/components/ui/KPICard';
import { ModuleCard } from '@/components/ui/ModuleCard';
import {
  Wallet,
  TrendingUp,
  DollarSign,
  PiggyBank,
  CreditCard,
  BarChart2,
  PieChart as PieChartIcon,
  Brain,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

type TabType = 'dashboard' | 'faturamento' | 'custos' | 'margens' | 'resultados' | 'fluxo' | 'projecoes' | 'analytics';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
  { id: 'faturamento', label: 'Faturamento', icon: DollarSign },
  { id: 'custos', label: 'Custos', icon: CreditCard },
  { id: 'margens', label: 'Margens', icon: TrendingUp },
  { id: 'resultados', label: 'Resultados', icon: PieChartIcon },
  { id: 'fluxo', label: 'Fluxo de Caixa', icon: Wallet },
  { id: 'projecoes', label: 'Projeções', icon: Brain },
  { id: 'analytics', label: 'Analytics', icon: BarChart2 },
];

const receitaCusto = [
  { mes: 'Jan', receita: 145000, custo: 112000, margem: 22.8 },
  { mes: 'Fev', receita: 158000, custo: 118000, margem: 25.3 },
  { mes: 'Mar', receita: 172000, custo: 128000, margem: 25.6 },
  { mes: 'Abr', receita: 168000, custo: 125000, margem: 25.6 },
  { mes: 'Mai', receita: 179188, custo: 142888, margem: 20.3 },
  { mes: 'Jun', receita: 185000, custo: 145000, margem: 21.6 },
];

const resultadoPeriodo = [
  { mes: 'Jan', resultado: 33000 },
  { mes: 'Fev', resultado: 40000 },
  { mes: 'Mar', resultado: 44000 },
  { mes: 'Abr', resultado: 43000 },
  { mes: 'Mai', resultado: 36300 },
  { mes: 'Jun', resultado: 40000 },
];

const custosPorCategoria = [
  { categoria: 'Matéria Prima', valor: 68000, percentual: 47.6, color: '#ef4444' },
  { categoria: 'Mão de Obra', valor: 42000, percentual: 29.4, color: '#f97316' },
  { categoria: 'Energia', valor: 12000, percentual: 8.4, color: '#eab308' },
  { categoria: 'Logística', valor: 15000, percentual: 10.5, color: '#22c55e' },
  { categoria: 'Outros', valor: 5888, percentual: 4.1, color: '#6b7280' },
];

const projecoes = [
  { mes: 'Jul', projetado: 195000, otimista: 210000, pessimista: 180000 },
  { mes: 'Ago', projetado: 205000, otimista: 225000, pessimista: 185000 },
  { mes: 'Set', projetado: 215000, otimista: 240000, pessimista: 190000 },
  { mes: 'Out', projetado: 225000, otimista: 255000, pessimista: 195000 },
  { mes: 'Nov', projetado: 245000, otimista: 280000, pessimista: 210000 },
  { mes: 'Dez', projetado: 280000, otimista: 320000, pessimista: 240000 },
];

export function DashboardCIF() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  return (
    <div className="flex animate-fade-in">
      {/* Sidebar */}
      <aside className="w-56 min-h-[calc(100vh-8rem)] border-r border-border/50 bg-card/30 p-4">
        <div className="mb-6">
          <h3 className="text-cif font-display text-lg font-bold">CIF</h3>
          <p className="text-xs text-muted-foreground">Inteligência Financeira</p>
        </div>
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as TabType)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all ${
                activeTab === item.id
                  ? 'bg-cif/20 text-cif'
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
              Central de Inteligência Financeira
            </h2>
            <p className="text-muted-foreground mt-1">
              Gestão financeira e análise de resultados
            </p>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Faturamento"
            value={`R$ ${(executiveKPIs.civ.faturamentoTotal / 1000).toFixed(1)}k`}
            subtitle="Este mês"
            icon={<DollarSign className="h-5 w-5" />}
            trend="up"
            trendValue="+6.7%"
            variant="cif"
          />
          <KPICard
            title="Custo Operacional"
            value={`R$ ${(executiveKPIs.cif.custoOperacional / 1000).toFixed(1)}k`}
            subtitle="Este mês"
            icon={<CreditCard className="h-5 w-5" />}
            trend="up"
            trendValue="+3.2%"
            variant="cif"
          />
          <KPICard
            title="Resultado"
            value={`R$ ${(executiveKPIs.cif.resultadoOperacional / 1000).toFixed(1)}k`}
            subtitle="Lucro operacional"
            icon={<TrendingUp className="h-5 w-5" />}
            trend="up"
            trendValue="+5.2%"
            variant="cif"
          />
          <KPICard
            title="Margem Líquida"
            value={`${executiveKPIs.cif.margemLiquida}%`}
            subtitle="Rentabilidade"
            icon={<PiggyBank className="h-5 w-5" />}
            trend="down"
            trendValue="-2.1%"
            variant="cif"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Receita vs Custo */}
          <ModuleCard title="Receita vs Custo" variant="cif">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={receitaCusto}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }} formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, '']} />
                  <Legend />
                  <Bar dataKey="receita" fill="#22c55e" name="Receita" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="custo" fill="#ef4444" name="Custo" radius={[4, 4, 0, 0]} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </ModuleCard>

          {/* Resultado por Período */}
          <ModuleCard title="Resultado por Período" variant="cif">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={resultadoPeriodo}>
                  <defs>
                    <linearGradient id="colorResultado" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }} formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Resultado']} />
                  <Area type="monotone" dataKey="resultado" stroke="#ef4444" strokeWidth={2} fill="url(#colorResultado)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ModuleCard>

          {/* Margem por Período */}
          <ModuleCard title="Evolução da Margem" variant="cif">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={receitaCusto}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} tickFormatter={(v) => `${v}%`} domain={[15, 30]} />
                  <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }} formatter={(value: number) => [`${value.toFixed(1)}%`, 'Margem']} />
                  <Line type="monotone" dataKey="margem" stroke="#ef4444" strokeWidth={3} dot={{ fill: '#ef4444', strokeWidth: 2, r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ModuleCard>

          {/* Fluxo de Caixa */}
          <ModuleCard title="Fluxo de Caixa Semanal" variant="cif">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.fluxoCaixa}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="semana" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }} formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, '']} />
                  <Legend />
                  <Bar dataKey="entradas" fill="#22c55e" name="Entradas" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="saidas" fill="#ef4444" name="Saídas" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ModuleCard>
        </div>

        {/* Custos e Projeções */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Custos por Categoria */}
          <ModuleCard title="Composição de Custos" variant="cif">
            <div className="h-64 flex items-center">
              <div className="w-1/2">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={custosPorCategoria} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="valor">
                      {custosPorCategoria.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }} formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, '']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-1/2 space-y-2">
                {custosPorCategoria.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-xs text-muted-foreground">{item.categoria}</span>
                    </div>
                    <span className="text-xs font-semibold text-foreground">{item.percentual}%</span>
                  </div>
                ))}
              </div>
            </div>
          </ModuleCard>

          {/* Projeções Financeiras */}
          <ModuleCard title="Projeções Financeiras" variant="cif">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={projecoes}>
                  <defs>
                    <linearGradient id="colorProjetado" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }} formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, '']} />
                  <Area type="monotone" dataKey="otimista" stroke="#22c55e" strokeWidth={1} strokeDasharray="3 3" fill="transparent" name="Otimista" />
                  <Area type="monotone" dataKey="projetado" stroke="#ef4444" strokeWidth={2} fill="url(#colorProjetado)" name="Projetado" />
                  <Area type="monotone" dataKey="pessimista" stroke="#f59e0b" strokeWidth={1} strokeDasharray="3 3" fill="transparent" name="Pessimista" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ModuleCard>
        </div>
      </main>
    </div>
  );
}
