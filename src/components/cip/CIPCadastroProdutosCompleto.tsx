import { useState, useEffect } from 'react';
import { 
  Search, Filter, Plus, Edit, Trash2, Eye, Package, 
  Clock, DollarSign, Layers, Save, X, Loader2, Percent
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { KPICard } from '@/components/ui/KPICard';
import { ModuleCard } from '@/components/ui/ModuleCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ProdutoDB {
  id: string;
  nome: string;
  descricao: string | null;
  categoria: string;
  tempo_unitario: number;
  preco_base: number;
  percentual_juros: number;
  ativo: boolean;
  observacoes: string | null;
  unidade: string;
}

interface ProdutoForm {
  nome: string;
  descricao: string;
  categoria: string;
  tempo_unitario: number | '';
  preco_base: number | '';
  percentual_juros: number | '';
  ativo: boolean;
  observacoes: string;
  unidade: string;
}

const emptyForm = (): ProdutoForm => ({
  nome: '', descricao: '', categoria: 'sofa', tempo_unitario: '', preco_base: '', percentual_juros: 0, ativo: true, observacoes: '', unidade: 'un',
});

const categoriaConfig: Record<string, { label: string; color: string }> = {
  sofa: { label: 'Sofá', color: 'bg-orange-500/20 text-orange-400' },
  poltrona: { label: 'Poltrona', color: 'bg-purple-500/20 text-purple-400' },
  cadeira: { label: 'Cadeira', color: 'bg-blue-500/20 text-blue-400' },
  mesa: { label: 'Mesa', color: 'bg-green-500/20 text-green-400' },
  rack: { label: 'Rack', color: 'bg-cyan-500/20 text-cyan-400' },
  estante: { label: 'Estante', color: 'bg-pink-500/20 text-pink-400' },
};

