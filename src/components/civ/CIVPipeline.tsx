import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  FunnelChart, Funnel, LabelList, Cell,
} from 'recharts';
import { civChartData } from '@/data/civData';
import { KPICard } from '@/components/ui/KPICard';
import { ModuleCard } from '@/components/ui/ModuleCard';
import { Target, TrendingUp, AlertTriangle, DollarSign } from 'lucide-react';

const COLORS = ['#22c55e', '#4ade80', '#86efac', '#bbf7d0', '#dcfce7'];

export function CIVPipeline() {
  const totalValor = civChartData.pipelineFunil.reduce((acc, p) => acc + p.valor, 0);
  const valorEmRisco = civChartData.pipelineFunil.find(p => p.etapa === 'Perdido')?.valor || 0;
  const taxaConversao = ((civChartData.pipelineFunil.find(p => p.etapa === 'Aprovado')?.quantidade || 0) / 
    (civChartData.pipelineFunil.find(p => p.etapa === 'Lead')?.quantidade || 1) * 100).toFixed(0);

  const funnelData = civChartData.pipelineFunil.filter(p => p.etapa !== 'Perdido').map((item, index) => ({
    ...item,
    fill: COLORS[index],
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          title="Valor Pipeline"
          value={`R$ ${(totalValor / 1000).toFixed(0)}k`}
          subtitle="Total potencial"
          icon={<DollarSign className="h-5 w-5" />}
          variant="civ"
        />
        <KPICard
          title="Taxa Conversão"
          value={`${taxaConversao}%`}
          subtitle="Lead → Aprovado"
          icon={<Target className="h-5 w-5" />}
          trend="up"
          trendValue="+3%"
          variant="civ"
        />
        <KPICard
          title="Valor Potencial"
          value={`R$ ${((totalValor - valorEmRisco) / 1000).toFixed(0)}k`}
          subtitle="Em negociação"
          icon={<TrendingUp className="h-5 w-5" />}
          variant="civ"
        />
        <KPICard
          title="Valor em Risco"
          value={`R$ ${(valorEmRisco / 1000).toFixed(0)}k`}
          subtitle="Perdidos"
          icon={<AlertTriangle className="h-5 w-5" />}
          trend="down"
          trendValue="-12%"
          variant="civ"
        />
      </div>

      {/* Funil Visual */}
      <ModuleCard title="Funil de Vendas" variant="civ">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 py-6">
          {civChartData.pipelineFunil.map((etapa, index) => (
            <div 
              key={etapa.etapa}
              className="relative flex flex-col items-center"
            >
              <div 
                className="w-full rounded-lg p-4 text-center transition-transform hover:scale-105"
                style={{ 
                  backgroundColor: etapa.etapa === 'Perdido' ? '#ef444420' : `${COLORS[index]}20`,
                  borderLeft: `4px solid ${etapa.etapa === 'Perdido' ? '#ef4444' : COLORS[index]}`
                }}
              >
                <p className="text-2xl font-bold text-foreground">{etapa.quantidade}</p>
                <p className="text-sm text-muted-foreground mt-1">{etapa.etapa}</p>
                <p className="text-sm font-semibold mt-2" style={{ color: etapa.etapa === 'Perdido' ? '#ef4444' : COLORS[index] }}>
                  R$ {(etapa.valor / 1000).toFixed(0)}k
                </p>
              </div>
              {index < civChartData.pipelineFunil.length - 1 && etapa.etapa !== 'Aprovado' && (
                <div className="hidden lg:block absolute -right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                  →
                </div>
              )}
            </div>
          ))}
        </div>
      </ModuleCard>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ModuleCard title="Valor por Etapa" variant="civ">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={civChartData.pipelineFunil.filter(p => p.etapa !== 'Perdido')}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="etapa" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }} formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Valor']} />
                <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
                  {civChartData.pipelineFunil.filter(p => p.etapa !== 'Perdido').map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ModuleCard>

        <ModuleCard title="Quantidade por Etapa" variant="civ">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={civChartData.pipelineFunil} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={true} vertical={false} />
                <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} />
                <YAxis type="category" dataKey="etapa" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} width={90} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }} />
                <Bar dataKey="quantidade" radius={[0, 4, 4, 0]} barSize={20}>
                  {civChartData.pipelineFunil.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.etapa === 'Perdido' ? '#ef4444' : COLORS[Math.min(index, COLORS.length - 1)]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ModuleCard>
      </div>
    </div>
  );
}
