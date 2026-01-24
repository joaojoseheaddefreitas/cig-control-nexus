import { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  variant?: 'cig' | 'civ' | 'cip' | 'cic' | 'cif';
  className?: string;
}

export function KPICard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  variant = 'cig',
  className,
}: KPICardProps) {
  const variantClasses = {
    cig: 'kpi-card-cig border-l-cig',
    civ: 'kpi-card-civ border-l-civ',
    cip: 'kpi-card-cip border-l-cip',
    cic: 'kpi-card-cic border-l-cic',
    cif: 'kpi-card-cif border-l-cif',
  };

  const iconColors = {
    cig: 'text-cig',
    civ: 'text-civ',
    cip: 'text-cip',
    cic: 'text-cic',
    cif: 'text-cif',
  };

  const trendColors = {
    up: 'text-success',
    down: 'text-destructive',
    neutral: 'text-muted-foreground',
  };

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <div className={cn('kpi-card border-l-4', variantClasses[variant], className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <p className="text-2xl lg:text-3xl font-display font-bold text-foreground">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
          {trend && trendValue && (
            <div className={cn('flex items-center gap-1 mt-2', trendColors[trend])}>
              <TrendIcon className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">{trendValue}</span>
            </div>
          )}
        </div>
        {icon && (
          <div className={cn('p-2.5 rounded-lg bg-secondary/50', iconColors[variant])}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