export function CIPCadastroProdutosCompleto() {
  const [search, setSearch] = useState('');
  const [produtos, setProdutos] = useState<ProdutoDB[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('lista');
  const [form, setForm] = useState<ProdutoForm>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [detailProduct, setDetailProduct] = useState<ProdutoDB | null>(null);

  useEffect(() => { loadProdutos(); }, []);

  const loadProdutos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .order('nome');
    if (error) {
      toast.error('Erro ao carregar produtos');
    } else {
      setProdutos((data || []).map(d => ({ ...d, percentual_juros: Number((d as any).percentual_juros) || 0 })));
    }
    setLoading(false);
  };

  const filteredProdutos = produtos.filter(p =>
    p.nome.toLowerCase().includes(search.toLowerCase()) ||
    (p.descricao || '').toLowerCase().includes(search.toLowerCase()) ||
    p.categoria.toLowerCase().includes(search.toLowerCase())
  );

  const totalProdutos = produtos.length;
  const produtosAtivos = produtos.filter(p => p.ativo).length;
  const tempoMedio = produtos.length > 0 ? produtos.reduce((a, p) => a + Number(p.tempo_unitario), 0) / produtos.length : 0;
  const precoMedio = produtos.length > 0 ? produtos.reduce((a, p) => a + Number(p.preco_base), 0) / produtos.length : 0;

  const handleEdit = (p: ProdutoDB) => {
    setEditingId(p.id);
    setForm({
      nome: p.nome,
      descricao: p.descricao || '',
      categoria: p.categoria,
      tempo_unitario: Number(p.tempo_unitario),
      preco_base: Number(p.preco_base),
      percentual_juros: p.percentual_juros,
      ativo: p.ativo,
      observacoes: p.observacoes || '',
      unidade: p.unidade,
    });
    setActiveTab('novo');
  };

  const handleSave = async () => {
    if (!form.nome.trim()) { toast.error('Nome é obrigatório'); return; }
    if (!form.tempo_unitario || Number(form.tempo_unitario) <= 0) { toast.error('Tempo total (horas) é obrigatório e deve ser > 0'); return; }
    if (!form.preco_base || Number(form.preco_base) <= 0) { toast.error('Preço base é obrigatório e deve ser > 0'); return; }

    setSaving(true);
    const payload = {
      nome: form.nome.trim(),
      descricao: form.descricao.trim() || null,
      categoria: form.categoria,
      tempo_unitario: Number(form.tempo_unitario),
      preco_base: Number(form.preco_base),
      percentual_juros: Number(form.percentual_juros) || 0,
      ativo: form.ativo,
      observacoes: form.observacoes.trim() || null,
      unidade: form.unidade,
    };

    if (editingId) {
      const { error } = await supabase.from('produtos').update(payload as any).eq('id', editingId);
      if (error) { toast.error('Erro ao atualizar: ' + error.message); }
      else { toast.success('Produto atualizado!'); }
    } else {
      const { error } = await supabase.from('produtos').insert(payload as any);
      if (error) { toast.error('Erro ao criar: ' + error.message); }
      else { toast.success('Produto cadastrado!'); }
    }

    setSaving(false);
    setEditingId(null);
    setForm(emptyForm());
    setActiveTab('lista');
    await loadProdutos();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este produto?')) return;
    const { error } = await supabase.from('produtos').delete().eq('id', id);
    if (error) toast.error('Erro: ' + error.message);
    else { toast.success('Produto excluído'); await loadProdutos(); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="p-4 rounded-lg bg-cip/10 border border-cip/30">
        <div className="flex items-start gap-3">
          <Package className="h-6 w-6 text-cip flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-cip">Cadastro de Produtos (CIP)</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Produtos com <strong>tempo_total, preço_base e percentual_juros</strong> obrigatórios. Dados reais do banco.
            </p>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="Total Produtos" value={totalProdutos} subtitle="Cadastrados" icon={<Package className="h-5 w-5" />} variant="cip" />
        <KPICard title="Ativos" value={produtosAtivos} subtitle={`${totalProdutos > 0 ? ((produtosAtivos/totalProdutos)*100).toFixed(0) : 0}%`} icon={<Layers className="h-5 w-5" />} variant="cip" />
        <KPICard title="Tempo Médio" value={`${tempoMedio.toFixed(1)}h`} subtitle="RTC médio" icon={<Clock className="h-5 w-5" />} variant="cip" />
        <KPICard title="Preço Médio" value={`R$ ${precoMedio.toFixed(0)}`} subtitle="Base" icon={<DollarSign className="h-5 w-5" />} variant="cip" />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <TabsList>
            <TabsTrigger value="lista">Lista de Produtos</TabsTrigger>
            <TabsTrigger value="novo">{editingId ? 'Editar Produto' : 'Novo Produto'}</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar produto..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
          </div>
        </div>

        {/* Lista */}
        <TabsContent value="lista" className="space-y-4">
          <div className="rounded-xl border border-border/30 bg-card/80 overflow-hidden max-h-[500px]">
            <ScrollArea className="h-full max-h-[500px]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 bg-secondary/30">
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Nome</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium hidden md:table-cell">Descrição</th>
                    <th className="text-center py-3 px-4 text-muted-foreground font-medium">Categoria</th>
                    <th className="text-center py-3 px-4 text-muted-foreground font-medium">Tempo (h)</th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium">Preço Base</th>
                    <th className="text-center py-3 px-4 text-muted-foreground font-medium hidden lg:table-cell">Juros %</th>
                    <th className="text-center py-3 px-4 text-muted-foreground font-medium">Status</th>
                    <th className="text-center py-3 px-4 text-muted-foreground font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={8} className="py-8 text-center text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin inline mr-2" />Carregando...</td></tr>
                  ) : filteredProdutos.length === 0 ? (
                    <tr><td colSpan={8} className="py-8 text-center text-muted-foreground">Nenhum produto encontrado</td></tr>
                  ) : filteredProdutos.map((p) => {
                    const cat = categoriaConfig[p.categoria] || { label: p.categoria, color: 'bg-secondary text-foreground' };
                    return (
                      <tr key={p.id} className={cn("border-b border-border/30 hover:bg-secondary/30 transition-colors", !p.ativo && "opacity-50")}>
                        <td className="py-3 px-4 font-semibold text-foreground">{p.nome}</td>
                        <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">{p.descricao || '—'}</td>
                        <td className="py-3 px-4 text-center"><Badge className={cat.color}>{cat.label}</Badge></td>
                        <td className="py-3 px-4 text-center font-mono">{Number(p.tempo_unitario).toFixed(2)}</td>
                        <td className="py-3 px-4 text-right">R$ {Number(p.preco_base).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className="py-3 px-4 text-center hidden lg:table-cell">{p.percentual_juros}%</td>
                        <td className="py-3 px-4 text-center">
                          <Badge className={p.ativo ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>{p.ativo ? 'Ativo' : 'Inativo'}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDetailProduct(p)}><Eye className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(p)}><Edit className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </ScrollArea>
          </div>
        </TabsContent>

        {/* Novo / Editar */}
        <TabsContent value="novo" className="space-y-4">
          <ModuleCard title={editingId ? 'Editar Produto' : 'Cadastrar Novo Produto'} variant="cip">
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-3">INFORMAÇÕES BÁSICAS</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Nome *</label>
                    <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Sofá Ancora 2L" className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Categoria</label>
                    <select className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
                      {Object.entries(categoriaConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Unidade</label>
                    <Input value={form.unidade} onChange={(e) => setForm({ ...form, unidade: e.target.value })} className="mt-1" />
                  </div>
                  <div className="md:col-span-2 lg:col-span-3">
                    <label className="text-sm text-muted-foreground">Descrição</label>
                    <Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Descrição do produto" className="mt-1" />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-3">DADOS INDUSTRIAIS E COMERCIAIS</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Tempo Total (horas) * <span className="text-cip font-bold">RTC</span></label>
                    <Input type="number" step="0.01" min="0.01" value={form.tempo_unitario} onChange={(e) => setForm({ ...form, tempo_unitario: e.target.value === '' ? '' : Number(e.target.value) })} placeholder="Ex: 4.80" className="mt-1" />
                    <p className="text-[10px] text-muted-foreground mt-1">Horas oficiais de produção do produto</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Preço Base (R$) *</label>
                    <Input type="number" step="0.01" min="0.01" value={form.preco_base} onChange={(e) => setForm({ ...form, preco_base: e.target.value === '' ? '' : Number(e.target.value) })} placeholder="Ex: 1200.00" className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Percentual de Juros (%)</label>
                    <Input type="number" step="0.01" min="0" value={form.percentual_juros} onChange={(e) => setForm({ ...form, percentual_juros: e.target.value === '' ? '' : Number(e.target.value) })} placeholder="Ex: 5" className="mt-1" />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Switch checked={form.ativo} onCheckedChange={(v) => setForm({ ...form, ativo: v })} />
                <label className="text-sm text-muted-foreground">Produto Ativo</label>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-3">OBSERVAÇÕES</h4>
                <Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} placeholder="Observações para produtos especiais, personalizações, restrições..." className="min-h-[80px]" />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <Button variant="outline" onClick={() => { setActiveTab('lista'); setEditingId(null); setForm(emptyForm()); }}>
                  <X className="h-4 w-4 mr-2" />Cancelar
                </Button>
                <Button className="bg-cip hover:bg-cip/90" onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  {editingId ? 'Atualizar Produto' : 'Salvar Produto'}
                </Button>
              </div>
            </div>
          </ModuleCard>
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={!!detailProduct} onOpenChange={() => setDetailProduct(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{detailProduct?.nome}</DialogTitle>
          </DialogHeader>
          {detailProduct && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{detailProduct.descricao || 'Sem descrição'}</p>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 rounded-lg bg-cip/10 text-center">
                  <p className="text-xs text-muted-foreground">Tempo Total</p>
                  <p className="text-xl font-bold text-cip">{Number(detailProduct.tempo_unitario).toFixed(2)}h</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50 text-center">
                  <p className="text-xs text-muted-foreground">Preço Base</p>
                  <p className="text-xl font-bold">R$ {Number(detailProduct.preco_base).toFixed(2)}</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50 text-center">
                  <p className="text-xs text-muted-foreground">Juros</p>
                  <p className="text-xl font-bold">{detailProduct.percentual_juros}%</p>
                </div>
              </div>
              {detailProduct.observacoes && (
                <div>
                  <p className="text-xs text-muted-foreground">Observações</p>
                  <p className="text-sm">{detailProduct.observacoes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
