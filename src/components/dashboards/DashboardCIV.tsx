import { useState } from 'react';
import {
  BarChart2, UserCheck, Store, FileText, Target, Calculator,
  Users, Package, TrendingUp, Briefcase, Brain, LineChart,
  Menu, X, ChevronLeft, ChevronRight, ArrowUpCircle, ArrowDownCircle, Receipt
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

// Import all CIV tabs
import { CIVDashboard } from '@/components/civ/CIVDashboard';
import { CIVLeads } from '@/components/civ/CIVLeads';
import { CIVLojas } from '@/components/civ/CIVLojas';
import { CIVCarteira } from '@/components/civ/CIVCarteira';
import { CIVPipeline } from '@/components/civ/CIVPipeline';
import { CIVSimulacao } from '@/components/civ/CIVSimulacao';
import { CIVClientes } from '@/components/civ/CIVClientes';
import { CIVProdutos } from '@/components/civ/CIVProdutos';
import { CIVMercado } from '@/components/civ/CIVMercado';
import { CIVProjetos } from '@/components/civ/CIVProjetos';
import { CIVIA } from '@/components/civ/CIVIA';
import { CIVAnalytics } from '@/components/civ/CIVAnalytics';

type TabType = 'dashboard' | 'leads' | 'lojas' | 'carteira' | 'pipeline' | 'simulacao' | 'clientes' | 'produtos' | 'mercado' | 'projetos' | 'ia' | 'analytics';

// Menu items com tipos de operação
const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart2, tipo: 'visualizacao' },
  { id: 'leads', label: 'Leads & Oportunidades', icon: UserCheck, tipo: 'visualizacao' },
  { id: 'lojas', label: 'Lojas, Canais e Vendedores', icon: Store, tipo: 'visualizacao' },
  { id: 'carteira', label: 'Carteira de Pedidos', icon: FileText, tipo: 'entrada_saida', badge: 'PEDIDOS' },
  { id: 'pipeline', label: 'Pipeline Comercial', icon: Target, tipo: 'visualizacao' },
  { id: 'simulacao', label: 'Simulação de Prazo', icon: Calculator, tipo: 'visualizacao' },
  { id: 'clientes', label: 'Clientes & Relacionamento', icon: Users, tipo: 'visualizacao' },
  { id: 'produtos', label: 'Produtos & Mix', icon: Package, tipo: 'cadastro', badge: 'CADASTRO' },
  { id: 'mercado', label: 'Pesquisa de Mercado', icon: TrendingUp, tipo: 'visualizacao' },
  { id: 'projetos', label: 'Projetos Especiais', icon: Briefcase, tipo: 'visualizacao' },
  { id: 'ia', label: 'Inteligência IA', icon: Brain, tipo: 'visualizacao' },
  { id: 'analytics', label: 'Analytics Avançado', icon: LineChart, tipo: 'visualizacao' },
];

export function DashboardCIV() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isMobile = useIsMobile();

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <CIVDashboard />;
      case 'leads': return <CIVLeads />;
      case 'lojas': return <CIVLojas />;
      case 'carteira': return <CIVCarteira />;
      case 'pipeline': return <CIVPipeline />;
      case 'simulacao': return <CIVSimulacao />;
      case 'clientes': return <CIVClientes />;
      case 'produtos': return <CIVProdutos />;
      case 'mercado': return <CIVMercado />;
      case 'projetos': return <CIVProjetos />;
      case 'ia': return <CIVIA />;
      case 'analytics': return <CIVAnalytics />;
      default: return <CIVDashboard />;
    }
  };

  const handleTabChange = (tabId: TabType) => {
    setActiveTab(tabId);
    setSidebarOpen(false);
  };

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case 'entrada_saida':
        return <span className="ml-auto text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">PEDIDOS</span>;
      case 'cadastro':
        return <span className="ml-auto text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">CADASTRO</span>;
      default:
        return null;
    }
  };

  const SidebarContent = ({ isCollapsed = false }: { isCollapsed?: boolean }) => (
    <>
      <div className={cn("mb-6", isCollapsed && "text-center")}>
        {!isCollapsed ? (
          <>
            <h3 className="text-civ font-display text-lg font-bold">CIV CONTROL</h3>
            <p className="text-xs text-muted-foreground">Central de Inteligência de Vendas</p>
          </>
        ) : (
          <div className="w-8 h-8 rounded-lg bg-civ/20 flex items-center justify-center mx-auto">
            <Store className="h-4 w-4 text-civ" />
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
                ? 'bg-civ/20 text-civ'
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
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Fluxo CIV</p>
          <div className="flex items-center gap-2 text-xs">
            <ArrowUpCircle className="h-3 w-3 text-green-400" />
            <span className="text-muted-foreground">Pedido = Via Carteira</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <ArrowDownCircle className="h-3 w-3 text-orange-400" />
            <span className="text-muted-foreground">Baixa = Via NF + Expedição</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Package className="h-3 w-3 text-blue-400" />
            <span className="text-muted-foreground">Produto = Cadastro Vendas</span>
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
              <div className="w-2 h-2 rounded-full bg-civ animate-pulse" />
              <span className="text-sm font-semibold text-civ">CIV CONTROL</span>
            </div>
            
            <div className="w-10" />
          </div>
          
          {/* Tab atual */}
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
          sidebarCollapsed ? 'w-16' : 'w-60'
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
        'flex-1 overflow-x-hidden',
        isMobile ? 'pt-24 px-3 pb-4' : 'p-4 lg:p-6'
      )}>
        {/* Header desktop */}
        {!isMobile && (
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground">
                {menuItems.find(m => m.id === activeTab)?.label || 'Dashboard'}
              </h2>
              {menuItems.find(m => m.id === activeTab)?.tipo === 'entrada_saida' && (
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full font-medium">
                  CARTEIRA DE PEDIDOS
                </span>
              )}
              {menuItems.find(m => m.id === activeTab)?.tipo === 'cadastro' && (
                <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full font-medium">
                  CADASTRO VENDAS
                </span>
              )}
            </div>
            <p className="text-muted-foreground mt-1">
              CIV CONTROL – Central de Inteligência de Vendas
            </p>
          </div>
        )}
        
        {/* Aviso sobre fluxo */}
        {(activeTab === 'carteira' || activeTab === 'produtos') && (
          <div className="mb-4 p-3 rounded-lg bg-civ/10 border border-civ/30">
            <div className="flex items-start gap-3">
              <Receipt className="h-5 w-5 text-civ flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                {activeTab === 'carteira' ? (
                  <>
                    <strong className="text-civ">Carteira de Pedidos (CIV)</strong>
                    <p className="text-muted-foreground mt-1">
                      Entrada via cadastro de pedidos. Baixa/saída ocorre pela <strong>Nota Fiscal</strong> gerada pelo Financeiro e entregue pela <strong>Expedição</strong> no momento do embarque.
                    </p>
                  </>
                ) : (
                  <>
                    <strong className="text-civ">Cadastro de Produtos (CIV)</strong>
                    <p className="text-muted-foreground mt-1">
                      Produtos novos são cadastrados aqui. Produtos descontinuados são <strong>retirados da Carteira</strong> (não comercializados mais).
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Conteúdo da aba */}
        <div className="animate-fade-in">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
