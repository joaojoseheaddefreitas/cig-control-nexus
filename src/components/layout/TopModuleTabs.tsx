import { useState, useRef } from 'react';
import { 
  LayoutDashboard, TrendingUp, Factory, Package, Wallet, 
  X, Home
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ModuleType } from '@/data/cigData';
import { Sheet, SheetContent, SheetClose } from '@/components/ui/sheet';

interface TopModuleTabsProps {
  activeModule: ModuleType;
  onModuleChange: (module: ModuleType) => void;
  onSubPageChange?: (pageId: string) => void;
}

const modules = [
  { id: 'CIG' as ModuleType, label: 'CIG', fullName: 'Dashboard Executivo', icon: LayoutDashboard, color: 'cig' },
  { id: 'CIV' as ModuleType, label: 'CIV', fullName: 'Vendas', icon: TrendingUp, color: 'civ' },
  { id: 'CIP' as ModuleType, label: 'CIP', fullName: 'Produção', icon: Factory, color: 'cip' },
  { id: 'CIC' as ModuleType, label: 'CIC', fullName: 'Compras', icon: Package, color: 'cic' },
  { id: 'CIF' as ModuleType, label: 'CIF', fullName: 'Financeiro', icon: Wallet, color: 'cif' },
];

const subPages: Record<ModuleType, { id: string; label: string }[]> = {
  CIG: [
    { id: 'dashboard', label: 'Dashboard Executivo' },
  ],
  CIV: [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'leads', label: 'Leads & Oportunidades' },
    { id: 'lojas', label: 'Lojas, Canais e Vendedores' },
    { id: 'carteira', label: 'Carteira de Pedidos' },
    { id: 'pipeline', label: 'Pipeline Comercial' },
    { id: 'clientes', label: 'Clientes' },
    { id: 'analytics', label: 'Analytics' },
  ],
  CIP: [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'programacao', label: 'Programação / OPs' },
    { id: 'producao', label: 'Baixas por Setor' },
    { id: 'setores', label: 'Setores Produtivos' },
    { id: 'produtos', label: 'Cadastro Produtos' },
    { id: 'rastreamento', label: 'Rastreamento' },
    { id: 'analytics', label: 'Analytics' },
  ],
  CIC: [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'consumo', label: 'Consumo de Materiais' },
    { id: 'estoques', label: 'Estoques – Entrada' },
    { id: 'compras', label: 'Compras' },
    { id: 'fornecedores', label: 'Fornecedores' },
    { id: 'mrp', label: 'Necessidades (MRP)' },
    { id: 'requisicao', label: 'Requisição' },
    { id: 'ia', label: 'Inteligência IA' },
    { id: 'analytics', label: 'Analytics' },
  ],
  CIF: [
    { id: 'dashboard', label: 'Dashboard Executivo' },
    { id: 'fluxo', label: 'Fluxo de Caixa' },
    { id: 'custos', label: 'Custos & Orçamento' },
    { id: 'equilibrio', label: 'Ponto de Equilíbrio' },
    { id: 'rentabilidade', label: 'Rentabilidade & Pricing' },
    { id: 'auditoria', label: 'Auditoria & Compliance' },
    { id: 'analytics', label: 'Analytics' },
  ],
};

export function TopModuleTabs({ activeModule, onModuleChange, onSubPageChange }: TopModuleTabsProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState('dashboard');

  const handleModuleClick = (module: ModuleType) => {
    // If clicking the same module that's already active, just toggle sidebar
    if (module === activeModule) {
      setSidebarOpen(prev => !prev);
      return;
    }
    // Switch module, open sidebar, reset to dashboard
    onModuleChange(module);
    setSelectedPage('dashboard');
    onSubPageChange?.('dashboard');
    setSidebarOpen(true);
  };

  const handlePageSelect = (pageId: string) => {
    setSelectedPage(pageId);
    setSidebarOpen(false);
    onSubPageChange?.(pageId);
  };

  const handleGoHome = () => {
    onModuleChange('CIG');
    setSelectedPage('dashboard');
    setSidebarOpen(false);
    onSubPageChange?.('dashboard');
  };

  const activeModuleData = modules.find(m => m.id === activeModule);

  return (
    <>
      {/* Barra de Abas no Topo - Fixa */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur border-b border-border/50 h-13">
        <div className="h-full flex items-center justify-between px-2 sm:px-4">
          {/* HOME */}
          <button
            onClick={handleGoHome}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors text-primary"
          >
            <Home className="h-4 w-4" />
            <span className="text-xs font-bold tracking-wide">HOME</span>
          </button>

          {/* Abas dos Módulos */}
          <nav className="flex items-center gap-1 sm:gap-1.5">
            {modules.map((module) => {
              const isActive = activeModule === module.id;
              return (
                <button
                  key={module.id}
                  onClick={() => handleModuleClick(module.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-md text-xs transition-all duration-200',
                    'border',
                    isActive 
                      ? 'font-bold shadow-md border-b-2' 
                      : 'font-semibold text-muted-foreground hover:text-foreground border-transparent hover:border-border/50 hover:bg-secondary/40 hover:shadow-sm'
                  )}
                  style={isActive ? { 
                    backgroundColor: `hsl(var(--${module.color}) / 0.12)`,
                    color: `hsl(var(--${module.color}))`,
                    borderColor: `hsl(var(--${module.color}) / 0.3)`,
                    borderBottomColor: `hsl(var(--${module.color}))`,
                    boxShadow: `0 2px 6px hsl(var(--${module.color}) / 0.15), inset 0 1px 0 hsl(var(--${module.color}) / 0.1)`,
                  } : undefined}
                >
                  <module.icon className="h-3.5 w-3.5" />
                  <span className="tracking-wide">{module.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Status */}
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-[10px] text-muted-foreground hidden sm:inline">Online</span>
          </div>
        </div>
      </header>

      {/* Sheet Lateral para Sub-Páginas */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-72 p-4">
          <SheetClose className="absolute right-4 top-4">
            <X className="h-5 w-5" />
          </SheetClose>
          
          {/* Título do módulo */}
          <div className="mb-6 pb-4 border-b border-border/30">
            <div className="flex items-center gap-3">
              {activeModuleData && (
                <>
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `hsl(var(--${activeModuleData.color}) / 0.2)` }}
                  >
                    <activeModuleData.icon 
                      className="h-5 w-5" 
                      style={{ color: `hsl(var(--${activeModuleData.color}))` }}
                    />
                  </div>
                  <div>
                    <h3 
                      className="font-display text-lg font-bold"
                      style={{ color: `hsl(var(--${activeModuleData.color}))` }}
                    >
                      {activeModuleData.label}
                    </h3>
                    <p className="text-xs text-muted-foreground">{activeModuleData.fullName}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Lista de páginas */}
          <nav className="space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 px-3">
              Páginas
            </p>
            {subPages[activeModule]?.map((page) => (
              <button
                key={page.id}
                onClick={() => handlePageSelect(page.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-left',
                  selectedPage === page.id
                    ? 'bg-secondary text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                )}
              >
                {page.label}
              </button>
            ))}
          </nav>

          {/* Voltar ao Home */}
          <div className="mt-6 pt-4 border-t border-border/30">
            <button
              onClick={handleGoHome}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-primary hover:bg-primary/10 transition-all font-medium"
            >
              <Home className="h-4 w-4" />
              HOME
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}