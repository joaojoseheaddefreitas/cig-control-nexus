import { ModuleType, modules } from '@/data/cigData';
import { Bell, Settings, User, Cpu } from 'lucide-react';

interface HeaderProps {
  activeModule: ModuleType;
  onModuleChange: (module: ModuleType) => void;
}

export function Header({ activeModule, onModuleChange }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Top Bar */}
      <div className="flex h-14 items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Cpu className="h-8 w-8 text-primary" />
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-success rounded-full animate-pulse-glow" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold tracking-wide text-foreground">
                CIG <span className="text-primary">CONTROL</span>
              </h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                Central de Inteligência Geral
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary/50 text-sm">
            <span className="status-indicator status-success" />
            <span className="text-muted-foreground">Sistema Online</span>
          </div>
          <button className="relative p-2 rounded-md hover:bg-secondary/50 transition-colors">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
          </button>
          <button className="p-2 rounded-md hover:bg-secondary/50 transition-colors">
            <Settings className="h-5 w-5 text-muted-foreground" />
          </button>
          <div className="flex items-center gap-2 pl-4 border-l border-border">
            <div className="w-8 h-8 rounded-full bg-gradient-cig flex items-center justify-center">
              <User className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="hidden lg:block">
              <p className="text-sm font-medium">Admin</p>
              <p className="text-xs text-muted-foreground">Marcobin Móveis</p>
            </div>
          </div>
        </div>
      </div>

      {/* Module Navigation */}
      <nav className="flex items-center px-6 border-t border-border/30">
        {modules.map((module) => (
          <button
            key={module.id}
            onClick={() => onModuleChange(module.id)}
            className={`nav-tab nav-tab-${module.cor.toLowerCase()} ${
              activeModule === module.id ? 'nav-tab-active' : ''
            }`}
          >
            {module.id}
          </button>
        ))}
      </nav>
    </header>
  );
}
