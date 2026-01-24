import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
} from 'recharts';
import { executiveKPIs, chartData, modules } from '@/data/cigData';
import { KPICard } from '@/components/ui/KPICard';
import { ModuleCard } from '@/components/ui/ModuleCard';
import {
  LayoutDashboard,
  TrendingUp,
  Factory,
  Package,
  Wallet,
  Users,
  Clock,
  Target,
  Activity,
} from 'lucide-react';

const COLORS = ['#3b82f6', '#22c55e', '#f97316', '#a855f7', '#ef4444', '#14b8a6'];

export function DashboardCIG() {
  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground">
            Dashboard Executivo
          </h2>
          <p className="text-muted-foreground mt-1">
            Visão consolidada de todas as centrais de inteligência
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Última atualização: {new Date().toLocaleString('pt-BR')}</span>
        </div>
      </div>

      {/* Executive Summary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard
          title="Lotação Geral"
          value={`${executiveKPIs.cig.lotacaoGeral}%`}
          subtitle={`${executiveKPIs.cig.operadoresTotal} operadores`}
          icon={<Users className="h-5 w-5" />}
          trend="up"
          trendValue="+2.3% vs semana anterior"
          variant="cig"
        />
        <KPICard
          title="Faturamento Mensal"
          value={`R$ ${(executiveKPIs.civ.faturamentoTotal / 1000).toFixed(1)}k`}
          subtitle={`Meta: R$ ${(executiveKPIs.civ.metaMensal / 1000).toFixed(0)}k`}
          icon={<TrendingUp className="h-5 w-5" />}
          trend="down"
          trendValue="17.9% da meta"
          variant="civ"
        />
        <KPICard
          title="Capacidade Produtiva"
          value={`${executiveKPIs.cip.disponibilidade}%`}
          subtitle={`${executiveKPIs.cip.capacidadeTotal.toFixed(0)}h disponíveis`}
          icon={<Factory className="h-5 w-5" />}
          trend="neutral"
          trendValue="Estável"
          variant="cip"
        />
        <KPICard
          title="Materiais Críticos"
          value={executiveKPIs.cic.materiaisCriticos}
          subtitle={`${executiveKPIs.cic.riscoRuptura} em risco`}
          icon={<Package className="h-5 w-5" />}
          trend="down"
          trendValue="Atenção necessária"
          variant="cic"
        />
        <KPICard
          title="Resultado Operacional"
          value={`R$ ${(executiveKPIs.cif.resultadoOperacional / 1000).toFixed(1)}k`}
          subtitle={`Margem: ${executiveKPIs.cif.margemLiquida}%`}
          icon={<Wallet className="h-5 w-5" />}
          trend="up"
          trendValue="+5.2% vs mês anterior"
          variant="cif"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CIV - Vendas Chart */}
        <ModuleCard
          title="CIV - Faturamento por Período"
          variant="civ"
          action={{ label: 'Ver detalhes', onClick: () => {} }}
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.faturamentoPeriodo}>
                <defs>
                  <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis
                  dataKey="mes"
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  axisLine={{ stroke: '#333' }}
                />
                <YAxis
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  axisLine={{ stroke: '#333' }}
                  tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a2e',
                    border: '1px solid #333',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Faturamento']}
                />
                <Area
                  type="monotone"
                  dataKey="valor"
                  stroke="#22c55e"
                  strokeWidth={2}
                  fill="url(#colorValor)"
                />
                <Line
                  type="monotone"
                  dataKey="meta"
                  stroke="#6b7280"
                  strokeDasharray="5 5"
                  strokeWidth={1.5}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ModuleCard>

        {/* CIP - Lotação por Setor */}
        <ModuleCard
          title="CIP - Lotação por Setor"
          variant="cip"
          action={{ label: 'Ver detalhes', onClick: () => {} }}
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData.lotacaoPorSetor.slice(0, 8)}
                layout="vertical"
                margin={{ left: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={true} vertical={false} />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={{ fill: '#9ca3af', fontSize: 11 }}
                  axisLine={{ stroke: '#333' }}
                  tickFormatter={(v) => `${v}%`}
                />
                <YAxis
                  type="category"
                  dataKey="setor"
                  tick={{ fill: '#9ca3af', fontSize: 10 }}
                  axisLine={{ stroke: '#333' }}
                  width={100}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a2e',
                    border: '1px solid #333',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`${value}%`, 'Lotação']}
                />
                <Bar
                  dataKey="lotacao"
                  fill="#f97316"
                  radius={[0, 4, 4, 0]}
                  barSize={16}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ModuleCard>

        {/* CIC - Materiais Críticos */}
        <ModuleCard
          title="CIC - Estoque de Materiais Críticos"
          variant="cic"
          action={{ label: 'Ver detalhes', onClick: () => {} }}
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.materiaisCriticos}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis
                  dataKey="material"
                  tick={{ fill: '#9ca3af', fontSize: 10 }}
                  axisLine={{ stroke: '#333' }}
                  angle={-20}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  axisLine={{ stroke: '#333' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a2e',
                    border: '1px solid #333',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="estoque" fill="#a855f7" name="Estoque Atual" radius={[4, 4, 0, 0]} />
                <Bar dataKey="minimo" fill="#6b7280" name="Estoque Mínimo" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ModuleCard>

        {/* CIF - Fluxo de Caixa */}
        <ModuleCard
          title="CIF - Fluxo de Caixa Semanal"
          variant="cif"
          action={{ label: 'Ver detalhes', onClick: () => {} }}
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.fluxoCaixa}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis
                  dataKey="semana"
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  axisLine={{ stroke: '#333' }}
                />
                <YAxis
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  axisLine={{ stroke: '#333' }}
                  tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a2e',
                    border: '1px solid #333',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, '']}
                />
                <Legend />
                <Bar dataKey="entradas" fill="#22c55e" name="Entradas" radius={[4, 4, 0, 0]} />
                <Bar dataKey="saidas" fill="#ef4444" name="Saídas" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ModuleCard>
      </div>

      {/* Vendas por Categoria */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ModuleCard
          title="CIV - Vendas por Categoria"
          variant="civ"
          className="lg:col-span-1"
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData.vendasPorCategoria}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="valor"
                >
                  {chartData.vendasPorCategoria.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a2e',
                    border: '1px solid #333',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, '']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 mt-2 justify-center">
            {chartData.vendasPorCategoria.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs text-muted-foreground">{item.categoria}</span>
              </div>
            ))}
          </div>
        </ModuleCard>

        {/* Performance Summary */}
        <ModuleCard
          title="CIG - Resumo de Performance"
          variant="cig"
          className="lg:col-span-2"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {modules.slice(1).map((module) => (
              <div
                key={module.id}
                className={`p-4 rounded-lg bg-secondary/30 border border-${module.cor}/20 hover:border-${module.cor}/50 transition-colors`}
              >
                <div className={`text-${module.cor} text-sm font-semibold mb-1`}>
                  {module.id}
                </div>
                <div className="text-xl font-display font-bold text-foreground">
                  {module.id === 'CIV' && '85%'}
                  {module.id === 'CIP' && '73%'}
                  {module.id === 'CIC' && '92%'}
                  {module.id === 'CIF' && '78%'}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {module.id === 'CIV' && 'Conv. Vendas'}
                  {module.id === 'CIP' && 'Lotação'}
                  {module.id === 'CIC' && 'Cobertura'}
                  {module.id === 'CIF' && 'Liquidez'}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Performance Global</span>
              <span className="text-foreground font-semibold">82%</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cig to-accent rounded-full transition-all duration-1000"
                style={{ width: '82%' }}
              />
            </div>
          </div>
        </ModuleCard>
      </div>
    </div>
  );
}
