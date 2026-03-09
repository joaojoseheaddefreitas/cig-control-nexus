import { 
  LayoutDashboard, TrendingUp, Factory, Package, Wallet, Home
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ModuleType } from '@/data/cigData';

interface TopModuleTabsProps {
  activeModule: ModuleType;
  onModuleChange: (module: ModuleType) => void;
}

const modules = [
  { id: 'CIG' as ModuleType, label: 'CIG', fullName: 'Dashboard Executivo', icon: LayoutDashboard, color: 'cig' },
  { id: 'CIV' as ModuleType, label: 'CIV', fullName: 'Vendas', icon: TrendingUp, color: 'civ' },
  { id: 'CIP' as ModuleType, label: 'CIP', fullName: 'Produção', icon: Factory, color: 'cip' },
  { id: 'CIC' as ModuleType, label: 'CIC', fullName: 'Compras', icon: Package, color: 'cic' },
  { id: 'CIF' as ModuleType, label: 'CIF', fullName: 'Financeiro', icon: Wallet, color: 'cif' },
];

export function TopModuleTabs({ activeModule, onModuleChange }: TopModuleTabsProps) {
  const handleModuleClick = (module: ModuleType) => {
    onModuleChange(module);
  };

  const handleGoHome = () => {
    onModuleChange('CIG');
  };

  return (
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
                    ? 'font-bold border-b-2' 
                    : 'font-semibold text-muted-foreground hover:text-foreground border-transparent hover:border-border/50 hover:bg-secondary/40 hover:shadow-sm'
                )}
                style={isActive ? { 
                  backgroundColor: `hsl(var(--${module.color}) / 0.15)`,
                  color: `hsl(var(--${module.color}))`,
                  borderColor: `hsl(var(--${module.color}) / 0.4)`,
                  borderBottomColor: `hsl(var(--${module.color}))`,
                  boxShadow: `0 2px 8px hsl(var(--${module.color}) / 0.2), inset 0 1px 0 hsl(var(--${module.color}) / 0.15), 0 1px 3px rgba(0,0,0,0.15)`,
                  textShadow: `0 0 12px hsl(var(--${module.color}) / 0.4)`,
                } : {
                  boxShadow: '0 1px 2px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.04)',
                }}
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
  );
}
