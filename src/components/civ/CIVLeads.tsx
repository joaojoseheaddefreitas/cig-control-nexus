import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ComposedChart, Line, Legend, PieChart, Pie, Cell,
} from 'recharts';
import { leads, civChartData, civKPIs } from '@/data/civData';
import { KPICard } from '@/components/ui/KPICard';
import { ModuleCard } from '@/components/ui/ModuleCard';
import { Badge } from '@/components/ui/badge';
import { UserCheck, Target, TrendingUp, Users } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Plus, Edit } from 'lucide-react';

const statusColors: Record<string, string> = {
  novo: '#3b82f6',
  qualificado: '#22c55e',
  proposta: '#f59e0b',
  negociacao: '#8b5cf6',
  convertido: '#14b8a6',
  perdido: '#ef4444',
};

const statusLabels: Record<string, string> = {
  novo: 'Novo',
  qualificado: 'Qualificado',
  proposta: 'Proposta',
  negociacao: 'Negociação',
  convertido: 'Convertido',
  perdido: 'Perdido',
};

export function CIVLeads() {
  const leadsAtivos = leads.filter(l => !['convertido', 'perdido'].includes(l.status));
  const leadsConvertidos = leads.filter(l => l.status === 'convertido').length;
  const taxaConversao = ((leadsConvertidos / leads.length) * 100).toFixed(0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          title="Leads Ativos"
          value={leadsAtivos.length}
          subtitle="Em andamento"
          icon={<UserCheck className="h-5 w-5" />}
          trend="up"
          trendValue="+12"
          variant="civ"
        />
        <KPICard
          title="Taxa Conversão"
          value={`${taxaConversao}%`}
          subtitle="Lead → Venda"
          icon={<Target className="h-5 w-5" />}
          trend="up"
          trendValue="+5.2%"
          variant="civ"
        />
        <KPICard
          title="Valor Potencial"
          value={`R$ ${(leadsAtivos.reduce((acc, l) => acc + l.valorEstimado, 0) / 1000).toFixed(0)}k`}
          subtitle="Pipeline ativo"
          icon={<TrendingUp className="h-5 w-5" />}
          trend="up"
          trendValue="+18%"
          variant="civ"
        />
        <KPICard
          title="Novos/Mês"
          value="28"
          subtitle="Média mensal"
          icon={<Users className="h-5 w-5" />}
          trend="up"
          trendValue="+8"
          variant="civ"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ModuleCard title="Leads x Conversão" variant="civ">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={civChartData.origemLeads}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="origem" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }} />
                <Legend />
                <Bar dataKey="quantidade" fill="#4ade80" name="Leads" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="conversao" stroke="#22c55e" strokeWidth={2} name="Conversão %" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </ModuleCard>

        <ModuleCard title="Origem dos Leads" variant="civ">
          <div className="h-72 flex items-center">
            <div className="w-1/2">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie 
                    data={civChartData.origemLeads} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={50} 
                    outerRadius={80} 
                    paddingAngle={3} 
                    dataKey="quantidade"
                    nameKey="origem"
                  >
                    {civChartData.origemLeads.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={['#22c55e', '#3b82f6', '#f97316', '#8b5cf6', '#14b8a6'][index]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 space-y-2">
              {civChartData.origemLeads.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ['#22c55e', '#3b82f6', '#f97316', '#8b5cf6', '#14b8a6'][index] }} />
                    <span className="text-sm text-muted-foreground">{item.origem}</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{item.quantidade}</span>
                </div>
              ))}
            </div>
          </div>
        </ModuleCard>
      </div>

      {/* Tabela de Leads */}
      <ModuleCard title="Leads Ativos" variant="civ">
        <div className="flex justify-end mb-4 gap-2">
          <Button size="sm" className="bg-civ hover:bg-civ/90 gap-2">
            <Plus className="h-4 w-4" />
            Novo Lead
          </Button>
        </div>
        <div className="rounded-xl border border-border/30 max-h-[400px]">
          <ScrollArea className="h-full max-h-[400px]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-secondary/30 sticky top-0">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">ID</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Origem</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Canal</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Produto</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">Valor Est.</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">Status</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Responsável</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                  <td className="py-3 px-4 font-mono text-foreground">{lead.id}</td>
                  <td className="py-3 px-4 text-foreground">{lead.origem}</td>
                  <td className="py-3 px-4 text-muted-foreground">{lead.canal}</td>
                  <td className="py-3 px-4 text-foreground">{lead.produto}</td>
                  <td className="py-3 px-4 text-right text-foreground">R$ {lead.valorEstimado.toLocaleString('pt-BR')}</td>
                  <td className="py-3 px-4 text-center">
                    <Badge style={{ backgroundColor: statusColors[lead.status], color: '#fff' }}>
                      {statusLabels[lead.status]}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{lead.responsavel}</td>
                  <td className="py-3 px-4 text-center">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </ScrollArea>
        </div>
      </ModuleCard>
    </div>
  );
}
