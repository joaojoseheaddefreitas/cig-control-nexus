import { useState } from 'react';
import {
  BarChart2, Calendar, Layers, Factory, Package, ClipboardList, 
  Activity, Brain, LineChart, MapPin, Menu, X,
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

// Import all CIP tabs
import { CIPDashboardNew } from '@/components/cip/CIPDashboardNew';
import { CIPCarteira } from '@/components/cip/CIPCarteira';
import { CIPProgramacaoDiaria } from '@/components/cip/CIPProgramacaoDiaria';
import { CIPSetores } from '@/components/cip/CIPSetores';
import { CIPProducao } from '@/components/cip/CIPProducao';
import { CIPCapacidade } from '@/components/cip/CIPCapacidade';
import { CIPCadastroPedidos } from '@/components/cip/CIPCadastroPedidos';
import { CIPCadastroProdutos } from '@/components/cip/CIPCadastroProdutos';
import { CIPRastreamento } from '@/components/cip/CIPRastreamento';
import { CIPIA } from '@/components/cip/CIPIA';
import { CIPAnalytics } from '@/components/cip/CIPAnalytics';

type TabType = 'dashboard' | 'carteira' | 'programacao' | 'producao' | 'setores' | 'cadastro_pedidos' | 'cadastro_produtos' | 'rastreamento' | 'ia' | 'analytics';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
  { id: 'carteira', label: 'Carteira', icon: Package },
  { id: 'programacao', label: 'Programação / Entrada', icon: Calendar },
  { id: 'producao', label: 'Programação / Baixas', icon: Factory },
  { id: 'setores', label: 'Setores', icon: Layers },
  { id: 'cadastro_pedidos', label: 'Cadastro Pedidos', icon: ClipboardList },
  { id: 'cadastro_produtos', label: 'Cadastro Produtos', icon: Package },
  { id: 'rastreamento', label: 'Rastreamento', icon: MapPin },
  { id: 'ia', label: 'Inteligência IA', icon: Brain },
  { id: 'analytics', label: 'Analytics', icon: LineChart },
];

export function DashboardCIP() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <CIPDashboardNew />;
      case 'carteira': return <CIPCarteira />;
      case 'programacao': return <CIPProgramacaoDiaria />;
      case 'producao': return <CIPProducao />;
      case 'setores': return <CIPSetores />;
      case 'cadastro_pedidos': return <CIPCadastroPedidos />;
      case 'cadastro_produtos': return <CIPCadastroProdutos />;
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

  const SidebarContent = () => (
    <>
      <div className="mb-6">
        <h3 className="text-cip font-display text-lg font-bold">CIP CONTROL 360</h3>
        <p className="text-xs text-muted-foreground">Central de Inteligência da Produção</p>
      </div>
      <nav className="space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleTabChange(item.id as TabType)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all',
              activeTab === item.id
                ? 'bg-cip/20 text-cip'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
            )}
          >
            <item.icon className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{item.label}</span>
          </button>
        ))}
      </nav>
    </>
  );

  return (
    <div className="flex animate-fade-in">
      {/* Mobile Header */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-b border-border/50 px-4 py-3">
          <div className="flex items-center justify-between">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-4">
                <SidebarContent />
              </SheetContent>
            </Sheet>
            
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cip animate-pulse" />
              <span className="text-sm font-semibold text-cip">CIP</span>
            </div>
            
            <div className="w-10" /> {/* Spacer for balance */}
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className="w-60 min-h-[calc(100vh-8rem)] border-r border-border/50 bg-card/30 p-4 flex-shrink-0">
          <SidebarContent />
        </aside>
      )}

      {/* Content */}
      <main className={cn(
        'flex-1 p-4 lg:p-6 overflow-x-hidden',
        isMobile && 'pt-20'
      )}>
        {!isMobile && (
          <div className="mb-6">
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground">
              {menuItems.find(m => m.id === activeTab)?.label || 'Dashboard'}
            </h2>
            <p className="text-muted-foreground mt-1">
              CIP CONTROL 360 – Central de Inteligência da Produção
            </p>
          </div>
        )}
        {renderContent()}
      </main>
    </div>
  );
}
