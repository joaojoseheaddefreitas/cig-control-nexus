import { useEffect, useState } from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { ModuleCard } from '@/components/ui/ModuleCard';
import { fetchSerieMensal2026, calcularMediaTrimestral, type SerieMensal } from '@/services/serieMensalService';
import { TrendingUp } from 'lucide-react';

interface SerieMensal2026Props {
  /** Métricas a exibir. */
  metricas: Array<'faturamento' | 'producao' | 'compras'>;
  /** Variante visual do ModuleCard (cor do header) */
  variant?: 'civ' | 'cip' | 'cif' | 'cig' | 'cic';
  /** Título do card */
  title?: string;
  /** Subtítulo (opcional) */
  subtitle?: string;
}

const COLORS = {
  faturamento: 'hsl(145, 70%, 42%)',
  producao: 'hsl(215, 75%, 48%)',
  compras: 'hsl(30, 90%, 50%)',
};

const LABELS = {
  faturamento: 'Faturamento',
  producao: 'Produção',
  compras: 'Compras',
};

const fmtK = (v: number) => `R$${(v / 1000).toFixed(0)}k`;
const fmtBR = (v: number) => `R$ ${v.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;

export function SerieMensal2026({ metricas, variant = 'cig', title = 'Evolução 2026', subtitle }: SerieMensal2026Props) {
  const [serie, setSerie] = useState<SerieMensal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSerieMensal2026().then(d => { setSerie(d); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <ModuleCard title={title} variant={variant}>
        <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
          Carregando série mensal…
        </div>
      </ModuleCard>
    );
  }

  const media = calcularMediaTrimestral(serie);
  const abr = serie[3]?.[metricas[0]] || 0;
  const triMedia = media[metricas[0]];
  const crescimento = triMedia > 0 ? ((abr / triMedia) - 1) * 100 : 0;

  return (
    <ModuleCard title={title} variant={variant}>
      {subtitle && <p className="text-xs text-muted-foreground -mt-2 mb-3">{subtitle}</p>}

      {/* Mini KPIs trimestrais */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {metricas.map(m => (
          <div key={m} className="rounded-lg border border-border/40 bg-card/50 p-2">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Méd. Tri {LABELS[m]}</p>
            <p className="text-sm font-bold text-foreground">{fmtBR(media[m])}</p>
          </div>
        ))}
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={serie} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="mes" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
            <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} tickFormatter={fmtK} />
            <Tooltip
              contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
              formatter={(v: number, name: string) => [fmtBR(v), name]}
            />
            <Legend wrapperStyle={{ fontSize: '11px' }} />
            {metricas.map((m, i) => (
              i === 0 ? (
                <Bar key={m} dataKey={m} name={LABELS[m]} fill={COLORS[m]} radius={[4, 4, 0, 0]} barSize={32} />
              ) : (
                <Line key={m} type="monotone" dataKey={m} name={LABELS[m]} stroke={COLORS[m]} strokeWidth={2} dot={{ r: 4 }} />
              )
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs">
        <TrendingUp className="h-3.5 w-3.5 text-success" />
        <span className="text-muted-foreground">
          Abril vs Média Tri:{' '}
          <span className={crescimento >= 0 ? 'text-success font-semibold' : 'text-destructive font-semibold'}>
            {crescimento >= 0 ? '+' : ''}{crescimento.toFixed(1)}%
          </span>
        </span>
      </div>
    </ModuleCard>
  );
}
