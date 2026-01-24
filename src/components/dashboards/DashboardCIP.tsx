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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from 'recharts';
import { executiveKPIs, sectors, chartData } from '@/data/cigData';
import { KPICard } from '@/components/ui/KPICard';
import { ModuleCard } from '@/components/ui/ModuleCard';
import {
  Factory,
  Clock,
  Users,
  Activity,
  Calendar,
  Layers,
  Settings,
  Package,
  Brain,
  BarChart2,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';

type TabType = 'dashboard' | 'carteira' | 'programacao' | 'setores' | 'producao' | 'pedidos' | 'produtos' | 'rastreamento' | 'ia' | 'analytics';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
  { id: 'carteira', label: 'Carteira', icon: Package },
  { id: 'programacao', label: 'Programação Diária', icon: Calendar },
  { id: 'setores', label: 'Setores', icon: Layers },
  { id: 'producao', label: 'Produção', icon: Factory },
  { id: 'pedidos', label: 'Cadastro de Pedidos', icon: Package },
  { id: 'produtos', label: 'Cadastro de Produtos', icon: Settings },
  { id: 'rastreamento', label: 'Rastreamento', icon: Activity },
  { id: 'ia', label: 'Inteligência IA', icon: Brain },
  { id: 'analytics', label: 'Analytics', icon: BarChart2 },
];

const capacidadeData = [
  { setor: 'Corte', capacidade: 100, utilizada: 95 },
  { setor: 'Montagem', capacidade: 100, utilizada: 46 },
  { setor: 'Percintas', capacidade: 100, utilizada: 74 },
  { setor: 'Espuma', capacidade: 100, utilizada: 50 },
  { setor: 'Revestimento', capacidade: 100, utilizada: 75 },
  { setor: 'Embalagem', capacidade: 100, utilizada: 71 },
];

const lotacaoDiariaData = [
  { dia: 'Seg', lotacao: 78, meta: 80 },
  { dia: 'Ter', lotacao: 82, meta: 80 },
  { dia: 'Qua', lotacao: 75, meta: 80 },
  { dia: 'Qui', lotacao: 85, meta: 80 },
  { dia: 'Sex', lotacao: 73, meta: 80 },
];

const producaoPeriodo = [
  { mes: 'Jan', planejado: 850, realizado: 780 },
  { mes: 'Fev', planejado: 920, realizado: 875 },
  { mes: 'Mar', planejado: 880, realizado: 910 },
  { mes: 'Abr', planejado: 950, realizado: 920 },
  { mes: 'Mai', planejado: 1000, realizado: 945 },
  { mes: 'Jun', planejado: 1050, realizado: 980 },
];

const gargalosData = [
  { setor: 'Encapar Alm.', status: 'critical', lotacao: -3223, causa: 'Capacidade insuficiente' },
  { setor: 'Montagem Estrutura', status: 'warning', lotacao: 46, causa: 'Baixa eficiência' },
  { setor: 'Corte Alm. Encosto', status: 'warning', lotacao: 55, causa: 'Falta de operadores' },
];

