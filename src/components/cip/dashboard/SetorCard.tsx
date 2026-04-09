import { cn } from '@/lib/utils';
import { Zap, Calendar } from 'lucide-react';

interface SetorCardProps {
  nome: string;
  sigla: string;
  carga: number;
  capacidadeReal: number;
  horasNecessarias: number;
  lotacaoAtual: number;
  maquinas: number;
  diasUteis: number;
  diasUteisManual: boolean;
  eficiencia: number;
  folga: number;
  status: 'verde' | 'amarelo' | 'vermelho' | 'azul' | 'laranja';
}

const statusLabels: Record<string, { label: string; color: string; bg: string }> = {
  verde: { label: 'NORMAL', color: 'text-success', bg: 'bg-success/20' },
  amarelo: { label: 'ATENÇÃO', color: 'text-warning', bg: 'bg-warning/20' },
  laranja: { label: 'LIMITE', color: 'text-orange-400', bg: 'bg-orange-400/20' },
  vermelho: { label: 'GARGALO', color: 'text-destructive', bg: 'bg-destructive/20' },
  azul: { label: 'OCIOSO', color: 'text-blue-400', bg: 'bg-blue-400/20' },
};

const progressColors: Record<string, string> = {
  verde: 'bg-success',
  amarelo: 'bg-warning',
  laranja: 'bg-orange-400',
  vermelho: 'bg-destructive',
  azul: 'bg-sky-400',
};

const dotColors: Record<string, string> = {
  verde: 'bg-success',
  amarelo: 'bg-warning',
  laranja: 'bg-orange-400',
  vermelho: 'bg-destructive',
  azul: 'bg-sky-400',
};

const textColors: Record<string, string> = {
  verde: 'text-success',
  amarelo: 'text-warning',
  laranja: 'text-orange-400',
  vermelho: 'text-destructive',
  azul: 'text-sky-400',
};

export function SetorCard({
  nome, sigla, carga, capacidadeReal, horasNecessarias,
  lotacaoAtual, maquinas, diasUteis, diasUteisManual,
  eficiencia, folga, status,
}: SetorCardProps) {
  const statusInfo = statusLabels[status] || statusLabels.azul;

  return (
    <div className="rounded-xl border border-border/30 bg-card/80 p-4 transition-all duration-300 hover:border-primary/30">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn('w-2.5 h-2.5 rounded-full', dotColors[status])} />
          <h3 className="font-display font-bold text-foreground text-sm lg:text-base">{nome}</h3>
        </div>
        <div className={cn('flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', statusInfo.bg, statusInfo.color)}>
          <Zap className="h-3 w-3" />
          {statusInfo.label}
        </div>
      </div>

      {/* Carga Progress */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-muted-foreground">Ocupação</span>
          <span className={cn('font-bold', textColors[status])}>{carga}%</span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all', progressColors[status])}
            style={{ width: `${Math.min(100, carga)}%` }}
          />
        </div>
      </div>

      {/* 🔵 CAPACIDADE (OFERTA) */}
      <div className="mb-3">
        <p className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider mb-1.5">▸ Capacidade (Oferta)</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-secondary/30 rounded-lg p-2">
            <p className="text-[10px] text-muted-foreground">Equipe</p>
            <p className="text-base font-bold text-foreground">{lotacaoAtual}</p>
          </div>
          <div className="bg-secondary/30 rounded-lg p-2">
            <p className="text-[10px] text-muted-foreground">Multiplicador</p>
            <p className="text-base font-bold text-foreground">{maquinas}×</p>
          </div>
          <div className="bg-secondary/30 rounded-lg p-2">
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Calendar className="h-2.5 w-2.5" /> Dias Úteis
            </p>
            <div className="flex items-baseline gap-1">
              <p className="text-base font-bold text-foreground">{diasUteis}d</p>
              <span className={cn('text-[8px] px-1 py-0.5 rounded', diasUteisManual ? 'bg-blue-500/20 text-blue-400' : 'bg-secondary text-muted-foreground')}>
                {diasUteisManual ? 'Manual' : 'Auto'}
              </span>
            </div>
          </div>
          <div className="bg-blue-500/10 rounded-lg p-2 border border-blue-500/20">
            <p className="text-[10px] text-blue-400">Cap. Total</p>
            <p className="text-base font-bold text-blue-400">{capacidadeReal}h</p>
          </div>
        </div>
      </div>

      {/* 🟢 PRODUÇÃO (DEMANDA) */}
      <div className="mb-3">
        <p className="text-[10px] font-semibold text-success uppercase tracking-wider mb-1.5">▸ Produção (Demanda)</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-secondary/30 rounded-lg p-2">
            <p className="text-[10px] text-muted-foreground">Eficiência</p>
            <p className="text-base font-bold text-foreground">{eficiencia}%</p>
          </div>
          <div className="bg-secondary/30 rounded-lg p-2">
            <p className="text-[10px] text-muted-foreground">Necessário</p>
            <p className="text-base font-bold text-foreground">{horasNecessarias}h</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between pt-2 border-t border-border/30">
        <div>
          <p className="text-[10px] text-muted-foreground">Folga</p>
          <p className={cn('text-sm font-bold', folga >= 0 ? 'text-success' : 'text-destructive')}>{folga >= 0 ? '+' : ''}{folga}h</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-muted-foreground">Demanda ÷ Oferta</p>
          <p className={cn('text-sm font-bold', textColors[status])}>{carga}%</p>
        </div>
      </div>
    </div>
  );
}
