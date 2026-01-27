import { cn } from '@/lib/utils';
import { Zap, Users } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface SetorCardProps {
  nome: string;
  sigla: string;
  carga: number;
  capacidadeReal: number;
  horasNecessarias: number;
  lotacaoAtual: number;
  lotacaoNecessaria: number;
  maquinas: number;
  diasCarteira: number;
  eficiencia: number;
  folga: number;
  status: 'verde' | 'amarelo' | 'vermelho';
  moExtra?: number;
}

const statusLabels = {
  verde: { label: 'SOBRA', color: 'text-success', bg: 'bg-success/20' },
  amarelo: { label: 'LIMITE', color: 'text-warning', bg: 'bg-warning/20' },
  vermelho: { label: 'GARGALO', color: 'text-destructive', bg: 'bg-destructive/20' },
};

const progressColors = {
  verde: 'bg-primary',
  amarelo: 'bg-warning',
  vermelho: 'bg-destructive',
};

export function SetorCard({
  nome,
  sigla,
  carga,
  capacidadeReal,
  horasNecessarias,
  lotacaoAtual,
  lotacaoNecessaria,
  maquinas,
  diasCarteira,
  eficiencia,
  folga,
  status,
  moExtra,
}: SetorCardProps) {
  const statusInfo = statusLabels[status];
  
  return (
    <div className="rounded-xl border border-border/30 bg-card/80 p-4 transition-all duration-300 hover:border-primary/30">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn(
            'w-2.5 h-2.5 rounded-full',
            status === 'verde' ? 'bg-primary' :
            status === 'amarelo' ? 'bg-warning' :
            'bg-destructive'
          )} />
          <h3 className="font-display font-bold text-foreground text-sm lg:text-base">
            {nome}
          </h3>
        </div>
        <div className={cn('flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', statusInfo.bg, statusInfo.color)}>
          <Zap className="h-3 w-3" />
          {statusInfo.label}
        </div>
      </div>

      {/* Carga Progress */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-muted-foreground">Carga</span>
          <span className={cn(
            'font-bold',
            status === 'verde' ? 'text-primary' :
            status === 'amarelo' ? 'text-warning' :
            'text-destructive'
          )}>
            {carga}%
          </span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div 
            className={cn('h-full rounded-full transition-all', progressColors[status])}
            style={{ width: `${Math.min(100, carga)}%` }}
          />
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-secondary/30 rounded-lg p-2">
          <p className="text-[10px] text-muted-foreground">Cap. Real</p>
          <p className="text-lg font-bold text-foreground">{capacidadeReal}h</p>
        </div>
        <div className="bg-secondary/30 rounded-lg p-2">
          <p className="text-[10px] text-muted-foreground">Necessário</p>
          <p className="text-lg font-bold text-foreground">{horasNecessarias}h</p>
        </div>
      </div>

      {/* Lotação & Máquinas */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-secondary/30 rounded-lg p-2">
          <p className="text-[10px] text-muted-foreground">Lotação</p>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold text-foreground">{lotacaoAtual}</span>
            <span className="text-xs text-muted-foreground">/ {lotacaoNecessaria}</span>
          </div>
          <p className="text-[10px] text-muted-foreground">nec.</p>
          {moExtra && (
            <p className={cn(
              'text-[10px] mt-1',
              moExtra > 0 ? 'text-primary' : 'text-destructive'
            )}>
              {moExtra > 0 ? '+' : ''}{moExtra.toFixed(1)} MO
            </p>
          )}
        </div>
        <div className="bg-secondary/30 rounded-lg p-2">
          <p className="text-[10px] text-muted-foreground">Máquinas</p>
          <p className="text-lg font-bold text-foreground">{maquinas}</p>
          <p className="text-[10px] text-cip mt-1">{diasCarteira.toFixed(1)}d</p>
          <p className="text-[10px] text-muted-foreground">carteira</p>
        </div>
      </div>

      {/* Footer Stats */}
      <div className="flex justify-between pt-2 border-t border-border/30">
        <div>
          <p className="text-[10px] text-muted-foreground">Eficiência</p>
          <p className="text-sm font-bold text-foreground">{eficiencia}%</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-muted-foreground">Folga</p>
          <p className="text-sm font-bold text-primary">{folga}h</p>
        </div>
      </div>
    </div>
  );
}