export function DashboardCIP() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  return (
    <div className="flex animate-fade-in">
      {/* Sidebar */}
      <aside className="w-56 min-h-[calc(100vh-8rem)] border-r border-border/50 bg-card/30 p-4">
        <div className="mb-6">
          <h3 className="text-cip font-display text-lg font-bold">CIP</h3>
          <p className="text-xs text-muted-foreground">Inteligência da Produção</p>
        </div>
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as TabType)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all ${
                activeTab === item.id
                  ? 'bg-cip/20 text-cip'
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
              Central de Inteligência da Produção
            </h2>
            <p className="text-muted-foreground mt-1">
              Gestão e monitoramento da capacidade produtiva
            </p>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Capacidade Total"
            value={`${executiveKPIs.cip.capacidadeTotal.toFixed(0)}h`}
            subtitle="Horas disponíveis"
            icon={<Clock className="h-5 w-5" />}
            trend="neutral"
            trendValue="Estável"
            variant="cip"
          />
          <KPICard
            title="Utilização"
            value={`${executiveKPIs.cip.disponibilidade}%`}
            subtitle={`${executiveKPIs.cip.utilizacao.toFixed(0)}h utilizadas`}
            icon={<Activity className="h-5 w-5" />}
            trend="up"
            trendValue="+3.5%"
            variant="cip"
          />
          <KPICard
            title="Operadores"
            value={executiveKPIs.cig.operadoresTotal}
            subtitle="Em atividade"
            icon={<Users className="h-5 w-5" />}
            trend="neutral"
            trendValue="82 ativos"
            variant="cip"
          />
          <KPICard
            title="Gargalos"
            value={executiveKPIs.cip.setoresGargalo.length}
            subtitle="Setores críticos"
            icon={<AlertTriangle className="h-5 w-5" />}
            trend="down"
            trendValue="Atenção"
            variant="cip"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Planejado vs Realizado */}
          <ModuleCard title="Planejado vs Realizado" variant="cip">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={producaoPeriodo}>
                  <defs>
                    <linearGradient id="colorPlanejado" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorRealizado" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }} />
                  <Area type="monotone" dataKey="planejado" stroke="#f97316" strokeWidth={2} fill="url(#colorPlanejado)" name="Planejado" />
                  <Area type="monotone" dataKey="realizado" stroke="#22c55e" strokeWidth={2} fill="url(#colorRealizado)" name="Realizado" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ModuleCard>

          {/* Capacidade vs Utilização */}
          <ModuleCard title="Capacidade vs Utilização por Setor" variant="cip">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={capacidadeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="setor" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={{ stroke: '#333' }} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }} />
                  <Bar dataKey="utilizada" fill="#f97316" name="Utilização" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ModuleCard>

          {/* Gargalos por Setor */}
          <ModuleCard title="Gargalos Identificados" variant="cip">
            <div className="space-y-4">
              {gargalosData.map((gargalo, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    gargalo.status === 'critical'
                      ? 'border-destructive/50 bg-destructive/10'
                      : 'border-warning/50 bg-warning/10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-foreground">{gargalo.setor}</span>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        gargalo.status === 'critical'
                          ? 'bg-destructive/20 text-destructive'
                          : 'bg-warning/20 text-warning'
                      }`}
                    >
                      {gargalo.status === 'critical' ? 'CRÍTICO' : 'ATENÇÃO'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{gargalo.causa}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Lotação:</span>
                    <span className={`text-sm font-semibold ${gargalo.lotacao < 0 ? 'text-destructive' : 'text-warning'}`}>
                      {gargalo.lotacao}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ModuleCard>

          {/* Lotação Diária */}
          <ModuleCard title="Lotação Diária" variant="cip">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lotacaoDiariaData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="dia" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }} />
                  <Line type="monotone" dataKey="lotacao" stroke="#f97316" strokeWidth={3} dot={{ fill: '#f97316', strokeWidth: 2, r: 5 }} name="Lotação" />
                  <Line type="monotone" dataKey="meta" stroke="#6b7280" strokeDasharray="5 5" strokeWidth={1.5} dot={false} name="Meta" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ModuleCard>
        </div>

        {/* Produção por Período */}
        <ModuleCard title="Lotação por Setor (Detalhado)" variant="cip">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.lotacaoPorSetor.filter(s => s.lotacao > 0).slice(0, 12)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={true} vertical={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={{ stroke: '#333' }} tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="setor" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={{ stroke: '#333' }} width={120} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }} />
                <Bar dataKey="lotacao" radius={[0, 4, 4, 0]} barSize={14}>
                  {chartData.lotacaoPorSetor.filter(s => s.lotacao > 0).slice(0, 12).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.lotacao >= 80 ? '#22c55e' : entry.lotacao >= 60 ? '#f97316' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ModuleCard>
      </main>
    </div>
  );
}
