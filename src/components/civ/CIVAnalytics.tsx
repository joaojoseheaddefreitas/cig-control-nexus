import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, LineChart, Line,
} from 'recharts';
import { civChartData, civKPIs } from '@/data/civData';
import { KPICard } from '@/components/ui/KPICard';
import { ModuleCard } from '@/components/ui/ModuleCard';
import { BarChart2, TrendingUp, Target, Calendar } from 'lucide-react';

const comparativoData = [
  { periodo: 'Jan', atual: 145000, anterior: 128000 },
  { periodo: 'Fev', atual: 158000, anterior: 142000 },
  { periodo: 'Mar', atual: 172000, anterior: 155000 },
  { periodo: 'Abr', atual: 168000, anterior: 148000 },
  { periodo: 'Mai', atual: 179188, anterior: 162000 },
  { periodo: 'Jun', atual: 185000, anterior: 170000 },
];

const crescimentoData = [
  { mes: 'Jan', crescimento: 13.3 },
  { mes: 'Fev', crescimento: 11.3 },
  { mes: 'Mar', crescimento: 11.0 },
  { mes: 'Abr', crescimento: 13.5 },
  { mes: 'Mai', crescimento: 10.6 },
  { mes: 'Jun', crescimento: 8.8 },
];

const desempenhoPorPeriodo = [
  { periodo: 'Q1 2023', vendas: 425000, meta: 400000, atingimento: 106 },
  { periodo: 'Q2 2023', vendas: 510000, meta: 480000, atingimento: 106 },
  { periodo: 'Q3 2023', vendas: 485000, meta: 500000, atingimento: 97 },
  { periodo: 'Q4 2023', vendas: 620000, meta: 580000, atingimento: 107 },
  { periodo: 'Q1 2024', vendas: 475000, meta: 450000, atingimento: 106 },
  { periodo: 'Q2 2024', vendas: 532188, meta: 500000, atingimento: 106 },
];

export function CIVAnalytics() {
  const crescimentoMedio = crescimentoData.reduce((acc, c) => acc + c.crescimento, 0) / crescimentoData.length;
  const atingimentoMedio = desempenhoPorPeriodo.reduce((acc, d) => acc + d.atingimento, 0) / desempenhoPorPeriodo.length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          title="Crescimento Médio"
          value={`${crescimentoMedio.toFixed(1)}%`}
          subtitle="YoY"
          icon={<TrendingUp className="h-5 w-5" />}
          trend="up"
          trendValue="+2.1%"
          variant="civ"
        />
        <KPICard
          title="Atingimento Meta"
          value={`${atingimentoMedio.toFixed(0)}%`}
          subtitle="Média períodos"
          icon={<Target className="h-5 w-5" />}
          trend="up"
          trendValue="Acima"
          variant="civ"
        />
        <KPICard
          title="Melhor Trimestre"
          value="Q4 2023"
          subtitle="R$ 620k"
          icon={<Calendar className="h-5 w-5" />}
          variant="civ"
        />
        <KPICard
          title="Variação YTD"
          value="+18.5%"
          subtitle="vs mesmo período"
          icon={<BarChart2 className="h-5 w-5" />}
          trend="up"
          trendValue="Positivo"
          variant="civ"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ModuleCard title="Comparativo Ano Atual vs Anterior" variant="civ">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={comparativoData}>
                <defs>
                  <linearGradient id="colorAtual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorAnterior" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6b7280" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6b7280" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="periodo" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }} formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, '']} />
                <Legend />
                <Area type="monotone" dataKey="atual" stroke="#22c55e" strokeWidth={2} fill="url(#colorAtual)" name="2024" />
                <Area type="monotone" dataKey="anterior" stroke="#6b7280" strokeWidth={2} fill="url(#colorAnterior)" name="2023" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ModuleCard>

        <ModuleCard title="Taxa de Crescimento Mensal (%)" variant="civ">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={crescimentoData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="mes" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} tickFormatter={(v) => `${v}%`} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }} formatter={(value: number) => [`${value}%`, 'Crescimento']} />
                <Bar dataKey="crescimento" fill="#22c55e" radius={[4, 4, 0, 0]} name="Crescimento YoY" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ModuleCard>
      </div>

      {/* Desempenho por Período */}
      <ModuleCard title="Desempenho por Período (Trimestral)" variant="civ">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={desempenhoPorPeriodo}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
              <XAxis dataKey="periodo" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} />
              <YAxis yAxisId="left" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} tickFormatter={(v) => `${v}%`} domain={[90, 110]} />
              <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }} />
              <Legend />
              <Bar yAxisId="left" dataKey="vendas" fill="#22c55e" radius={[4, 4, 0, 0]} name="Vendas" />
              <Bar yAxisId="left" dataKey="meta" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Meta" opacity={0.5} />
              <Line yAxisId="right" type="monotone" dataKey="atingimento" stroke="#f97316" strokeWidth={2} dot={{ fill: '#f97316' }} name="Atingimento %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ModuleCard>

      {/* Análise Estratégica */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ModuleCard title="Destaques Positivos" variant="civ">
          <div className="space-y-3 p-2">
            <div className="p-3 bg-green-500/10 border-l-4 border-green-500 rounded">
              <p className="text-sm font-medium text-foreground">Meta batida 5 de 6 meses</p>
              <p className="text-xs text-muted-foreground">Performance consistente</p>
            </div>
            <div className="p-3 bg-green-500/10 border-l-4 border-green-500 rounded">
              <p className="text-sm font-medium text-foreground">Crescimento +18.5% YTD</p>
              <p className="text-xs text-muted-foreground">Acima da média do setor</p>
            </div>
            <div className="p-3 bg-green-500/10 border-l-4 border-green-500 rounded">
              <p className="text-sm font-medium text-foreground">Ticket médio em alta</p>
              <p className="text-xs text-muted-foreground">+12% no semestre</p>
            </div>
          </div>
        </ModuleCard>

        <ModuleCard title="Pontos de Atenção" variant="civ">
          <div className="space-y-3 p-2">
            <div className="p-3 bg-amber-500/10 border-l-4 border-amber-500 rounded">
              <p className="text-sm font-medium text-foreground">Margem em queda</p>
              <p className="text-xs text-muted-foreground">-0.5% no período</p>
            </div>
            <div className="p-3 bg-amber-500/10 border-l-4 border-amber-500 rounded">
              <p className="text-sm font-medium text-foreground">Conversão digital</p>
              <p className="text-xs text-muted-foreground">Abaixo do esperado</p>
            </div>
          </div>
        </ModuleCard>

        <ModuleCard title="Recomendações" variant="civ">
          <div className="space-y-3 p-2">
            <div className="p-3 bg-blue-500/10 border-l-4 border-blue-500 rounded">
              <p className="text-sm font-medium text-foreground">Revisar precificação</p>
              <p className="text-xs text-muted-foreground">Recuperar margem</p>
            </div>
            <div className="p-3 bg-blue-500/10 border-l-4 border-blue-500 rounded">
              <p className="text-sm font-medium text-foreground">Otimizar funil digital</p>
              <p className="text-xs text-muted-foreground">Aumentar conversão</p>
            </div>
            <div className="p-3 bg-blue-500/10 border-l-4 border-blue-500 rounded">
              <p className="text-sm font-medium text-foreground">Expandir classe A</p>
              <p className="text-xs text-muted-foreground">Prospectar grandes clientes</p>
            </div>
          </div>
        </ModuleCard>
      </div>
    </div>
  );
}
