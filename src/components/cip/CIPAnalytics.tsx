import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, Legend, ComposedChart,
} from 'recharts';
import { ModuleCard } from '@/components/ui/ModuleCard';
import { KPICard } from '@/components/ui/KPICard';
import { Badge } from '@/components/ui/badge';
import { BarChart2, TrendingUp, Clock, Target, Calendar, Activity } from 'lucide-react';

const evolucaoMensal = [
  { mes: 'Jul', produzido: 2850, meta: 3000, eficiencia: 68 },
  { mes: 'Ago', produzido: 3120, meta: 3000, eficiencia: 72 },
  { mes: 'Set', produzido: 2980, meta: 3200, eficiencia: 70 },
  { mes: 'Out', produzido: 3350, meta: 3200, eficiencia: 74 },
  { mes: 'Nov', produzido: 3480, meta: 3400, eficiencia: 73 },
  { mes: 'Dez', produzido: 3200, meta: 3400, eficiencia: 71 },
  { mes: 'Jan', produzido: 3580, meta: 3500, eficiencia: 75 },
];

const leadTimeHistorico = [
  { semana: 'Sem 1', leadTime: 12, meta: 10 },
  { semana: 'Sem 2', leadTime: 11, meta: 10 },
  { semana: 'Sem 3', leadTime: 10, meta: 10 },
  { semana: 'Sem 4', leadTime: 9, meta: 10 },
];

const ocupacaoHistorica = [
  { mes: 'Jul', ocupacao: 72 },
  { mes: 'Ago', ocupacao: 78 },
  { mes: 'Set', ocupacao: 75 },
  { mes: 'Out', ocupacao: 82 },
  { mes: 'Nov', ocupacao: 79 },
  { mes: 'Dez', ocupacao: 68 },
  { mes: 'Jan', ocupacao: 73 },
];

const comparativoSetores = [
  { setor: 'Montagem', atual: 77, anterior: 72 },
  { setor: 'Revestimento', atual: 75, anterior: 78 },
  { setor: 'Costura', atual: 59, anterior: 65 },
  { setor: 'Embalagem', atual: 71, anterior: 68 },
  { setor: 'Corte', atual: 95, anterior: 88 },
];

export function CIPAnalytics() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          title="Crescimento"
          value="+12%"
          subtitle="vs mês anterior"
          icon={<TrendingUp className="h-5 w-5" />}
          trend="up"
          trendValue="Positivo"
          variant="cip"
        />
        <KPICard
          title="Lead Time Médio"
          value="10 dias"
          subtitle="Prazo de entrega"
          icon={<Clock className="h-5 w-5" />}
          trend="up"
          trendValue="-2 dias"
          variant="cip"
        />
        <KPICard
          title="Atingimento Meta"
          value="102%"
          subtitle="Janeiro/2025"
          icon={<Target className="h-5 w-5" />}
          trend="up"
          trendValue="Superou"
          variant="cip"
        />
        <KPICard
          title="Eficiência Média"
          value="75%"
          subtitle="6 meses"
          icon={<Activity className="h-5 w-5" />}
          trend="up"
          trendValue="+5%"
          variant="cip"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolução Mensal */}
        <ModuleCard title="Evolução da Produção (6 meses)" variant="cip">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={evolucaoMensal}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="mes" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} />
                <YAxis yAxisId="left" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }} />
                <Legend />
                <Bar yAxisId="left" dataKey="produzido" fill="#22c55e" name="Produzido" radius={[4, 4, 0, 0]} />
                <Line yAxisId="left" type="monotone" dataKey="meta" stroke="#6b7280" strokeDasharray="5 5" name="Meta" dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="eficiencia" stroke="#f97316" strokeWidth={2} name="Eficiência %" dot={{ fill: '#f97316' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </ModuleCard>

        {/* Lead Time */}
        <ModuleCard title="Lead Time (Últimas 4 semanas)" variant="cip">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={leadTimeHistorico}>
                <defs>
                  <linearGradient id="colorLeadTime" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="semana" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} domain={[0, 15]} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }} formatter={(value: number) => [`${value} dias`, '']} />
                <Area type="monotone" dataKey="leadTime" stroke="#f97316" strokeWidth={2} fill="url(#colorLeadTime)" name="Lead Time" />
                <Line type="monotone" dataKey="meta" stroke="#22c55e" strokeDasharray="5 5" strokeWidth={1.5} dot={false} name="Meta" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ModuleCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ocupação Histórica */}
        <ModuleCard title="Ocupação Histórica (%)" variant="cip">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ocupacaoHistorica}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="mes" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }} formatter={(value: number) => [`${value}%`, 'Ocupação']} />
                <Line type="monotone" dataKey="ocupacao" stroke="#f97316" strokeWidth={3} dot={{ fill: '#f97316', strokeWidth: 2, r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ModuleCard>

        {/* Comparativo Setores */}
        <ModuleCard title="Comparativo de Setores (Atual vs Anterior)" variant="cip">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparativoSetores} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={true} vertical={false} />
                <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="setor" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} width={80} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }} />
                <Legend />
                <Bar dataKey="atual" fill="#f97316" name="Atual" barSize={12} />
                <Bar dataKey="anterior" fill="#6b7280" name="Mês Anterior" barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ModuleCard>
      </div>

      {/* Resumo Analítico */}
      <ModuleCard title="Resumo Analítico" variant="cip">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
            <h4 className="font-semibold text-green-500 mb-2">Pontos Positivos</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Crescimento de 12% na produção</li>
              <li>• Lead time reduzido em 2 dias</li>
              <li>• Meta de janeiro superada em 2%</li>
              <li>• Eficiência subiu 5 pontos</li>
            </ul>
          </div>
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <h4 className="font-semibold text-amber-500 mb-2">Pontos de Atenção</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Setor Corte com 95% ocupação</li>
              <li>• Dezembro teve queda de produção</li>
              <li>• Revestimento perdeu eficiência</li>
            </ul>
          </div>
          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <h4 className="font-semibold text-blue-500 mb-2">Próximas Ações</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Monitorar setor de Corte</li>
              <li>• Revisar processo Revestimento</li>
              <li>• Manter ritmo de janeiro</li>
            </ul>
          </div>
        </div>
      </ModuleCard>
    </div>
  );
}
