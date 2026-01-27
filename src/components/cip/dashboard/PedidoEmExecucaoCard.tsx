import { cn } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PedidoEmExecucaoCardProps {
  codigo: string;
  produto: string;
  cliente: string;
  progresso: number;
  setorAtual: string;
  status: 'em_producao' | 'atrasado' | 'aguardando';
  atraso?: number;
}

const statusStyles = {
  em_producao: { label: 'Em Produção', color: 'bg-success text-success-foreground' },
  atrasado: { label: 'Atrasado', color: 'bg-destructive text-destructive-foreground' },
  aguardando: { label: 'Aguardando', color: 'bg-warning text-warning-foreground' },
};

export function PedidoEmExecucaoCard({
  codigo,
  produto,
  cliente,
  progresso,
  setorAtual,
  status,
  atraso,
}: PedidoEmExecucaoCardProps) {
  const statusInfo = statusStyles[status];
  
  const progressColor = 
    progresso >= 80 ? 'bg-primary' :
    progresso >= 50 ? 'bg-warning' :
    'bg-destructive';

  return (
    <div className="rounded-xl border border-border/30 bg-card/80 p-4 transition-all duration-300 hover:border-primary/30">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{codigo}</span>
            {atraso && atraso > 0 && (
              <span className="flex items-center gap-1 text-xs text-destructive">
                <AlertTriangle className="h-3 w-3" />
                +{atraso}h
              </span>
            )}
          </div>
          <h3 className="font-display font-bold text-foreground mt-1">{produto}</h3>
          <p className="text-xs text-muted-foreground">{cliente}</p>
        </div>
        
        <div className="text-right">
          <Badge className={cn('text-xs', statusInfo.color)}>
            {statusInfo.label}
          </Badge>
          <p className={cn(
            'text-2xl font-bold mt-1',
            progresso >= 80 ? 'text-primary' :
            progresso >= 50 ? 'text-warning' :
            'text-foreground'
          )}>
            {progresso}%
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-3">
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div 
            className={cn('h-full rounded-full transition-all duration-500', progressColor)}
            style={{ width: `${progresso}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground text-right mt-1">{setorAtual}</p>
      </div>
    </div>
  );
}
