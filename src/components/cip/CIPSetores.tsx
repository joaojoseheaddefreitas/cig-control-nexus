import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from 'recharts';
import { setoresProducao, FOLGA_PRODUCAO, calcularDiasEquivalentes } from '@/data/cipData';
import { KPICard } from '@/components/ui/KPICard';
import { ModuleCard } from '@/components/ui/ModuleCard';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Layers, Users, Clock, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';

const getStatusColor = (lotacao: number) => {
  if (lotacao >= 85 || lotacao < 0) return '#ef4444';
  if (lotacao >= 70) return '#f59e0b';
  return '#22c55e';
};

const getStatusLabel = (lotacao: number) => {
  if (lotacao >= 85 || lotacao < 0) return 'Crítico';
  if (lotacao >= 70) return 'Atenção';
  return 'Normal';
};

export function CIPSetores() {
  const setoresAtivos = setoresProducao.filter(s => s.lotacao > 0 && s.lotacao <= 100);
  const setoresGargalo = setoresProducao.filter(s => s.gargalo);
  const totalOperadores = setoresProducao.reduce((acc, s) => acc + s.operadores, 0);
  const eficienciaMedia = setoresProducao.reduce((acc, s) => acc + s.eficiencia, 0) / setoresProducao.length;

  const chartData = setoresProducao
    .filter(s => s.lotacao > 0 && s.lotacao <= 100)
    .slice(0, 12)
    .map(s => ({
      setor: s.nome.substring(0, 12),
      lotacao: s.lotacao,
      horasDisp: s.horasDisponiveis,
      horasNec: s.horasNecessarias,
    }));

  const radarData = setoresProducao.slice(0, 8).map(s => ({
    setor: s.nome.substring(0, 10),
    eficiencia: s.eficiencia,
    ocupacao: Math.min(100, Math.max(0, s.lotacao)),
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          title="Total Setores"
          value={setoresProducao.length}
          subtitle={`${setoresAtivos.length} ativos`}
          icon={<Layers className="h-5 w-5" />}
          variant="cip"
        />
        <KPICard
          title="Operadores"
          value={totalOperadores}
          subtitle="Em todos os setores"
          icon={<Users className="h-5 w-5" />}
          variant="cip"
        />
        <KPICard
          title="Eficiência Média"
          value={`${eficienciaMedia.toFixed(0)}%`}
          subtitle="Produtividade"
          icon={<TrendingUp className="h-5 w-5" />}
          trend="up"
          trendValue="+2.5%"
          variant="cip"
        />
        <KPICard
          title="Gargalos"
          value={setoresGargalo.length}
          subtitle="Setores críticos"
          icon={<AlertTriangle className="h-5 w-5" />}
          trend="down"
          trendValue="Requer ação"
          variant="cip"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lotação por Setor */}
        <ModuleCard title="Lotação por Setor (%)" variant="cip">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={true} vertical={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="setor" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={{ stroke: '#333' }} width={100} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }} 
                  formatter={(value: number) => [`${value}%`, 'Lotação']}
                />
                <Bar dataKey="lotacao" radius={[0, 4, 4, 0]} barSize={16}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getStatusColor(entry.lotacao)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ModuleCard>

        {/* Radar de Eficiência */}
        <ModuleCard title="Eficiência vs Ocupação" variant="cip">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#333" />
                <PolarAngleAxis dataKey="setor" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                <Radar name="Eficiência" dataKey="eficiencia" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} />
                <Radar name="Ocupação" dataKey="ocupacao" stroke="#f97316" fill="#f97316" fillOpacity={0.3} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </ModuleCard>
      </div>

      {/* Tabela de Setores */}
      <ModuleCard title="Detalhe dos Setores" variant="cip">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Setor</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">Operadores</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">Máquinas</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">Eficiência</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">H. Disponíveis</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">H. Necessárias</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">Dias Equiv.</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium w-32">Lotação</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {setoresProducao.map((setor) => {
                const lotacaoNormalizada = Math.min(100, Math.max(0, setor.lotacao));
                const diasEquivalentes = calcularDiasEquivalentes(setor.horasNecessarias);
                
                return (
                  <tr key={setor.id} className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {setor.gargalo && <AlertTriangle className="h-4 w-4 text-destructive" />}
                        <span className="text-foreground font-medium">{setor.nome}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center text-foreground">{setor.operadores}</td>
                    <td className="py-3 px-4 text-center text-muted-foreground">{setor.maquinas}</td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant="outline">{setor.eficiencia}%</Badge>
                    </td>
                    <td className="py-3 px-4 text-right text-foreground">{setor.horasDisponiveis.toFixed(1)}h</td>
                    <td className="py-3 px-4 text-right text-foreground">{setor.horasNecessarias.toFixed(1)}h</td>
                    <td className="py-3 px-4 text-right font-bold text-cip">{diasEquivalentes}d</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={lotacaoNormalizada} 
                          className="h-2 flex-1"
                          style={{ 
                            '--progress-background': getStatusColor(setor.lotacao) 
                          } as React.CSSProperties}
                        />
                        <span className="text-xs w-10 text-right" style={{ color: getStatusColor(setor.lotacao) }}>
                          {setor.lotacao > 100 ? '>100' : setor.lotacao < 0 ? '<0' : setor.lotacao}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge style={{ 
                        backgroundColor: getStatusColor(setor.lotacao) + '20', 
                        color: getStatusColor(setor.lotacao),
                        border: `1px solid ${getStatusColor(setor.lotacao)}`
                      }}>
                        {getStatusLabel(setor.lotacao)}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </ModuleCard>

      {/* Legenda */}
      <div className="p-4 bg-secondary/30 rounded-lg flex flex-wrap gap-6">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500" />
          <span className="text-sm text-muted-foreground">Normal (&lt;70%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-amber-500" />
          <span className="text-sm text-muted-foreground">Atenção (70-85%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500" />
          <span className="text-sm text-muted-foreground">Crítico (&gt;85%)</span>
        </div>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <span className="text-sm text-muted-foreground">Gargalo identificado</span>
        </div>
      </div>
    </div>
  );
}
