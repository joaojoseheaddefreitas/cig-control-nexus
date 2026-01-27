import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface KPICardCIPProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  variant?: 'blue' | 'green' | 'orange' | 'red' | 'default';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const variantStyles = {
  blue: 'border-primary/30 bg-primary/10',
  green: 'border-success/30 bg-success/10',
  orange: 'border-cip/30 bg-cip/10',
  red: 'border-destructive/30 bg-destructive/10',
  default: 'border-border/30 bg-card/50',
};

const valueColors = {
  blue: 'text-primary',
  green: 'text-success',
  orange: 'text-cip',
  red: 'text-destructive',
  default: 'text-foreground',
};

export function KPICardCIP({
  title,
  value,
  subtitle,
  icon,
  variant = 'default',
  size = 'md',
  className,
}: KPICardCIPProps) {
  return (
    <div
      className={cn(
        'relative rounded-xl border p-4 transition-all duration-300 hover:scale-[1.02]',
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
            {title}
          </p>
          <p className={cn(
            'font-display font-bold',
            valueColors[variant],
            size === 'sm' ? 'text-xl' : size === 'lg' ? 'text-4xl' : 'text-2xl lg:text-3xl'
          )}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className={cn(
            'p-2 rounded-lg',
            variant === 'blue' ? 'bg-primary/20 text-primary' :
            variant === 'green' ? 'bg-success/20 text-success' :
            variant === 'orange' ? 'bg-cip/20 text-cip' :
            variant === 'red' ? 'bg-destructive/20 text-destructive' :
            'bg-secondary text-muted-foreground'
          )}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
