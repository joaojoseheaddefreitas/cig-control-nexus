import { useState } from 'react';
import { 
  Home, LayoutDashboard, TrendingUp, Factory, Package, Wallet, 
  ChevronLeft, ChevronRight, Menu, X 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ModuleType } from '@/data/cigData';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

interface GlobalSidebarProps {
  activeModule: ModuleType;
  onModuleChange: (module: ModuleType) => void;
}

// Módulos - Paleta atualizada (sem roxo)
const modules = [
  { id: 'CIG' as ModuleType, label: 'CIG', fullName: 'Central de Inteligência Geral', icon: LayoutDashboard, color: 'cig' },
  { id: 'CIV' as ModuleType, label: 'CIV', fullName: 'Central de Inteligência de Vendas', icon: TrendingUp, color: 'civ' },
  { id: 'CIP' as ModuleType, label: 'CIP', fullName: 'Central de Inteligência da Produção', icon: Factory, color: 'cip' },
  { id: 'CIC' as ModuleType, label: 'CIC', fullName: 'Central de Inteligência de Compras', icon: Package, color: 'cic' },
  { id: 'CIF' as ModuleType, label: 'CIF', fullName: 'Central de Inteligência Financeira', icon: Wallet, color: 'cif' },
];

export function GlobalSidebar({ activeModule, onModuleChange }: GlobalSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useIsMobile();

  const handleModuleChange = (module: ModuleType) => {
    onModuleChange(module);
    setMobileOpen(false);
  };

  const SidebarContent = ({ isCollapsed = false }: { isCollapsed?: boolean }) => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={cn("p-4 border-b border-border/30", isCollapsed && "px-2")}>
        {!isCollapsed ? (
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Factory className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold text-foreground">CIG CONTROL</h1>
              <p className="text-[10px] text-muted-foreground">Sistema Industrial</p>
            </div>
          </div>
        ) : (
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto">
            <Factory className="h-5 w-5 text-primary-foreground" />
          </div>
        )}
      </div>

      {/* Home sempre visível */}
      <div className="p-2 border-b border-border/30">
        <button
          onClick={() => handleModuleChange('CIG')}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all',
            'bg-gradient-to-r from-primary/20 to-accent/20 text-primary hover:from-primary/30 hover:to-accent/30',
            isCollapsed && 'justify-center px-2'
          )}
        >
          <Home className="h-5 w-5 flex-shrink-0" />
          {!isCollapsed && <span>Home / Dashboard</span>}
        </button>
      </div>

      {/* Módulos */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        <p className={cn(
          "text-[10px] text-muted-foreground uppercase tracking-wider mb-2 px-2",
          isCollapsed && "sr-only"
        )}>
          Módulos
        </p>
        {modules.map((module) => {
          const isActive = activeModule === module.id;
          return (
            <button
              key={module.id}
              onClick={() => handleModuleChange(module.id)}
              title={isCollapsed ? module.fullName : undefined}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-all',
                isActive 
                  ? `bg-${module.color}/20 text-${module.color} border border-${module.color}/30`
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50',
                isCollapsed && 'justify-center px-2'
              )}
              style={isActive ? { 
                backgroundColor: `hsl(var(--${module.color}) / 0.15)`,
                color: `hsl(var(--${module.color}))`,
                borderColor: `hsl(var(--${module.color}) / 0.3)`
              } : undefined}
            >
              <module.icon className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && (
                <div className="flex flex-col items-start min-w-0">
                  <span className="font-semibold">{module.label}</span>
                  <span className="text-[10px] text-muted-foreground truncate w-full">
                    {module.fullName.replace('Central de Inteligência ', '')}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={cn("p-4 border-t border-border/30", isCollapsed && "p-2")}>
        <div className={cn(
          "flex items-center gap-2 text-xs text-muted-foreground",
          isCollapsed && "justify-center"
        )}>
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          {!isCollapsed && <span>Sistema Online</span>}
        </div>
      </div>
    </div>
  );

  // Mobile: Sheet sidebar
  if (isMobile) {
    return (
      <>
        {/* Botão hamburger flutuante */}
        <div className="fixed top-3 left-3 z-50">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl shadow-lg bg-background/95 backdrop-blur">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetClose className="absolute right-4 top-4 z-10">
                <X className="h-5 w-5" />
              </SheetClose>
              <SidebarContent />
            </SheetContent>
          </Sheet>
        </div>

        {/* Indicador do módulo atual */}
        <div className="fixed top-3 left-20 right-3 z-40 flex items-center justify-between bg-background/95 backdrop-blur px-4 py-2 rounded-xl border border-border/50 shadow-lg">
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full animate-pulse"
              style={{ backgroundColor: `hsl(var(--${modules.find(m => m.id === activeModule)?.color}))` }}
            />
            <span className="font-semibold text-foreground">{activeModule}</span>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {modules.find(m => m.id === activeModule)?.fullName.replace('Central de Inteligência ', '')}
            </span>
          </div>
        </div>
      </>
    );
  }

  // Desktop: Sidebar colapsável
  return (
    <aside className={cn(
      'fixed left-0 top-0 h-screen border-r border-border/50 bg-card/95 backdrop-blur transition-all duration-300 z-40',
      collapsed ? 'w-16' : 'w-64'
    )}>
      {/* Botão de colapsar */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-5 top-20 w-10 h-10 bg-primary border-2 border-primary/50 rounded-full flex items-center justify-center hover:bg-primary/80 hover:scale-110 transition-all z-50 shadow-lg shadow-primary/30 text-primary-foreground"
      >
        {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
      </button>

      <SidebarContent isCollapsed={collapsed} />
    </aside>
  );
}
