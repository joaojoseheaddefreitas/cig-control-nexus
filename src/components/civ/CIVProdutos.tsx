import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { KPICard } from '@/components/ui/KPICard';
import { ModuleCard } from '@/components/ui/ModuleCard';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Package, TrendingUp, DollarSign, Award, Loader2 } from 'lucide-react';

interface ProdutoDB {
  id: string;
  codigo: string | null;
  nome: string;
  categoria: string;
  modelo: string | null;
  linha: string | null;
  preco_base: number;
  tempo_unitario: number;
  percentual_juros: number;
  ativo: boolean;
}

export function CIVProdutos() {
  const [produtos, setProdutos] = useState<ProdutoDB[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase.from('produtos').select('*').eq('ativo', true).order('nome');
      setProdutos(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = produtos.filter(p =>
    p.nome.toLowerCase().includes(search.toLowerCase()) ||
    (p.codigo || '').toLowerCase().includes(search.toLowerCase()) ||
    p.categoria.toLowerCase().includes(search.toLowerCase())
  );

  const maisCaroNome = produtos.length > 0 ? [...produtos].sort((a, b) => b.preco_base - a.preco_base)[0]?.nome.substring(0, 18) : '—';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="Total Produtos" value={produtos.length} subtitle="Ativos" icon={<Package className="h-5 w-5" />} variant="civ" />
        <KPICard title="Categorias" value={new Set(produtos.map(p => p.categoria)).size} subtitle="Distintas" icon={<Award className="h-5 w-5" />} variant="civ" />
        <KPICard title="Maior Preço" value={maisCaroNome} subtitle="Produto" icon={<TrendingUp className="h-5 w-5" />} variant="civ" />
        <KPICard title="Preço Médio" value={`R$ ${produtos.length > 0 ? (produtos.reduce((s, p) => s + p.preco_base, 0) / produtos.length).toFixed(0) : 0}`} subtitle="Base" icon={<DollarSign className="h-5 w-5" />} variant="civ" />
      </div>

      <ModuleCard title="Produtos & Mix de Vendas" variant="civ">
        <div className="mb-4">
          <Input placeholder="Buscar por nome, código ou categoria..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /> Carregando...</div>
        ) : (
          <ScrollArea className="max-h-[600px]">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 sticky top-0 bg-secondary/80 backdrop-blur-sm z-10">
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Código</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Produto</th>
                    <th className="text-center py-3 px-4 text-muted-foreground font-medium">Categoria</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium hidden md:table-cell">Modelo</th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium">Preço Base</th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium">RTC (h)</th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium hidden lg:table-cell">Juros %</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">
                      {produtos.length === 0 ? 'Sem dados cadastrados – insira dados para iniciar o monitoramento.' : 'Nenhum produto encontrado.'}
                    </td></tr>
                  ) : filtered.map(p => (
                    <tr key={p.id} className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                      <td className="py-3 px-4 font-mono text-foreground">{p.codigo || '—'}</td>
                      <td className="py-3 px-4 text-foreground font-medium">{p.nome}</td>
                      <td className="py-3 px-4 text-center"><Badge variant="outline">{p.categoria}</Badge></td>
                      <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">{p.modelo || '—'}</td>
                      <td className="py-3 px-4 text-right text-foreground">R$ {p.preco_base.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right text-civ font-semibold">{p.tempo_unitario}h</td>
                      <td className="py-3 px-4 text-right text-muted-foreground hidden lg:table-cell">{p.percentual_juros}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ScrollArea>
        )}
      </ModuleCard>
    </div>
  );
}
