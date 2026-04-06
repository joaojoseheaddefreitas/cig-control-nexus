import { useState } from 'react';
import {
  BarChart2, Layers, Factory, Package, 
  Brain, LineChart, Menu, X, ChevronLeft, ChevronRight,
  ArrowDownCircle, ArrowUpCircle, Truck, Home, ClipboardCheck, Search, Activity
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

// Import CIP components
import { CIPDashboardNew } from '@/components/cip/CIPDashboardNew';
import { CIPPCPControle } from '@/components/cip/CIPPCPControle';
import { CIPSetores } from '@/components/cip/CIPSetores';
import { CIPCadastroProdutosCompleto } from '@/components/cip/CIPCadastroProdutosCompleto';
import { CIPRastreamento } from '@/components/cip/CIPRastreamento';
import { CIPIA } from '@/components/cip/CIPIA';
import { CIPAnalytics } from '@/components/cip/CIPAnalytics';
import { CIPCapacidade } from '@/components/cip/CIPCapacidade';
import { CIPDiagnosticoCapacidade } from '@/components/cip/CIPDiagnosticoCapacidade';

type TabType = 'dashboard' | 'pcp' | 'setores' | 'cadastro_produtos' | 'rastreamento' | 'ia' | 'analytics' | 'capacidade' | 'diagnostico';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart2, tipo: 'visualizacao' },
  { id: 'pcp', label: 'PCP e Controle de Produção', icon: ClipboardCheck, tipo: 'operacional', badge: 'TELA ÚNICA' },
  { id: 'capacidade', label: 'Capacidade Produtiva', icon: Activity, tipo: 'visualizacao' },
  { id: 'diagnostico', label: 'Diagnóstico Capacidade', icon: Search, tipo: 'visualizacao', badge: '🔍' },
  { id: 'setores', label: 'Setores Produtivos', icon: Layers, tipo: 'configuracao' },
  { id: 'cadastro_produtos', label: 'Cadastro Produtos', icon: Package, tipo: 'configuracao', badge: 'RTC' },
  { id: 'rastreamento', label: 'Rastreamento OPs', icon: Factory, tipo: 'visualizacao' },
  { id: 'ia', label: 'Inteligência IA', icon: Brain, tipo: 'visualizacao' },
  { id: 'analytics', label: 'Analytics', icon: LineChart, tipo: 'visualizacao' },
];

interface DashboardCIPProps {
  onGoHome?: () => void;
}

export function DashboardCIP({ onGoHome }: DashboardCIPProps) {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isMobile = useIsMobile();

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <CIPDashboardNew />;
      case 'pcp': return <CIPPCPControle />;
      case 'capacidade': return <CIPCapacidade />;
      case 'diagnostico': return <CIPDiagnosticoCapacidade />;
      case 'setores': return <CIPSetores />;
      case 'cadastro_produtos': return <CIPCadastroProdutosCompleto />;
      case 'rastreamento': return <CIPRastreamento />;
      case 'ia': return <CIPIA />;
      case 'analytics': return <CIPAnalytics />;
      default: return <CIPDashboardNew />;
    }
  };

  const handleTabChange = (tabId: TabType) => {
    setActiveTab(tabId);
    setSidebarOpen(false);
  };

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case 'operacional':
        return <span className="ml-auto text-[10px] bg-cip/20 text-cip px-1.5 py-0.5 rounded">PCP</span>;
      case 'configuracao':
        return <span className="ml-auto text-[10px] bg-secondary/50 text-muted-foreground px-1.5 py-0.5 rounded">CONFIG</span>;
      default:
        return null;
    }
  };

  const SidebarContent = ({ isCollapsed = false }: { isCollapsed?: boolean }) => (
    <>
      <div className={cn("mb-6", isCollapsed && "text-center")}>
        {!isCollapsed ? (
          <>
            <h3 className="text-cip font-display text-lg font-bold">CIP CONTROL</h3>
            <p className="text-xs text-muted-foreground">Programação & Produção</p>
            <div className="mt-2 p-2 rounded bg-warning/10 border border-warning/30">
              <p className="text-[10px] text-warning">⚠ Carteira de Vendas está no CIV</p>
            </div>
          </>
        ) : (
          <div className="w-8 h-8 rounded-lg bg-cip/20 flex items-center justify-center mx-auto">
            <Factory className="h-4 w-4 text-cip" />
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
                ? 'bg-cip/20 text-cip'
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

      {/* HOME */}
      <div className={cn("mt-4 pt-4 border-t border-border/30", isCollapsed && "pt-2 mt-2")}>
        <button
          onClick={() => { onGoHome?.(); }}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-primary hover:bg-primary/10 transition-all font-medium',
            isCollapsed && 'justify-center px-2'
          )}
        >
          <Home className="h-4 w-4 flex-shrink-0" />
          {!isCollapsed && <span>HOME</span>}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex animate-fade-in h-full overflow-hidden">
      {/* Mobile Header */}
      {isMobile && (
        <div className="fixed top-13 left-0 right-0 z-40 bg-background/95 backdrop-blur border-b border-border/50 px-4 py-3 safe-area-top">
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
              <div className="w-2 h-2 rounded-full bg-cip animate-pulse" />
              <span className="text-sm font-semibold text-cip">CIP CONTROL</span>
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
          'h-full border-r border-border/50 bg-card/30 p-4 flex-shrink-0 transition-all duration-300 relative overflow-y-auto',
          sidebarCollapsed ? 'w-16' : 'w-60'
        )}>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="absolute -right-4 top-6 w-8 h-8 bg-cip border-2 border-cip/50 rounded-full flex items-center justify-center hover:bg-cip/80 hover:scale-110 transition-all z-10 shadow-lg shadow-cip/30 text-white"
          >
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
          <SidebarContent isCollapsed={sidebarCollapsed} />
        </aside>
      )}

      {/* Content */}
      <main className={cn(
        'flex-1 overflow-y-auto overflow-x-hidden',
        isMobile ? 'pt-24 px-3 pb-4' : 'p-4 lg:p-6'
      )}>
        {!isMobile && (
          <div className="mb-6">
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground">
              {menuItems.find(m => m.id === activeTab)?.label || 'Dashboard'}
            </h2>
            <p className="text-muted-foreground mt-1">CIP – Programação & Controle de Produção</p>
          </div>
        )}
        
        <div className="animate-fade-in">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
