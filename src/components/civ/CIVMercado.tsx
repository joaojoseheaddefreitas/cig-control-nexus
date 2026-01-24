import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, BarChart, Bar,
} from 'recharts';
import { civChartData } from '@/data/civData';
import { KPICard } from '@/components/ui/KPICard';
import { ModuleCard } from '@/components/ui/ModuleCard';
import { TrendingUp, BarChart2, Calendar, Zap } from 'lucide-react';

export function CIVMercado() {
  const crescimentoProjetado = 28;
  const picoSazonal = 'Nov/Dez';
  const tendenciaAlta = 'Sofás Retráteis';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          title="Crescimento Proj."
          value={`+${crescimentoProjetado}%`}
          subtitle="Próx. 6 meses"
          icon={<TrendingUp className="h-5 w-5" />}
          trend="up"
          trendValue="Positivo"
          variant="civ"
        />
        <KPICard
          title="Pico Sazonal"
          value={picoSazonal}
          subtitle="Alta demanda"
          icon={<Calendar className="h-5 w-5" />}
          variant="civ"
        />
        <KPICard
          title="Em Alta"
          value={tendenciaAlta}
          subtitle="Tendência"
          icon={<Zap className="h-5 w-5" />}
          variant="civ"
        />
        <KPICard
          title="Índice Atual"
          value="95"
          subtitle="Demanda vs média"
          icon={<BarChart2 className="h-5 w-5" />}
          trend="up"
          trendValue="+5"
          variant="civ"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ModuleCard title="Demanda Histórica vs Projeção" variant="civ">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[...civChartData.vendasPeriodo, ...civChartData.tendenciaDemanda.map(t => ({ mes: t.mes, vendas: null, projecao: t.projecao }))]}>
                <defs>
                  <linearGradient id="colorHistorico" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorProjecao" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="mes" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }} formatter={(value: number) => value ? [`R$ ${value.toLocaleString('pt-BR')}`, ''] : ['-', '']} />
                <Legend />
                <Area type="monotone" dataKey="vendas" stroke="#22c55e" strokeWidth={2} fill="url(#colorHistorico)" name="Histórico" />
                <Area type="monotone" dataKey="projecao" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" fill="url(#colorProjecao)" name="Projeção" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ModuleCard>

        <ModuleCard title="Índice de Sazonalidade" variant="civ">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={civChartData.sazonalidade}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="mes" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} domain={[0, 150]} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }} />
                <Bar 
                  dataKey="indice" 
                  name="Índice"
                  radius={[4, 4, 0, 0]}
                  fill="#22c55e"
                />
                {/* Reference line at 100 */}
                <Line type="monotone" dataKey={() => 100} stroke="#6b7280" strokeDasharray="5 5" dot={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ModuleCard>
      </div>

      {/* Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ModuleCard title="Tendências de Consumo" variant="civ">
          <div className="space-y-3 p-2">
            <div className="p-3 bg-green-500/10 border-l-4 border-green-500 rounded">
              <p className="text-sm font-medium text-foreground">Sofás Retráteis</p>
              <p className="text-xs text-muted-foreground">Crescimento de 45% no trimestre</p>
            </div>
            <div className="p-3 bg-blue-500/10 border-l-4 border-blue-500 rounded">
              <p className="text-sm font-medium text-foreground">Móveis Compactos</p>
              <p className="text-xs text-muted-foreground">Demanda estável, +12% YoY</p>
            </div>
            <div className="p-3 bg-amber-500/10 border-l-4 border-amber-500 rounded">
              <p className="text-sm font-medium text-foreground">Conjuntos Sala</p>
              <p className="text-xs text-muted-foreground">Queda de 8%, revisar mix</p>
            </div>
          </div>
        </ModuleCard>

        <ModuleCard title="Produtos em Alta" variant="civ">
          <div className="space-y-3 p-2">
            <div className="flex items-center justify-between p-3 bg-secondary/30 rounded">
              <span className="text-sm text-foreground">Sofá Flex 2L</span>
              <span className="text-sm text-civ font-semibold">↑ 38%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-secondary/30 rounded">
              <span className="text-sm text-foreground">Cadeira Bergamo</span>
              <span className="text-sm text-civ font-semibold">↑ 28%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-secondary/30 rounded">
              <span className="text-sm text-foreground">Mesa Florença</span>
              <span className="text-sm text-civ font-semibold">↑ 22%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-secondary/30 rounded">
              <span className="text-sm text-foreground">Sofá Royale</span>
              <span className="text-sm text-civ font-semibold">↑ 18%</span>
            </div>
          </div>
        </ModuleCard>

        <ModuleCard title="Projeção Futura" variant="civ">
          <div className="space-y-3 p-2">
            <div className="p-4 bg-secondary/30 rounded-lg text-center">
              <p className="text-3xl font-bold text-civ">R$ 1.2M</p>
              <p className="text-sm text-muted-foreground mt-1">Projeção 2º Semestre</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-secondary/30 rounded text-center">
                <p className="text-lg font-semibold text-foreground">+35%</p>
                <p className="text-xs text-muted-foreground">Nov/Dez</p>
              </div>
              <div className="p-3 bg-secondary/30 rounded text-center">
                <p className="text-lg font-semibold text-foreground">85%</p>
                <p className="text-xs text-muted-foreground">Confiança</p>
              </div>
            </div>
          </div>
        </ModuleCard>
      </div>
    </div>
  );
}
