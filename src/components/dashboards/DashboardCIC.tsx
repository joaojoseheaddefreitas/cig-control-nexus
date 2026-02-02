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
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowUpCircle,
  ArrowDownCircle,
  ClipboardList,
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

type TabType = 'dashboard' | 'consumo' | 'estoques' | 'compras' | 'fornecedores' | 'mrp' | 'ia' | 'analytics';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart2, tipo: 'visualizacao' },
  { id: 'consumo', label: 'Consumo de Materiais', icon: Activity, tipo: 'visualizacao' },
  { id: 'estoques', label: 'Estoques', icon: Warehouse, tipo: 'entrada_saida', badge: 'ENTRADA' },
  { id: 'compras', label: 'Compras', icon: ShoppingCart, tipo: 'visualizacao' },
  { id: 'fornecedores', label: 'Fornecedores', icon: Users, tipo: 'visualizacao' },
  { id: 'mrp', label: 'Necessidades (MRP)', icon: Package, tipo: 'baixa', badge: 'REQUISIÇÃO' },
  { id: 'ia', label: 'Inteligência IA', icon: Brain, tipo: 'visualizacao' },
  { id: 'analytics', label: 'Analytics', icon: BarChart2, tipo: 'visualizacao' },
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isMobile = useIsMobile();

  const handleTabChange = (tabId: TabType) => {
    setActiveTab(tabId);
    setSidebarOpen(false);
  };

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case 'entrada_saida':
        return <span className="ml-auto text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">ENTRADA</span>;
      case 'baixa':
        return <span className="ml-auto text-[10px] bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded">REQUISIÇÃO</span>;
      default:
        return null;
    }
  };

  const SidebarContent = ({ isCollapsed = false }: { isCollapsed?: boolean }) => (
    <>
      <div className={cn("mb-6", isCollapsed && "text-center")}>
        {!isCollapsed ? (
          <>
            <h3 className="text-cic font-display text-lg font-bold">CIC CONTROL</h3>
            <p className="text-xs text-muted-foreground">Compras e Materiais</p>
          </>
        ) : (
          <div className="w-8 h-8 rounded-lg bg-cic/20 flex items-center justify-center mx-auto">
            <Warehouse className="h-4 w-4 text-cic" />
          </div>
        )}
      </div>
      
      <nav className="space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleTabChange(item.id as TabType)}
            title={isCollapsed ? item.label : undefined}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all',
              activeTab === item.id
                ? 'bg-cic/20 text-cic'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50',
              isCollapsed && 'justify-center px-2'
            )}
          >
            <item.icon className="h-4 w-4 flex-shrink-0" />
            {!isCollapsed && (
              <>
                <span className="truncate flex-1 text-left">{item.label}</span>
                {getTipoBadge(item.tipo)}
              </>
            )}
          </button>
        ))}
      </nav>

      {/* Legenda */}
      {!isCollapsed && (
        <div className="mt-6 pt-4 border-t border-border/30 space-y-2">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Fluxo CIC</p>
          <div className="flex items-center gap-2 text-xs">
            <ArrowUpCircle className="h-3 w-3 text-green-400" />
            <span className="text-muted-foreground">Entrada = Após conferência</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <ArrowDownCircle className="h-3 w-3 text-orange-400" />
            <span className="text-muted-foreground">Saída = Via requisição</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <ClipboardList className="h-3 w-3 text-blue-400" />
            <span className="text-muted-foreground">MRP = Necessidades</span>
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="flex animate-fade-in min-h-screen">
      {/* Mobile Header */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-b border-border/50 px-4 py-3 safe-area-top">
          <div className="flex items-center justify-between">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-4 overflow-y-auto">
                <SheetClose className="absolute right-4 top-4">
                  <X className="h-5 w-5" />
                </SheetClose>
                <SidebarContent />
              </SheetContent>
            </Sheet>
            
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cic animate-pulse" />
              <span className="text-sm font-semibold text-cic">CIC CONTROL</span>
            </div>
            
            <div className="w-10" />
          </div>
          
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Aba:</span>
            <span className="text-sm font-medium text-foreground">
              {menuItems.find(m => m.id === activeTab)?.label}
            </span>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className={cn(
          'min-h-[calc(100vh-4rem)] border-r border-border/50 bg-card/30 p-4 flex-shrink-0 transition-all duration-300 relative',
          sidebarCollapsed ? 'w-16' : 'w-56'
        )}>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="absolute -right-3 top-6 w-6 h-6 bg-card border border-border rounded-full flex items-center justify-center hover:bg-secondary transition-colors z-10"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-3 w-3" />
            ) : (
              <ChevronLeft className="h-3 w-3" />
            )}
          </button>
          
          <SidebarContent isCollapsed={sidebarCollapsed} />
        </aside>
      )}

      {/* Content */}
      <main className={cn(
        'flex-1 space-y-6 overflow-x-hidden',
        isMobile ? 'pt-24 px-3 pb-4' : 'p-4 lg:p-6'
      )}>
        {/* Header */}
        {!isMobile && (
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground">
                  {menuItems.find(m => m.id === activeTab)?.label || 'Dashboard'}
                </h2>
                {menuItems.find(m => m.id === activeTab)?.tipo === 'entrada_saida' && (
                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full font-medium">
                    ↑ ENTRADA ESTOQUE
                  </span>
                )}
                {menuItems.find(m => m.id === activeTab)?.tipo === 'baixa' && (
                  <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full font-medium">
                    ↓ REQUISIÇÃO MATERIAIS
                  </span>
                )}
              </div>
              <p className="text-muted-foreground mt-1">
                CIC CONTROL – Gestão de Materiais e Suprimentos
              </p>
            </div>
          </div>
        )}

        {/* Aviso sobre fluxo */}
        {(activeTab === 'estoques' || activeTab === 'mrp') && (
          <div className="p-3 rounded-lg bg-cic/10 border border-cic/30">
            <div className="flex items-start gap-3">
              <Warehouse className="h-5 w-5 text-cic flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                {activeTab === 'estoques' ? (
                  <>
                    <strong className="text-cic">Entrada em Estoque (CIC)</strong>
                    <p className="text-muted-foreground mt-1">
                      Materiais entram em estoque <strong>após conferência física</strong>. A entrada registra quantidade, lote e data de recebimento.
                    </p>
                  </>
                ) : (
                  <>
                    <strong className="text-cic">Requisição de Materiais (CIC)</strong>
                    <p className="text-muted-foreground mt-1">
                      Saída/baixa de materiais ocorre via <strong>requisição de materiais</strong> emitida pela produção (CIP).
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {/* Consumo por Período */}
          <ModuleCard title="Consumo por Período" variant="cic">
            <div className="h-64 lg:h-72">
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
            <div className="h-64 lg:h-72">
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
            <div className="h-64 lg:h-72 flex flex-col lg:flex-row items-center">
              <div className="w-full lg:w-1/2 h-48 lg:h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={comprasStatus} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="valor">
                      {comprasStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }} formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, '']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full lg:w-1/2 space-y-2 lg:space-y-3 mt-2 lg:mt-0">
                {comprasStatus.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-xs lg:text-sm text-muted-foreground">{item.status}</span>
                    </div>
                    <span className="text-xs lg:text-sm font-semibold text-foreground">R$ {(item.valor / 1000).toFixed(0)}k</span>
                  </div>
                ))}
              </div>
            </div>
          </ModuleCard>

          {/* Top Fornecedores */}
          <ModuleCard title="Top Fornecedores" variant="cic">
            <div className="space-y-3 lg:space-y-4">
              {fornecedoresTop.map((fornecedor, index) => (
                <div key={index} className="flex items-center justify-between p-2 lg:p-3 rounded-lg bg-secondary/30">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground text-sm truncate">{fornecedor.nome}</p>
                    <p className="text-xs text-muted-foreground">Pontualidade: {fornecedor.entregas}%</p>
                  </div>
                  <div className="text-right ml-2 flex-shrink-0">
                    <p className="font-semibold text-cic text-sm">R$ {(fornecedor.valor / 1000).toFixed(0)}k</p>
                    <div className="flex items-center gap-1 mt-1 justify-end">
                      <div className={`w-2 h-2 rounded-full ${fornecedor.entregas >= 95 ? 'bg-success' : fornecedor.entregas >= 90 ? 'bg-warning' : 'bg-destructive'}`} />
                      <span className="text-[10px] text-muted-foreground">{fornecedor.entregas >= 95 ? 'Excelente' : fornecedor.entregas >= 90 ? 'Bom' : 'Regular'}</span>
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
