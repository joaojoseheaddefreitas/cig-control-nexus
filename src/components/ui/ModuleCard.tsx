import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ArrowUpRight } from 'lucide-react';

interface ModuleCardProps {
  title: string;
  children: ReactNode;
  variant?: 'cig' | 'civ' | 'cip' | 'cic' | 'cif';
  className?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function ModuleCard({
  title,
  children,
  variant = 'cig',
  className,
  action,
}: ModuleCardProps) {
  const variantClasses = {
    cig: 'card-cig',
    civ: 'card-civ',
    cip: 'card-cip',
    cic: 'card-cic',
    cif: 'card-cif',
  };

  const titleColors = {
    cig: 'text-cig',
    civ: 'text-civ',
    cip: 'text-cip',
    cic: 'text-cic',
    cif: 'text-cif',
  };

  return (
    <div className={cn(variantClasses[variant], 'p-5', className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={cn('font-display text-lg font-semibold', titleColors[variant])}>
          {title}
        </h3>
        {action && (
          <button
            onClick={action.onClick}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {action.label}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}
