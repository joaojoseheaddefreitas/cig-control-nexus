import { useState, useEffect } from 'react';
import {
  BarChart2, Calendar, Layers, Factory, Package, ClipboardList, 
  Brain, LineChart, MapPin, Menu, X, ChevronLeft, ChevronRight,
  ArrowDownCircle, ArrowUpCircle, Truck
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

// Import all CIP tabs - SEM CARTEIRA (Carteira está no CIV)
import { CIPDashboardNew } from '@/components/cip/CIPDashboardNew';
import { CIPProgramacaoDiaria } from '@/components/cip/CIPProgramacaoDiaria';
import { CIPSetores } from '@/components/cip/CIPSetores';
import { CIPProducao } from '@/components/cip/CIPProducao';
import { CIPCadastroProdutosCompleto } from '@/components/cip/CIPCadastroProdutosCompleto';
import { CIPRastreamento } from '@/components/cip/CIPRastreamento';
import { CIPIA } from '@/components/cip/CIPIA';
import { CIPAnalytics } from '@/components/cip/CIPAnalytics';
import { CIPGlobalActions } from '@/components/cip/CIPGlobalActions';

type TabType = 'dashboard' | 'programacao' | 'producao' | 'setores' | 'cadastro_produtos' | 'rastreamento' | 'ia' | 'analytics';

// Menu items - CIP focado em Programação, OPs e Produtos
// IMPORTANTE: CIP NÃO TEM CARTEIRA DE VENDAS - Carteira está no CIV
const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart2, tipo: 'visualizacao' },
  { id: 'programacao', label: 'Programação / Entrada', icon: Calendar, tipo: 'entrada', badge: '+ OP' },
  { id: 'producao', label: 'Baixas por Setor', icon: Factory, tipo: 'baixa', badge: '- Baixa' },
  { id: 'setores', label: 'Setores Produtivos', icon: Layers, tipo: 'configuracao' },
  { id: 'cadastro_produtos', label: 'Cadastro Produtos', icon: Package, tipo: 'configuracao', badge: 'RTC' },
  { id: 'rastreamento', label: 'Rastreamento OPs', icon: MapPin, tipo: 'visualizacao' },
  { id: 'ia', label: 'Inteligência IA', icon: Brain, tipo: 'visualizacao' },
  { id: 'analytics', label: 'Analytics', icon: LineChart, tipo: 'visualizacao' },
];

export function DashboardCIP() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isMobile = useIsMobile();

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <CIPDashboardNew />;
      case 'programacao': return <CIPProgramacaoDiaria />;
      case 'producao': return <CIPProducao />;
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
      case 'entrada':
        return <span className="ml-auto text-[10px] bg-success/20 text-success px-1.5 py-0.5 rounded">ENTRADA</span>;
      case 'baixa':
        return <span className="ml-auto text-[10px] bg-cip/20 text-cip px-1.5 py-0.5 rounded">BAIXA</span>;
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
            <p className="text-xs text-muted-foreground">Programação & Produtos</p>
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

      {/* Legenda de cores */}
      {!isCollapsed && (
        <div className="mt-6 pt-4 border-t border-border/30 space-y-2">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Fluxo CIP</p>
          <div className="flex items-center gap-2 text-xs">
            <ArrowUpCircle className="h-3 w-3 text-success" />
            <span className="text-muted-foreground">Entrada = Recebe OP do CIV</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <ArrowDownCircle className="h-3 w-3 text-cip" />
            <span className="text-muted-foreground">Baixa = Registra produção</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Truck className="h-3 w-3 text-primary" />
            <span className="text-muted-foreground">Expedição = Encerra OP</span>
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="flex animate-fade-in min-h-screen">
      {/* Mobile Header - Sempre visível */}
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
              <div className="w-2 h-2 rounded-full bg-cip animate-pulse" />
              <span className="text-sm font-semibold text-cip">CIP CONTROL 360</span>
            </div>
            
            <div className="w-10" />
          </div>
          
          {/* Tab atual */}
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Aba:</span>
            <span className="text-sm font-medium text-foreground">
              {menuItems.find(m => m.id === activeTab)?.label}
            </span>
            {menuItems.find(m => m.id === activeTab)?.tipo === 'entrada' && (
              <span className="text-[10px] bg-success/20 text-success px-1.5 py-0.5 rounded">ENTRADA</span>
            )}
            {menuItems.find(m => m.id === activeTab)?.tipo === 'baixa' && (
              <span className="text-[10px] bg-cip/20 text-cip px-1.5 py-0.5 rounded">BAIXA</span>
            )}
          </div>
        </div>
      )}

      {/* Desktop Sidebar - Colapsável */}
      {!isMobile && (
        <aside className={cn(
          'min-h-[calc(100vh-4rem)] border-r border-border/50 bg-card/30 p-4 flex-shrink-0 transition-all duration-300 relative',
          sidebarCollapsed ? 'w-16' : 'w-60'
        )}>
          {/* Botão de colapsar */}
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
              {menuItems.find(m => m.id === activeTab)?.tipo === 'entrada' && (
                <span className="text-xs bg-success/20 text-success px-2 py-1 rounded-full font-medium">
                  ↑ RECEBE OP DO CIV
                </span>
              )}
              {menuItems.find(m => m.id === activeTab)?.tipo === 'baixa' && (
                <span className="text-xs bg-cip/20 text-cip px-2 py-1 rounded-full font-medium">
                  ↓ BAIXA POR SETOR
                </span>
              )}
            </div>
            <p className="text-muted-foreground mt-1">
              CIP – Recebe volume aprovado do CIV e programa produção
            </p>
          </div>
        )}
        
        {/* Sistema Global de Entrada/Baixa/Expedição */}
        <CIPGlobalActions />
        
        {/* Conteúdo da aba */}
        <div className="animate-fade-in">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
