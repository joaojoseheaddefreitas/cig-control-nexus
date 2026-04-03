import { cn } from '@/lib/utils';
import { Search, Filter, Plus, Edit, Trash2, Eye, Package, Database, Truck, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { BOMEditor } from './BOMEditor';

type Produto = Tables<'produtos'>;
type BomProduto = Tables<'bom_produto'>;
type Material = Tables<'materiais'>;
type Fornecedor = Tables<'fornecedores'>;

const statusConfig = {
  ativo: { label: 'Ativo', color: 'bg-success/20 text-success border-success/30' },
  inativo: { label: 'Inativo', color: 'bg-warning/20 text-warning border-warning/30' },
  descontinuado: { label: 'Descontinuado', color: 'bg-destructive/20 text-destructive border-destructive/30' },
};

export function CIPCadastroProdutos() {
  const [search, setSearch] = useState('');
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [bomItems, setBomItems] = useState<(BomProduto & { material?: Material })[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduto, setEditingProduto] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Produto>>({});

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [prodRes, bomRes, matRes, fornRes] = await Promise.all([
        supabase.from('produtos').select('*'),
        supabase.from('bom_produto').select('*'),
        supabase.from('materiais').select('*'),
        supabase.from('fornecedores').select('*'),
      ]);

      setProdutos(prodRes.data || []);
      setFornecedores(fornRes.data || []);

      // Enrich BOM with material info
      const materiais = matRes.data || [];
      const enrichedBom = (bomRes.data || []).map(b => ({
        ...b,
        material: materiais.find(m => m.id === b.material_id),
      }));
      setBomItems(enrichedBom);

      setLoading(false);
    };
    loadData();
  }, []);

  const updateProduto = async (produto: Produto) => {
    const { error } = await supabase
      .from('produtos')
      .update({
        nome: produto.nome,
        preco_base: produto.preco_base,
        percentual_juros: produto.percentual_juros,
        tempo_unitario: produto.tempo_unitario,
      })
      .eq('id', produto.id);
    if (!error) {
      setProdutos(prev => prev.map(p => p.id === produto.id ? produto : p));
      setEditingProduto(null);
    }
  };

  const filteredProdutos = produtos.filter(p =>
    (p.codigo || '').toLowerCase().includes(search.toLowerCase()) ||
    p.nome.toLowerCase().includes(search.toLowerCase())
  );

  const getBomByProduto = (produtoId: string) => {
    return bomItems.filter(b => b.produto_id === produtoId);
  };

  if (loading) {
    return <div className="p-8 text-center">Carregando dados...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código ou nome do produto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          <Button size="sm" className="bg-cip hover:bg-cip/90">
            <Plus className="h-4 w-4 mr-2" />
            Novo Produto
          </Button>
        </div>
      </div>

      {/* Table for Desktop */}
      <div className="hidden lg:block rounded-xl border border-border/30 bg-card/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-secondary/30">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Código</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Nome</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">Preço Base</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">Tempo (h)</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">Materiais (BOM)</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">Status</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredProdutos.map((produto) => {
                const bom = getBomByProduto(produto.id);

                return (
                  <tr key={produto.id} className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                    <td className="py-3 px-4 font-medium text-foreground">{produto.codigo || '-'}</td>
                    <td className="py-3 px-4 text-foreground">{produto.nome}</td>
                    <td className="py-3 px-4 text-center">
                      <span>R$ {Number(produto.preco_base).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </td>
                    <td className="py-3 px-4 text-center">{Number(produto.tempo_unitario).toFixed(1)}h</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        {bom.slice(0, 3).map((b) => (
                          <Badge key={b.id} variant="outline" className="text-xs">
                            {b.material?.nome || 'Material'}: {Number(b.quantidade_por_unidade).toFixed(3)} {b.unidade}
                          </Badge>
                        ))}
                        {bom.length > 3 && (
                          <Badge variant="outline" className="text-xs">+{bom.length - 3} mais</Badge>
                        )}
                        {bom.length === 0 && (
                          <span className="text-xs text-muted-foreground">Sem BOM</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge className={cn('text-xs', produto.ativo ? statusConfig.ativo.color : statusConfig.inativo.color)}>
                        {produto.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setEditForm(produto);
                            setEditingProduto(produto.id);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Edição de Produto */}
      {editingProduto && (() => {
        const produto = produtos.find(p => p.id === editingProduto);
        const bom = getBomByProduto(editingProduto);
        if (!produto) return null;

        const handleSave = async () => {
          await updateProduto({ ...produto, ...editForm } as Produto);
        };

        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto p-6">
              <h2 className="text-xl font-bold mb-4">Editar Produto: {produto.codigo || '-'} - {produto.nome}</h2>

              <Tabs defaultValue="dados" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="dados">Dados do Produto</TabsTrigger>
                  <TabsTrigger value="tempos">Tempos por Setor</TabsTrigger>
                  <TabsTrigger value="bom">Insumos / BOM</TabsTrigger>
                </TabsList>

                <TabsContent value="dados" className="mt-4">
                  <div className="space-y-4 max-w-md">
                    <div>
                      <label className="text-sm font-medium">Nome</label>
                      <Input
                        value={editForm.nome || produto.nome}
                        onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Preço Base (R$)</label>
                        <Input
                          type="number"
                          step="0.01"
                          value={editForm.preco_base ?? produto.preco_base}
                          onChange={(e) => setEditForm({ ...editForm, preco_base: parseFloat(e.target.value) || 0 })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Juros (%)</label>
                        <Input
                          type="number"
                          step="0.01"
                          value={editForm.percentual_juros ?? produto.percentual_juros}
                          onChange={(e) => setEditForm({ ...editForm, percentual_juros: parseFloat(e.target.value) || 0 })}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Tempo Unitário (h)</label>
                      <Input
                        type="number"
                        step="0.1"
                        value={editForm.tempo_unitario ?? produto.tempo_unitario}
                        onChange={(e) => setEditForm({ ...editForm, tempo_unitario: parseFloat(e.target.value) || 0 })}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button onClick={handleSave} className="bg-cip hover:bg-cip/90">Salvar</Button>
                      <Button variant="outline" onClick={() => setEditingProduto(null)}>Cancelar</Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="tempos" className="mt-4">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Tempos por Setor
                    </h3>
                    {bom.length === 0 ? (
                      <p className="text-muted-foreground text-sm">Configuração de tempos setoriais disponível na aba de Setores do CIP.</p>
                    ) : (
                      <p className="text-muted-foreground text-sm">Configuração de tempos setoriais disponível na aba de Setores do CIP.</p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="bom" className="mt-4">
                  <BOMEditor produtoId={produto.id} produtoNome={produto.nome} />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        );
      })()}

      {/* Cards Grid for Mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-4">
        {filteredProdutos.map((produto) => {
          const bom = getBomByProduto(produto.id);
          return (
            <div key={produto.id} className="rounded-xl border border-border/30 bg-card/80 p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-cip" />
                  <span className="text-xs text-muted-foreground">{produto.codigo || '-'}</span>
                </div>
                <Badge className={cn('text-xs', produto.ativo ? statusConfig.ativo.color : statusConfig.inativo.color)}>
                  {produto.ativo ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
              <h3 className="font-medium text-foreground text-sm mb-2">{produto.nome}</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Preço:</span>
                  <span className="ml-1 text-foreground">R$ {Number(produto.preco_base).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Tempo:</span>
                  <span className="ml-1 text-foreground">{Number(produto.tempo_unitario).toFixed(1)}h</span>
                </div>
                <div>
                  <span className="text-muted-foreground">BOM:</span>
                  <span className="ml-1 text-foreground">{bom.length} materiais</span>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setEditForm(produto);
                    setEditingProduto(produto.id);
                  }}
                >
                  <Edit className="h-4 w-4 mr-1" /> Editar
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border/30 bg-card/80 p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{produtos.length}</p>
          <p className="text-xs text-muted-foreground">Total Produtos</p>
        </div>
        <div className="rounded-xl border border-success/30 bg-success/10 p-4 text-center">
          <p className="text-2xl font-bold text-success">{produtos.filter(p => p.ativo).length}</p>
          <p className="text-xs text-muted-foreground">Ativos</p>
        </div>
        <div className="rounded-xl border border-warning/30 bg-warning/10 p-4 text-center">
          <p className="text-2xl font-bold text-warning">{new Set(bomItems.map(b => b.produto_id)).size}</p>
          <p className="text-xs text-muted-foreground">Com BOM</p>
        </div>
        <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 text-center">
          <p className="text-2xl font-bold text-primary">{fornecedores.length}</p>
          <p className="text-xs text-muted-foreground">Fornecedores</p>
        </div>
      </div>
    </div>
  );
}
