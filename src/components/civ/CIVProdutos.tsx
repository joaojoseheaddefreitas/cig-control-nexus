import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from 'recharts';
import { produtosVenda } from '@/data/civData';
import { KPICard } from '@/components/ui/KPICard';
import { ModuleCard } from '@/components/ui/ModuleCard';
import { Badge } from '@/components/ui/badge';
import { Package, TrendingUp, DollarSign, Award } from 'lucide-react';

const COLORS = ['#22c55e', '#4ade80', '#86efac', '#3b82f6', '#60a5fa'];

export function CIVProdutos() {
  const totalProdutos = produtosVenda.length;
  const maisVendido = produtosVenda.sort((a, b) => b.vendasMes - a.vendasMes)[0];
  const maisRentavel = produtosVenda.sort((a, b) => b.margem - a.margem)[0];
  const vendasTotalMes = produtosVenda.reduce((acc, p) => acc + p.vendasMes, 0);

  const vendasPorProduto = produtosVenda
    .sort((a, b) => b.vendasMes - a.vendasMes)
    .slice(0, 8)
    .map(p => ({ nome: p.nome.substring(0, 20), vendas: p.vendasMes }));

  const margemPorProduto = produtosVenda
    .sort((a, b) => b.margem - a.margem)
    .slice(0, 8)
    .map(p => ({ nome: p.nome.substring(0, 15), margem: p.margem, vendas: p.vendasMes }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          title="Total Produtos"
          value={totalProdutos}
          subtitle="Ativos"
          icon={<Package className="h-5 w-5" />}
          variant="civ"
        />
        <KPICard
          title="Mais Vendido"
          value={maisVendido.nome.substring(0, 15)}
          subtitle={`${maisVendido.vendasMes} un/mês`}
          icon={<Award className="h-5 w-5" />}
          variant="civ"
        />
        <KPICard
          title="Mais Rentável"
          value={maisRentavel.nome.substring(0, 15)}
          subtitle={`Margem ${maisRentavel.margem}%`}
          icon={<TrendingUp className="h-5 w-5" />}
          variant="civ"
        />
        <KPICard
          title="Vendas/Mês"
          value={vendasTotalMes.toLocaleString('pt-BR')}
          subtitle="Unidades"
          icon={<DollarSign className="h-5 w-5" />}
          trend="up"
          trendValue="+18%"
          variant="civ"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ModuleCard title="Vendas por Produto" variant="civ">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vendasPorProduto} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={true} vertical={false} />
                <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} />
                <YAxis type="category" dataKey="nome" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={{ stroke: '#333' }} width={130} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }} />
                <Bar dataKey="vendas" fill="#22c55e" radius={[0, 4, 4, 0]} barSize={16} name="Vendas" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ModuleCard>

        <ModuleCard title="Margem por Produto" variant="civ">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={margemPorProduto}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="nome" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={{ stroke: '#333' }} angle={-45} textAnchor="end" height={60} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} tickFormatter={(v) => `${v}%`} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }} formatter={(value: number) => [`${value}%`, 'Margem']} />
                <Bar dataKey="margem" fill="#4ade80" radius={[4, 4, 0, 0]} name="Margem %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ModuleCard>
      </div>

      {/* Tabela de Produtos */}
      <ModuleCard title="Produtos & Mix de Vendas" variant="civ">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Código</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Produto</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">Categoria</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">Preço Base</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">Vendas/Mês</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">Margem</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">Ranking</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">Estoque</th>
              </tr>
            </thead>
            <tbody>
              {produtosVenda.sort((a, b) => a.ranking - b.ranking).map((produto) => (
                <tr key={produto.codigo} className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                  <td className="py-3 px-4 font-mono text-foreground">{produto.codigo}</td>
                  <td className="py-3 px-4 text-foreground font-medium">{produto.nome}</td>
                  <td className="py-3 px-4 text-center">
                    <Badge variant="outline">{produto.categoria}</Badge>
                  </td>
                  <td className="py-3 px-4 text-right text-foreground">R$ {produto.precoBase.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right text-foreground font-semibold">{produto.vendasMes}</td>
                  <td className="py-3 px-4 text-right text-civ font-semibold">{produto.margem}%</td>
                  <td className="py-3 px-4 text-center">
                    <Badge 
                      style={{ 
                        backgroundColor: produto.ranking <= 3 ? '#22c55e' : produto.ranking <= 5 ? '#f59e0b' : '#6b7280',
                        color: '#fff'
                      }}
                    >
                      #{produto.ranking}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right text-muted-foreground">{produto.estoque}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ModuleCard>
    </div>
  );
}
