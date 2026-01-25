import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, ComposedChart, Area, Legend,
} from 'recharts';
import { cipKPIs, setoresProducao, capacidadeDiaria, FOLGA_PRODUCAO, calcularDiasEquivalentes } from '@/data/cipData';
import { KPICard } from '@/components/ui/KPICard';
import { ModuleCard } from '@/components/ui/ModuleCard';
import { Badge } from '@/components/ui/badge';
import { Clock, Activity, Calendar, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

export function CIPCapacidade() {
  const capacidadeLiquida = cipKPIs.capacidadeTotal * (1 - FOLGA_PRODUCAO);
  const horasDisponiveis = capacidadeLiquida - cipKPIs.capacidadeUtilizada;
  const diasDisponiveis = calcularDiasEquivalentes(horasDisponiveis);
  
  const chartCapacidadeDia = capacidadeDiaria.map(d => ({
    dia: new Date(d.data).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }),
    programado: d.horasProgramadas,
    disponivel: d.horasDisponiveis * (1 - FOLGA_PRODUCAO),
    ocupacao: d.ocupacaoPercentual,
    status: d.status,
  }));

  const chartCapacidadeSetor = setoresProducao
    .filter(s => s.lotacao > 0)
    .slice(0, 10)
    .map(s => ({
      setor: s.nome.substring(0, 10),
      disponivel: s.horasDisponiveis * (1 - FOLGA_PRODUCAO),
      utilizado: s.horasUtilizadas,
      livre: Math.max(0, (s.horasDisponiveis * (1 - FOLGA_PRODUCAO)) - s.horasUtilizadas),
    }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Painel Principal de Capacidade */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-2 p-6 bg-card/50 border border-border/50 rounded-lg">
          <h3 className="text-lg font-bold text-foreground mb-4">Visão Geral de Capacidade</h3>
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center p-4 bg-secondary/30 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">CAPACIDADE BRUTA</p>
              <p className="text-3xl font-bold text-foreground">{cipKPIs.capacidadeTotal.toFixed(0)}h</p>
              <p className="text-sm text-muted-foreground">{calcularDiasEquivalentes(cipKPIs.capacidadeTotal)} dias</p>
            </div>
            <div className="text-center p-4 bg-cip/10 border border-cip/30 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">CAPACIDADE LÍQUIDA</p>
              <p className="text-3xl font-bold text-cip">{capacidadeLiquida.toFixed(0)}h</p>
              <p className="text-sm text-cip">(-{(FOLGA_PRODUCAO * 100).toFixed(0)}% folga)</p>
            </div>
            <div className="text-center p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">DISPONÍVEL</p>
              <p className="text-3xl font-bold text-green-500">{horasDisponiveis.toFixed(0)}h</p>
              <p className="text-sm text-green-500">{diasDisponiveis} dias livres</p>
            </div>
          </div>
          
          {/* Barra de Progresso */}
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Utilização atual</span>
              <span className="font-semibold text-foreground">{cipKPIs.ocupacaoPercentual}%</span>
            </div>
            <div className="h-6 bg-secondary rounded-full overflow-hidden flex">
              <div 
                className="h-full bg-cip transition-all"
                style={{ width: `${cipKPIs.ocupacaoPercentual}%` }}
              />
              <div 
                className="h-full bg-cip/30"
                style={{ width: `${FOLGA_PRODUCAO * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-xs mt-1 text-muted-foreground">
              <span>Utilizado: {cipKPIs.capacidadeUtilizada.toFixed(0)}h</span>
              <span>Folga: {(cipKPIs.capacidadeTotal * FOLGA_PRODUCAO).toFixed(0)}h</span>
              <span>Livre: {horasDisponiveis.toFixed(0)}h</span>
            </div>
          </div>
        </div>

        {/* Indicadores Rápidos */}
        <div className="space-y-4">
          <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Aceita novos pedidos</p>
                <p className="text-xl font-bold text-green-500">{diasDisponiveis} dias</p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-sm text-muted-foreground">Próximo gargalo em</p>
                <p className="text-xl font-bold text-amber-500">2 dias</p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-secondary/50 border border-border/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Dias programados</p>
                <p className="text-xl font-bold text-foreground">{cipKPIs.diasProgramados}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          title="Horas/Dia"
          value={`${cipKPIs.horasParaDias}h`}
          subtitle="Conversão padrão"
          icon={<Clock className="h-5 w-5" />}
          variant="cip"
        />
        <KPICard
          title="Turnos Ativos"
          value={cipKPIs.turnosAtivos}
          subtitle="Em operação"
          icon={<Activity className="h-5 w-5" />}
          variant="cip"
        />
        <KPICard
          title="Eficiência"
          value={`${cipKPIs.eficienciaMedia}%`}
          subtitle="Média geral"
          icon={<TrendingUp className="h-5 w-5" />}
          trend="up"
          trendValue="+2%"
          variant="cip"
        />
        <KPICard
          title="Folga Fixa"
          value={`${(FOLGA_PRODUCAO * 100).toFixed(0)}%`}
          subtitle="Não editável"
          icon={<AlertTriangle className="h-5 w-5" />}
          variant="cip"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Capacidade por Dia */}
        <ModuleCard title="Capacidade vs Programado por Dia" variant="cip">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartCapacidadeDia}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="dia" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }} />
                <Legend />
                <Bar dataKey="programado" fill="#f97316" name="Programado" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="disponivel" stroke="#22c55e" strokeWidth={2} name="Cap. Líquida" dot={{ fill: '#22c55e' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </ModuleCard>

        {/* Capacidade por Setor */}
        <ModuleCard title="Utilização por Setor (horas)" variant="cip">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartCapacidadeSetor} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={true} vertical={false} />
                <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} />
                <YAxis type="category" dataKey="setor" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={{ stroke: '#333' }} width={80} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }} />
                <Legend />
                <Bar dataKey="utilizado" stackId="a" fill="#f97316" name="Utilizado" />
                <Bar dataKey="livre" stackId="a" fill="#22c55e" name="Livre" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ModuleCard>
      </div>

      {/* Tabela de Capacidade Diária */}
      <ModuleCard title="Capacidade Programada por Dia" variant="cip">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Data</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">H. Disponíveis</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">H. Programadas</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">H. Realizadas</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">Ocupação (%)</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">Folga (%)</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">Dias Equiv.</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {capacidadeDiaria.map((dia, index) => (
                <tr key={index} className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                  <td className="py-3 px-4 font-medium text-foreground">
                    {new Date(dia.data).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' })}
                  </td>
                  <td className="py-3 px-4 text-right text-foreground">{dia.horasDisponiveis.toFixed(1)}h</td>
                  <td className="py-3 px-4 text-right text-cip font-semibold">{dia.horasProgramadas.toFixed(1)}h</td>
                  <td className="py-3 px-4 text-right text-muted-foreground">{dia.horasRealizadas.toFixed(1)}h</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`font-bold ${
                      dia.status === 'verde' ? 'text-green-500' :
                      dia.status === 'amarelo' ? 'text-amber-500' :
                      'text-red-500'
                    }`}>
                      {dia.ocupacaoPercentual}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center text-muted-foreground">{dia.folga}%</td>
                  <td className="py-3 px-4 text-right font-bold text-cip">{dia.diasEquivalentes}d</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`text-2xl ${
                      dia.status === 'verde' ? '' :
                      dia.status === 'amarelo' ? '' :
                      ''
                    }`}>
                      {dia.status === 'verde' ? '🟢' : dia.status === 'amarelo' ? '🟡' : '🔴'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ModuleCard>

      {/* Info */}
      <div className="p-4 bg-cip/10 border border-cip/30 rounded-lg">
        <p className="text-sm text-cip">
          ℹ️ A capacidade líquida já considera a folga fixa de {(FOLGA_PRODUCAO * 100).toFixed(0)}%. 
          Conversão: {cipKPIs.horasParaDias}h = 1 dia de produção. 
          Status: 🟢 Normal (&lt;70%) | 🟡 Atenção (70-85%) | 🔴 Crítico (&gt;85%)
        </p>
      </div>
    </div>
  );
}
