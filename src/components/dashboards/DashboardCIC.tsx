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
} from 'recharts';
import { executiveKPIs, chartData } from '@/data/cigData';
import { KPICard } from '@/components/ui/KPICard';
import { ModuleCard } from '@/components/ui/ModuleCard';
import {
  Package,
  Truck,
  AlertTriangle,
  ShoppingCart,
  BarChart2,
  Warehouse,
  Users,
  Brain,
  Activity,
} from 'lucide-react';

type TabType = 'dashboard' | 'consumo' | 'estoques' | 'compras' | 'fornecedores' | 'mrp' | 'ia' | 'analytics';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
  { id: 'consumo', label: 'Consumo de Materiais', icon: Activity },
  { id: 'estoques', label: 'Estoques', icon: Warehouse },
  { id: 'compras', label: 'Compras', icon: ShoppingCart },
  { id: 'fornecedores', label: 'Fornecedores', icon: Users },
  { id: 'mrp', label: 'Necessidades (MRP)', icon: Package },
  { id: 'ia', label: 'Inteligência IA', icon: Brain },
  { id: 'analytics', label: 'Analytics', icon: BarChart2 },
];

const consumoPeriodo = [
  { mes: 'Jan', consumo: 145000, planejado: 150000 },
  { mes: 'Fev', consumo: 152000, planejado: 150000 },
  { mes: 'Mar', consumo: 148000, planejado: 155000 },
  { mes: 'Abr', consumo: 160000, planejado: 158000 },
  { mes: 'Mai', consumo: 156780, planejado: 160000 },
  { mes: 'Jun', consumo: 165000, planejado: 162000 },
];

const comprasStatus = [
  { status: 'Realizadas', valor: 425000, color: '#22c55e' },
  { status: 'Pendentes', valor: 185000, color: '#f59e0b' },
  { status: 'Em Trânsito', valor: 95000, color: '#3b82f6' },
  { status: 'Atrasadas', valor: 45000, color: '#ef4444' },
];

const fornecedoresTop = [
  { nome: 'Madeireira São Paulo', valor: 125000, entregas: 98 },
  { nome: 'Têxtil Guarulhos', valor: 98000, entregas: 95 },
  { nome: 'Espumas Brasil', valor: 87000, entregas: 92 },
  { nome: 'Metalúrgica ABC', valor: 65000, entregas: 88 },
  { nome: 'Ferragens Nacional', valor: 45000, entregas: 94 },
];

export function DashboardCIC() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  return (
    <div className="flex animate-fade-in">
      {/* Sidebar */}
      <aside className="w-56 min-h-[calc(100vh-8rem)] border-r border-border/50 bg-card/30 p-4">
        <div className="mb-6">
          <h3 className="text-cic font-display text-lg font-bold">CIC</h3>
          <p className="text-xs text-muted-foreground">Compras e Materiais</p>
        </div>
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as TabType)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all ${
                activeTab === item.id
                  ? 'bg-cic/20 text-cic'
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
              Central de Inteligência de Compras
            </h2>
            <p className="text-muted-foreground mt-1">
              Gestão de materiais e suprimentos
            </p>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Materiais Críticos"
            value={executiveKPIs.cic.materiaisCriticos}
            subtitle="Abaixo do mínimo"
            icon={<AlertTriangle className="h-5 w-5" />}
            trend="down"
            trendValue="Atenção"
            variant="cic"
          />
          <KPICard
            title="Compras Pendentes"
            value={executiveKPIs.cic.comprasPendentes}
            subtitle="Ordens abertas"
            icon={<ShoppingCart className="h-5 w-5" />}
            trend="neutral"
            trendValue="45 ordens"
            variant="cic"
          />
          <KPICard
            title="Valor em Estoque"
            value={`R$ ${(executiveKPIs.cic.estoqueTotal / 1000).toFixed(0)}k`}
            subtitle="Total valorizado"
            icon={<Warehouse className="h-5 w-5" />}
            trend="up"
            trendValue="+2.5%"
            variant="cic"
          />
          <KPICard
            title="Risco de Ruptura"
            value={executiveKPIs.cic.riscoRuptura}
            subtitle="Itens em alerta"
            icon={<Package className="h-5 w-5" />}
            trend="down"
            trendValue="Monitorar"
            variant="cic"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Consumo por Período */}
          <ModuleCard title="Consumo por Período" variant="cic">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={consumoPeriodo}>
                  <defs>
                    <linearGradient id="colorConsumo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }} formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, '']} />
                  <Area type="monotone" dataKey="consumo" stroke="#a855f7" strokeWidth={2} fill="url(#colorConsumo)" name="Consumo Real" />
                  <Line type="monotone" dataKey="planejado" stroke="#6b7280" strokeDasharray="5 5" strokeWidth={1.5} dot={false} name="Planejado" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ModuleCard>

          {/* Materiais Críticos */}
          <ModuleCard title="Materiais Críticos" variant="cic">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.materiaisCriticos}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="material" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={{ stroke: '#333' }} angle={-15} textAnchor="end" height={50} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }} />
                  <Bar dataKey="estoque" fill="#a855f7" name="Estoque Atual" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="minimo" fill="#6b7280" name="Estoque Mínimo" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ModuleCard>

          {/* Compras por Status */}
          <ModuleCard title="Compras por Status" variant="cic">
            <div className="h-72 flex items-center">
              <div className="w-1/2">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={comprasStatus} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="valor">
                      {comprasStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }} formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, '']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-1/2 space-y-3">
                {comprasStatus.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-muted-foreground">{item.status}</span>
                    </div>
                    <span className="text-sm font-semibold text-foreground">R$ {(item.valor / 1000).toFixed(0)}k</span>
                  </div>
                ))}
              </div>
            </div>
          </ModuleCard>

          {/* Compras Planejadas vs Realizadas */}
          <ModuleCard title="Top Fornecedores" variant="cic">
            <div className="space-y-4">
              {fornecedoresTop.map((fornecedor, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                  <div>
                    <p className="font-medium text-foreground">{fornecedor.nome}</p>
                    <p className="text-xs text-muted-foreground">Pontualidade: {fornecedor.entregas}%</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-cic">R$ {(fornecedor.valor / 1000).toFixed(0)}k</p>
                    <div className="flex items-center gap-1 mt-1">
                      <div className={`w-2 h-2 rounded-full ${fornecedor.entregas >= 95 ? 'bg-success' : fornecedor.entregas >= 90 ? 'bg-warning' : 'bg-destructive'}`} />
                      <span className="text-xs text-muted-foreground">{fornecedor.entregas >= 95 ? 'Excelente' : fornecedor.entregas >= 90 ? 'Bom' : 'Regular'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ModuleCard>
        </div>
      </main>
    </div>
  );
}
