import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { clientes, civChartData } from '@/data/civData';
import { KPICard } from '@/components/ui/KPICard';
import { ModuleCard } from '@/components/ui/ModuleCard';
import { Badge } from '@/components/ui/badge';
import { Users, DollarSign, TrendingUp, Target } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Plus, Edit } from 'lucide-react';

const classificacaoColors: Record<string, string> = {
  A: '#22c55e',
  B: '#f59e0b',
  C: '#6b7280',
};

const COLORS = ['#22c55e', '#3b82f6', '#f97316', '#8b5cf6', '#14b8a6'];

export function CIVClientes() {
  const totalClientes = clientes.length;
  const clientesA = clientes.filter(c => c.classificacao === 'A').length;
  const ticketMedioGeral = clientes.reduce((acc, c) => acc + c.ticketMedio, 0) / clientes.length;
  const comprasTotal = clientes.reduce((acc, c) => acc + c.comprasTotal, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          title="Clientes Ativos"
          value={totalClientes}
          subtitle="Na base"
          icon={<Users className="h-5 w-5" />}
          variant="civ"
        />
        <KPICard
          title="Clientes A"
          value={clientesA}
          subtitle="Top performers"
          icon={<Target className="h-5 w-5" />}
          trend="up"
          trendValue="+2"
          variant="civ"
        />
        <KPICard
          title="Ticket Médio"
          value={`R$ ${(ticketMedioGeral / 1000).toFixed(1)}k`}
          subtitle="Por cliente"
          icon={<TrendingUp className="h-5 w-5" />}
          trend="up"
          trendValue="+12%"
          variant="civ"
        />
        <KPICard
          title="Volume Total"
          value={`R$ ${(comprasTotal / 1000000).toFixed(1)}M`}
          subtitle="Histórico"
          icon={<DollarSign className="h-5 w-5" />}
          variant="civ"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ModuleCard title="Vendas por Cliente (Top 5)" variant="civ">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={civChartData.vendasPorCliente} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={true} vertical={false} />
                <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="cliente" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={{ stroke: '#333' }} width={120} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }} formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Compras']} />
                <Bar dataKey="valor" radius={[0, 4, 4, 0]} barSize={18}>
                  {civChartData.vendasPorCliente.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ModuleCard>

        <ModuleCard title="Curva ABC" variant="civ">
          <div className="h-72 flex items-center">
            <div className="w-1/2">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie 
                    data={civChartData.curvaABC} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={50} 
                    outerRadius={80} 
                    paddingAngle={3} 
                    dataKey="percentual"
                    nameKey="classe"
                  >
                    {civChartData.curvaABC.map((entry) => (
                      <Cell key={entry.classe} fill={classificacaoColors[entry.classe]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }} formatter={(value: number) => [`${value}%`, 'Faturamento']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 space-y-4">
              {civChartData.curvaABC.map((item) => (
                <div key={item.classe} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: classificacaoColors[item.classe] }}
                    >
                      {item.classe}
                    </div>
                    <div>
                      <p className="text-foreground font-medium">{item.clientes} clientes</p>
                      <p className="text-xs text-muted-foreground">{item.percentual}% do faturamento</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ModuleCard>
      </div>

      {/* Tabela de Clientes */}
      <ModuleCard title="Clientes & Relacionamento" variant="civ">
        <div className="flex justify-end mb-4 gap-2">
          <Button size="sm" className="bg-civ hover:bg-civ/90 gap-2">
            <Plus className="h-4 w-4" />
            Novo Cliente
          </Button>
        </div>
        <div className="rounded-xl border border-border/30 max-h-[400px]">
          <ScrollArea className="h-full max-h-[400px]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-secondary/30 sticky top-0">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Cliente</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">Tipo</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Cidade/UF</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">Compras Total</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">Ticket Médio</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">Última Compra</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">Classe</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((cliente) => (
                <tr key={cliente.id} className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                  <td className="py-3 px-4 text-foreground font-medium">{cliente.nome}</td>
                  <td className="py-3 px-4 text-center">
                    <Badge variant="outline">{cliente.tipo}</Badge>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{cliente.cidade}/{cliente.estado}</td>
                  <td className="py-3 px-4 text-right text-foreground">R$ {cliente.comprasTotal.toLocaleString('pt-BR')}</td>
                  <td className="py-3 px-4 text-right text-muted-foreground">R$ {cliente.ticketMedio.toLocaleString('pt-BR')}</td>
                  <td className="py-3 px-4 text-center text-muted-foreground">{new Date(cliente.ultimaCompra).toLocaleDateString('pt-BR')}</td>
                  <td className="py-3 px-4 text-center">
                    <Badge style={{ backgroundColor: classificacaoColors[cliente.classificacao], color: '#fff' }}>
                      {cliente.classificacao}
                    </Badge>
                  </td>
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
