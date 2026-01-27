import { cn } from '@/lib/utils';
import { AlertTriangle, Lightbulb, Zap, ChevronRight } from 'lucide-react';

export interface IAAlert {
  id: string;
  tipo: 'gargalo' | 'sugestao' | 'otimizacao';
  prioridade: 'alta' | 'media' | 'baixa';
  mensagem: string;
  setor?: string;
  horario: string;
}

interface IAAlertCardProps {
  alert: IAAlert;
  onClick?: () => void;
}

const tipoStyles = {
  gargalo: {
    icon: AlertTriangle,
    bg: 'bg-destructive/20',
    border: 'border-destructive/30',
    iconColor: 'text-destructive',
  },
  sugestao: {
    icon: Lightbulb,
    bg: 'bg-warning/20',
    border: 'border-warning/30',
    iconColor: 'text-warning',
  },
  otimizacao: {
    icon: Zap,
    bg: 'bg-primary/20',
    border: 'border-primary/30',
    iconColor: 'text-primary',
  },
};

const prioridadeLabels = {
  alta: { label: 'ALTO', color: 'bg-destructive text-destructive-foreground' },
  media: { label: 'MÉDIO', color: 'bg-warning text-warning-foreground' },
  baixa: { label: 'BAIXO', color: 'bg-secondary text-secondary-foreground' },
};

export function IAAlertCard({ alert, onClick }: IAAlertCardProps) {
  const style = tipoStyles[alert.tipo];
  const prioridade = prioridadeLabels[alert.prioridade];
  const Icon = style.icon;

  return (
    <div
      className={cn(
        'rounded-xl border p-4 cursor-pointer transition-all duration-300 hover:scale-[1.01]',
        style.bg,
        style.border
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className={cn('p-2 rounded-lg', style.bg)}>
          <Icon className={cn('h-5 w-5', style.iconColor)} />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground leading-relaxed">
            {alert.mensagem}
          </p>
          
          <div className="flex items-center gap-2 mt-3">
            <span className="text-xs text-muted-foreground">{alert.horario}</span>
            <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold', prioridade.color)}>
              {prioridade.label}
            </span>
            {alert.setor && (
              <span className="px-2 py-0.5 rounded bg-primary/20 text-primary text-[10px]">
                {alert.setor}
              </span>
            )}
          </div>
        </div>

        <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
      </div>
    </div>
  );
}
