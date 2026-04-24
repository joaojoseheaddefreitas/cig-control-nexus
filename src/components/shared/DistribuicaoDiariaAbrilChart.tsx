import { useEffect, useState } from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { ModuleCard } from '@/components/ui/ModuleCard';
import { fetchDistribuicaoDiariaAbril, type DistribuicaoDiariaAbril } from '@/services/serieMensalService';

interface DistribuicaoDiariaAbrilChartProps {
  metricas: Array<'vendas' | 'producao' | 'compras'>;
  variant?: 'civ' | 'cip' | 'cif' | 'cig' | 'cic';
  title?: string;
  subtitle?: string;
}

const COLORS = {
  vendas: 'hsl(145, 70%, 42%)',
  producao: 'hsl(215, 75%, 48%)',
  compras: 'hsl(30, 90%, 50%)',
};

const LABELS = {
  vendas: 'Vendas',
  producao: 'Produção',
  compras: 'Compras',
};

const fmtK = (v: number) => `${(v / 1000).toFixed(0)}k`;
const fmtBR = (v: number) => `R$ ${v.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;

export function DistribuicaoDiariaAbrilChart({
  metricas,
  variant = 'cig',
  title = 'Distribuição Diária – Abril/2026',
  subtitle,
}: DistribuicaoDiariaAbrilChartProps) {
  const [data, setData] = useState<DistribuicaoDiariaAbril[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDistribuicaoDiariaAbril().then(d => { setData(d); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <ModuleCard title={title} variant={variant}>
        <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
          Carregando distribuição diária…
        </div>
      </ModuleCard>
    );
  }

  const totais = metricas.reduce((acc, m) => {
    acc[m] = data.reduce((s, d) => s + (d[m] || 0), 0);
    return acc;
  }, {} as Record<string, number>);

  return (
    <ModuleCard title={title} variant={variant}>
      {subtitle && <p className="text-xs text-muted-foreground -mt-2 mb-3">{subtitle}</p>}

      <div className="grid grid-cols-3 gap-2 mb-3">
        {metricas.map(m => (
          <div key={m} className="rounded-lg border border-border/40 bg-card/50 p-2">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Acum. {LABELS[m]}</p>
            <p className="text-sm font-bold text-foreground">{fmtBR(totais[m])}</p>
          </div>
        ))}
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="dia" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
            <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} tickFormatter={fmtK} />
            <Tooltip
              contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
              formatter={(v: number, name: string) => [fmtBR(v), name]}
              labelFormatter={(l) => `Dia ${l}/04`}
            />
            <Legend wrapperStyle={{ fontSize: '11px' }} />
            {metricas.map((m, i) => (
              i === 0 ? (
                <Bar key={m} dataKey={m} name={LABELS[m]} fill={COLORS[m]} radius={[3, 3, 0, 0]} barSize={14} />
              ) : (
                <Line key={m} type="monotone" dataKey={m} name={LABELS[m]} stroke={COLORS[m]} strokeWidth={2} dot={{ r: 3 }} />
              )
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </ModuleCard>
  );
}
