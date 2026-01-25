import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, Legend,
} from 'recharts';
import { cipKPIs, cipChartData, setoresProducao, FOLGA_PRODUCAO } from '@/data/cipData';
import { KPICard } from '@/components/ui/KPICard';
import { ModuleCard } from '@/components/ui/ModuleCard';
import { Badge } from '@/components/ui/badge';
import { Clock, Activity, AlertTriangle, CheckCircle, Factory, Users, TrendingUp, Calendar } from 'lucide-react';

const statusColors = {
  verde: '#22c55e',
  amarelo: '#f59e0b',
  vermelho: '#ef4444',
};

export function CIPDashboard() {
  const gargalos = setoresProducao.filter(s => s.gargalo);
  
  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Capacidade Total"
          value={`${cipKPIs.capacidadeTotal.toFixed(0)}h`}
          subtitle={`${(cipKPIs.capacidadeTotal / 8).toFixed(0)} dias disponíveis`}
          icon={<Clock className="h-5 w-5" />}
          variant="cip"
        />
        <KPICard
          title="Ocupação Atual"
          value={`${cipKPIs.ocupacaoPercentual}%`}
          subtitle={`${cipKPIs.capacidadeUtilizada.toFixed(0)}h programadas`}
          icon={<Activity className="h-5 w-5" />}
          trend={cipKPIs.ocupacaoPercentual > 85 ? 'down' : 'up'}
          trendValue={cipKPIs.ocupacaoPercentual > 85 ? 'Crítico' : 'Normal'}
          variant="cip"
        />
        <KPICard
          title="OPs Ativas"
          value={cipKPIs.opsAtivas}
          subtitle={`${cipKPIs.opsConcluidas} concluídas`}
          icon={<Factory className="h-5 w-5" />}
          trend="up"
          trendValue="+12 esta semana"
          variant="cip"
        />
        <KPICard
          title="Gargalos"
          value={gargalos.length}
          subtitle="Setores críticos"
          icon={<AlertTriangle className="h-5 w-5" />}
          trend="down"
          trendValue="Requer ação"
          variant="cip"
        />
      </div>

      {/* Indicador de Folga Fixa */}
      <div className="p-4 bg-cip/10 border border-cip/30 rounded-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-cip animate-pulse" />
          <span className="text-sm font-medium text-foreground">
            Folga de Capacidade Fixa: <strong className="text-cip">{(FOLGA_PRODUCAO * 100).toFixed(0)}%</strong>
          </span>
          <span className="text-xs text-muted-foreground">(Não editável - Regra industrial)</span>
        </div>
        <Badge variant="outline" className="border-cip text-cip">
          Capacidade Líquida: {((1 - FOLGA_PRODUCAO) * cipKPIs.capacidadeTotal).toFixed(0)}h
        </Badge>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ocupação por Dia */}
        <ModuleCard title="Ocupação Diária (%)" variant="cip">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cipChartData.ocupacaoPorDia}>
                <defs>
                  <linearGradient id="colorOcupacao" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="dia" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }} formatter={(value: number) => [`${value}%`, 'Ocupação']} />
                <Area type="monotone" dataKey="ocupacao" stroke="#f97316" strokeWidth={2} fill="url(#colorOcupacao)" name="Ocupação" />
                <Line type="monotone" dataKey="limite" stroke="#ef4444" strokeDasharray="5 5" strokeWidth={1.5} dot={false} name="Limite 85%" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ModuleCard>

        {/* Capacidade por Setor */}
        <ModuleCard title="Utilização por Setor" variant="cip">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cipChartData.capacidadePorSetor} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={true} vertical={false} />
                <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="setor" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={{ stroke: '#333' }} width={100} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }} />
                <Bar dataKey="utilizada" stackId="a" fill="#f97316" name="Utilizada" radius={[0, 0, 0, 0]} />
                <Bar dataKey="disponivel" stackId="a" fill="#333" name="Disponível" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ModuleCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Produção por Status */}
        <ModuleCard title="Ordens por Status" variant="cip">
          <div className="h-72 flex items-center">
            <div className="w-1/2">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={cipChartData.producaoPorStatus} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="quantidade">
                    {cipChartData.producaoPorStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.cor} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 space-y-3">
              {cipChartData.producaoPorStatus.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.cor }} />
                    <span className="text-sm text-muted-foreground">{item.status}</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{item.quantidade}</span>
                </div>
              ))}
            </div>
          </div>
        </ModuleCard>

        {/* Evolução da Produção */}
        <ModuleCard title="Planejado vs Realizado" variant="cip">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cipChartData.evolucaoProducao}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="semana" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }} />
                <Legend />
                <Bar dataKey="planejado" fill="#6b7280" name="Planejado" radius={[4, 4, 0, 0]} />
                <Bar dataKey="realizado" fill="#22c55e" name="Realizado" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ModuleCard>
      </div>

      {/* Gargalos */}
      <ModuleCard title="Gargalos Identificados" variant="cip">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {gargalos.map((setor, index) => (
            <div
              key={index}
              className="p-4 rounded-lg border border-destructive/50 bg-destructive/10"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-foreground">{setor.nome}</span>
                <Badge variant="destructive">CRÍTICO</Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <p className="text-xs text-muted-foreground">Horas Necessárias</p>
                  <p className="text-lg font-bold text-destructive">{setor.horasNecessarias.toFixed(1)}h</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Horas Disponíveis</p>
                  <p className="text-lg font-bold text-foreground">{setor.horasDisponiveis.toFixed(1)}h</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="text-xs text-destructive">
                  Déficit: {(setor.horasNecessarias - setor.horasDisponiveis).toFixed(1)}h ({Math.ceil((setor.horasNecessarias - setor.horasDisponiveis) / 8)} dias)
                </span>
              </div>
            </div>
          ))}
        </div>
      </ModuleCard>
    </div>
  );
}
