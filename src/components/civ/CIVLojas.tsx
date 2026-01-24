import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { lojas } from '@/data/civData';
import { KPICard } from '@/components/ui/KPICard';
import { ModuleCard } from '@/components/ui/ModuleCard';
import { Badge } from '@/components/ui/badge';
import { Store, Users, TrendingUp, DollarSign } from 'lucide-react';

const tipoColors: Record<string, string> = {
  propria: '#22c55e',
  parceira: '#3b82f6',
  representante: '#f97316',
};

const tipoLabels: Record<string, string> = {
  propria: 'Própria',
  parceira: 'Parceira',
  representante: 'Representante',
};

export function CIVLojas() {
  const totalVendas = lojas.reduce((acc, l) => acc + l.vendasMes, 0);
  const ticketMedioGeral = lojas.reduce((acc, l) => acc + l.ticketMedio, 0) / lojas.length;
  const margemMedia = lojas.reduce((acc, l) => acc + l.margemMedia, 0) / lojas.length;

  const vendasPorLoja = lojas
    .sort((a, b) => b.vendasMes - a.vendasMes)
    .map(l => ({ nome: l.nome.substring(0, 15), vendas: l.vendasMes }));

  const vendasPorTipo = [
    { tipo: 'Própria', valor: lojas.filter(l => l.tipo === 'propria').reduce((acc, l) => acc + l.vendasMes, 0), color: '#22c55e' },
    { tipo: 'Parceira', valor: lojas.filter(l => l.tipo === 'parceira').reduce((acc, l) => acc + l.vendasMes, 0), color: '#3b82f6' },
    { tipo: 'Representante', valor: lojas.filter(l => l.tipo === 'representante').reduce((acc, l) => acc + l.vendasMes, 0), color: '#f97316' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          title="Total Lojas/Canais"
          value={lojas.length}
          subtitle="Ativos"
          icon={<Store className="h-5 w-5" />}
          variant="civ"
        />
        <KPICard
          title="Vendas Total"
          value={`R$ ${(totalVendas / 1000).toFixed(0)}k`}
          subtitle="Este mês"
          icon={<DollarSign className="h-5 w-5" />}
          trend="up"
          trendValue="+15%"
          variant="civ"
        />
        <KPICard
          title="Ticket Médio"
          value={`R$ ${ticketMedioGeral.toFixed(0)}`}
          subtitle="Por canal"
          icon={<TrendingUp className="h-5 w-5" />}
          trend="up"
          trendValue="+8%"
          variant="civ"
        />
        <KPICard
          title="Margem Média"
          value={`${margemMedia.toFixed(1)}%`}
          subtitle="Geral"
          icon={<Users className="h-5 w-5" />}
          variant="civ"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ModuleCard title="Faturamento por Loja" variant="civ">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vendasPorLoja} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={true} vertical={false} />
                <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="nome" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={{ stroke: '#333' }} width={120} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }} formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Vendas']} />
                <Bar dataKey="vendas" fill="#22c55e" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ModuleCard>

        <ModuleCard title="Performance por Canal" variant="civ">
          <div className="h-72 flex items-center">
            <div className="w-1/2">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie 
                    data={vendasPorTipo} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={50} 
                    outerRadius={80} 
                    paddingAngle={3} 
                    dataKey="valor"
                    nameKey="tipo"
                  >
                    {vendasPorTipo.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }} formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Vendas']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 space-y-3">
              {vendasPorTipo.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-muted-foreground">{item.tipo}</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">R$ {(item.valor / 1000).toFixed(0)}k</span>
                </div>
              ))}
            </div>
          </div>
        </ModuleCard>
      </div>

      {/* Tabela de Lojas */}
      <ModuleCard title="Lojas, Canais e Vendedores" variant="civ">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Loja/Canal</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">Tipo</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Região</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Vendedor</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">Vendas/Mês</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">Margem</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">Ticket</th>
              </tr>
            </thead>
            <tbody>
              {lojas.map((loja) => (
                <tr key={loja.id} className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                  <td className="py-3 px-4 text-foreground font-medium">{loja.nome}</td>
                  <td className="py-3 px-4 text-center">
                    <Badge style={{ backgroundColor: tipoColors[loja.tipo], color: '#fff' }}>
                      {tipoLabels[loja.tipo]}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{loja.regiao}</td>
                  <td className="py-3 px-4 text-foreground">{loja.vendedor}</td>
                  <td className="py-3 px-4 text-right text-foreground">R$ {loja.vendasMes.toLocaleString('pt-BR')}</td>
                  <td className="py-3 px-4 text-right text-civ font-semibold">{loja.margemMedia}%</td>
                  <td className="py-3 px-4 text-right text-muted-foreground">R$ {loja.ticketMedio.toLocaleString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ModuleCard>
    </div>
  );
}
