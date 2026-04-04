import { useState, useEffect, useMemo } from 'react';
import { 
  Search, Plus, Edit, Trash2, Eye, Package, 
  Clock, DollarSign, Layers, Save, X, Loader2, AlertCircle
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

interface SetorProdutivo {
  id: string;
  nome: string;
  ordem: number;
  eficiencia: number;
}

interface SetorTempo {
  setor_id: string;
  tempo_horas: number;
}

interface ProdutoDB {
  id: string;
  nome: string;
  codigo: string | null;
  modelo: string | null;
  linha: string | null;
  descricao: string | null;
  categoria: string;
  tempo_unitario: number;
  preco_base: number;
  percentual_juros: number;
  ativo: boolean;
  observacoes: string | null;
  unidade: string;
  created_at: string;
}

interface ProdutoForm {
  codigo: string;
  modelo: string;
  linha: string;
  nome: string;
  descricao: string;
  categoria: string;
  preco_base: number | '';
  percentual_juros: number | '';
  ativo: boolean;
  observacoes: string;
  unidade: string;
  setorTempos: Record<string, number>;
}

const emptyForm = (): ProdutoForm => ({
  codigo: '', modelo: '', linha: '', nome: '', descricao: '', categoria: 'sofa',
  preco_base: '', percentual_juros: 0, ativo: true, observacoes: '', unidade: 'un',
  setorTempos: {},
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
  const [setores, setSetores] = useState<SetorProdutivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('lista');
  const [form, setForm] = useState<ProdutoForm>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [detailProduct, setDetailProduct] = useState<ProdutoDB | null>(null);
  const [detailSetorTempos, setDetailSetorTempos] = useState<SetorTempo[]>([]);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    const [prodRes, setorRes] = await Promise.all([
      supabase.from('produtos').select('*').order('created_at', { ascending: false }),
      supabase.from('setores_produtivos').select('id, nome, ordem, eficiencia').eq('ativo', true).order('ordem'),
    ]);
    if (prodRes.data) setProdutos(prodRes.data.map((d: any) => ({ ...d, percentual_juros: Number(d.percentual_juros) || 0 })));
    if (setorRes.data) setSetores(setorRes.data.map((s: any) => ({ ...s, eficiencia: Number(s.eficiencia) || 0.85 })));
    setLoading(false);
  };

  const filteredProdutos = produtos.filter(p =>
    (p.codigo || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.modelo || '').toLowerCase().includes(search.toLowerCase()) ||
    p.nome.toLowerCase().includes(search.toLowerCase()) ||
    p.categoria.toLowerCase().includes(search.toLowerCase())
  );

  const totalProdutos = produtos.length;
  const produtosAtivos = produtos.filter(p => p.ativo).length;
  const tempoMedio = produtos.length > 0 ? produtos.reduce((a, p) => a + Number(p.tempo_unitario), 0) / produtos.length : 0;
  const precoMedio = produtos.length > 0 ? produtos.reduce((a, p) => a + Number(p.preco_base), 0) / produtos.length : 0;

  // RTC = Σ(Horas × Eficiência do Setor)
  const rtcCalc = setores.reduce((sum, setor) => {
    const horas = Number(form.setorTempos[setor.id]) || 0;
    return sum + (horas * setor.eficiencia);
  }, 0);

  const handleEdit = async (p: ProdutoDB) => {
    setEditingId(p.id);
    // Load sector times
    const { data: temposDB } = await supabase
      .from('produto_setor_tempos')
      .select('setor_id, tempo_horas')
      .eq('produto_id', p.id);
    const temposMap: Record<string, number> = {};
    (temposDB || []).forEach((t: any) => { temposMap[t.setor_id] = Number(t.tempo_horas); });

    setForm({
      codigo: p.codigo || '',
      modelo: p.modelo || '',
      linha: p.linha || '',
      nome: p.nome,
      descricao: p.descricao || '',
      categoria: p.categoria,
      preco_base: Number(p.preco_base),
      percentual_juros: Number(p.percentual_juros),
      ativo: p.ativo,
      observacoes: p.observacoes || '',
      unidade: p.unidade,
      setorTempos: temposMap,
    });
    setActiveTab('novo');
  };

  const handleSave = async () => {
    if (!form.codigo.trim()) { toast.error('Código é obrigatório'); return; }
    if (!form.modelo.trim()) { toast.error('Modelo é obrigatório'); return; }
    if (!form.linha.trim()) { toast.error('Linha é obrigatória'); return; }
    if (rtcCalc <= 0) { toast.error('Insira tempo em pelo menos um setor (RTC > 0)'); return; }
    if (!form.preco_base || Number(form.preco_base) <= 0) { toast.error('Preço base é obrigatório e deve ser > 0'); return; }

    setSaving(true);
    const payload = {
      codigo: form.codigo.trim(),
      modelo: form.modelo.trim(),
      linha: form.linha.trim(),
      nome: `${form.modelo.trim()} - ${form.linha.trim()}`,
      descricao: form.descricao.trim() || null,
      categoria: form.categoria,
      tempo_unitario: rtcCalc,
      preco_base: Number(form.preco_base),
      percentual_juros: Number(form.percentual_juros) || 0,
      ativo: form.ativo,
      observacoes: form.observacoes.trim() || null,
      unidade: form.unidade,
    };

    let produtoId = editingId;

    if (editingId) {
      const { error } = await supabase.from('produtos').update(payload as any).eq('id', editingId);
      if (error) { toast.error('Erro ao atualizar: ' + error.message); setSaving(false); return; }
    } else {
      const { data, error } = await supabase.from('produtos').insert(payload as any).select('id').single();
      if (error) { toast.error('Erro ao criar: ' + error.message); setSaving(false); return; }
      produtoId = data.id;
    }

    // Save sector times
    if (produtoId) {
      // Delete existing
      await supabase.from('produto_setor_tempos').delete().eq('produto_id', produtoId);
      // Insert new
      const rows = Object.entries(form.setorTempos)
        .filter(([, v]) => Number(v) > 0)
        .map(([setor_id, tempo_horas]) => ({
          produto_id: produtoId!,
          setor_id,
          tempo_horas: Number(tempo_horas),
        }));
      if (rows.length > 0) {
        const { error } = await supabase.from('produto_setor_tempos').insert(rows);
        if (error) { toast.error('Erro ao salvar tempos: ' + error.message); }
      }
    }

    toast.success(editingId ? 'Produto atualizado!' : 'Produto cadastrado!');
    setSaving(false);
    setEditingId(null);
    setForm(emptyForm());
    setActiveTab('lista');
    await loadAll();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este produto?')) return;
    const { error } = await supabase.from('produtos').delete().eq('id', id);
    if (error) toast.error('Erro: ' + error.message);
    else { toast.success('Produto excluído'); await loadAll(); }
  };

  const handleViewDetail = async (p: ProdutoDB) => {
    setDetailProduct(p);
    const { data } = await supabase.from('produto_setor_tempos').select('setor_id, tempo_horas').eq('produto_id', p.id);
    setDetailSetorTempos((data || []).map((d: any) => ({ setor_id: d.setor_id, tempo_horas: Number(d.tempo_horas) })));
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
              Estrutura industrial com tempos por setor. RTC = soma automática dos tempos.
            </p>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="Total Produtos" value={totalProdutos} subtitle="Cadastrados" icon={<Package className="h-5 w-5" />} variant="cip" />
        <KPICard title="Ativos" value={produtosAtivos} subtitle={`${totalProdutos > 0 ? ((produtosAtivos/totalProdutos)*100).toFixed(0) : 0}%`} icon={<Layers className="h-5 w-5" />} variant="cip" />
        <KPICard title="RTC Médio" value={`${tempoMedio.toFixed(1)}h`} subtitle="Tempo médio" icon={<Clock className="h-5 w-5" />} variant="cip" />
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
              <Input placeholder="Buscar código, modelo, tipo..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Button size="sm" className="bg-cip hover:bg-cip/90" onClick={() => { setEditingId(null); setForm(emptyForm()); setActiveTab('novo'); }}>
              <Plus className="h-4 w-4 mr-1" /> Novo
            </Button>
          </div>
        </div>

        {/* Lista */}
        <TabsContent value="lista" className="space-y-4">
          <div className="rounded-xl border border-border/30 bg-card/80 overflow-hidden">
            <ScrollArea className="h-[600px]">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-secondary/80 backdrop-blur-sm">
                  <tr className="border-b border-border/50">
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Código</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Modelo</th>
                    <th className="text-center py-3 px-4 text-muted-foreground font-medium">Tipo</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium hidden md:table-cell">Linha</th>
                    <th className="text-center py-3 px-4 text-muted-foreground font-medium">RTC (h)</th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium">Custo Base</th>
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
                        <td className="py-3 px-4 font-mono font-semibold text-foreground">{p.codigo || '—'}</td>
                        <td className="py-3 px-4 font-medium text-foreground">{p.modelo || p.nome}</td>
                        <td className="py-3 px-4 text-center"><Badge className={cat.color}>{cat.label}</Badge></td>
                        <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">{p.linha || '—'}</td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-cip">{Number(p.tempo_unitario).toFixed(2)}</td>
                        <td className="py-3 px-4 text-right">R$ {Number(p.preco_base).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className="py-3 px-4 text-center">
                          <Badge className={p.ativo ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>{p.ativo ? 'Ativo' : 'Inativo'}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleViewDetail(p)}><Eye className="h-4 w-4" /></Button>
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
            <div className="flex flex-col max-h-[75vh]">
            <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                {/* Identificação */}
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3">IDENTIFICAÇÃO</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm text-muted-foreground">Código *</label>
                      <Input value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} placeholder="Ex: 112401" className="mt-1 font-mono" />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Modelo *</label>
                      <Input value={form.modelo} onChange={(e) => setForm({ ...form, modelo: e.target.value })} placeholder="Ex: Sofá Ancora" className="mt-1" />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Linha *</label>
                      <Input value={form.linha} onChange={(e) => setForm({ ...form, linha: e.target.value })} placeholder="Ex: 02 Lugares" className="mt-1" />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Tipo (Categoria)</label>
                      <select className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
                        {Object.entries(categoriaConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm text-muted-foreground">Descrição</label>
                      <Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Descrição detalhada do produto" className="mt-1" />
                    </div>
                  </div>
                </div>

                {/* Tempos por Setor */}
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3">TEMPOS POR SETOR (horas)</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {setores.map((setor) => (
                      <div key={setor.id} className="p-3 rounded-lg border border-border/30 bg-secondary/20">
                        <label className="text-xs text-muted-foreground block mb-1">
                          {setor.nome}
                          <span className="text-[10px] ml-1 opacity-60">(eff: {Math.round(setor.eficiencia * 100)}%)</span>
                        </label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={form.setorTempos[setor.id] || ''}
                          onChange={(e) => setForm({
                            ...form,
                            setorTempos: { ...form.setorTempos, [setor.id]: Number(e.target.value) || 0 }
                          })}
                          placeholder="0.00"
                          className="h-8 text-xs font-mono"
                        />
                        {(form.setorTempos[setor.id] || 0) > 0 && (
                          <p className="text-[10px] text-cip mt-1">
                            Contribuição RTC: {((Number(form.setorTempos[setor.id]) || 0) * setor.eficiencia).toFixed(2)}h
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 p-3 rounded-lg bg-cip/10 border border-cip/30 flex items-center justify-between">
                    <span className="text-sm font-medium text-cip">RTC (Tempo Total Calculado)</span>
                    <span className="text-2xl font-bold text-cip">{rtcCalc.toFixed(2)}h</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">RTC = soma automática dos tempos por setor. Não pode ser editado manualmente.</p>
                </div>

                {/* Dados Comerciais */}
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3">DADOS COMERCIAIS</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm text-muted-foreground">Custo Base (R$) *</label>
                      <Input type="number" step="0.01" min="0.01" value={form.preco_base} onChange={(e) => setForm({ ...form, preco_base: e.target.value === '' ? '' : Number(e.target.value) })} placeholder="Ex: 1200.00" className="mt-1" />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Percentual de Juros (%)</label>
                      <Input type="number" step="0.01" min="0" value={form.percentual_juros} onChange={(e) => setForm({ ...form, percentual_juros: e.target.value === '' ? '' : Number(e.target.value) })} placeholder="Ex: 5" className="mt-1" />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Unidade</label>
                      <Input value={form.unidade} onChange={(e) => setForm({ ...form, unidade: e.target.value })} className="mt-1" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Switch checked={form.ativo} onCheckedChange={(v) => setForm({ ...form, ativo: v })} />
                  <label className="text-sm text-muted-foreground">Produto Ativo</label>
                </div>

                {/* Observações */}
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3">OBSERVAÇÕES</h4>
                  <Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} placeholder="Observações para produtos especiais, personalizações, restrições..." className="min-h-[80px]" />
                </div>

              </div>
            {/* Sticky footer buttons */}
            <div className="flex justify-end gap-2 pt-4 border-t border-border/30 bg-background sticky bottom-0 shrink-0 mt-2">
              <Button variant="outline" onClick={() => { setActiveTab('lista'); setEditingId(null); setForm(emptyForm()); }}>
                <X className="h-4 w-4 mr-2" />Cancelar
              </Button>
              <Button className="bg-cip hover:bg-cip/90" onClick={() => { if (!saving) handleSave(); }} disabled={saving}>
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
            <DialogTitle>{detailProduct?.codigo} — {detailProduct?.modelo || detailProduct?.nome}</DialogTitle>
          </DialogHeader>
          {detailProduct && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4 pr-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground text-xs block">Código</span><span className="font-mono font-bold">{detailProduct.codigo || '—'}</span></div>
                  <div><span className="text-muted-foreground text-xs block">Modelo</span><span className="font-medium">{detailProduct.modelo || '—'}</span></div>
                  <div><span className="text-muted-foreground text-xs block">Linha</span><span>{detailProduct.linha || '—'}</span></div>
                  <div><span className="text-muted-foreground text-xs block">Tipo</span><Badge className={(categoriaConfig[detailProduct.categoria] || { color: '' }).color}>{(categoriaConfig[detailProduct.categoria] || { label: detailProduct.categoria }).label}</Badge></div>
                </div>
                {detailProduct.descricao && (
                  <div><span className="text-muted-foreground text-xs block">Descrição</span><p className="text-sm">{detailProduct.descricao}</p></div>
                )}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 rounded-lg bg-cip/10 text-center">
                    <p className="text-xs text-muted-foreground">RTC</p>
                    <p className="text-xl font-bold text-cip">{Number(detailProduct.tempo_unitario).toFixed(2)}h</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/50 text-center">
                    <p className="text-xs text-muted-foreground">Custo Base</p>
                    <p className="text-xl font-bold">R$ {Number(detailProduct.preco_base).toFixed(2)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/50 text-center">
                    <p className="text-xs text-muted-foreground">Juros</p>
                    <p className="text-xl font-bold">{detailProduct.percentual_juros}%</p>
                  </div>
                </div>
                {/* Sector times */}
                {detailSetorTempos.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-2">TEMPOS POR SETOR</h4>
                    <div className="space-y-1">
                      {setores.map(s => {
                        const t = detailSetorTempos.find(st => st.setor_id === s.id);
                        if (!t || t.tempo_horas <= 0) return null;
                        return (
                          <div key={s.id} className="flex justify-between text-sm px-2 py-1 rounded bg-secondary/30">
                            <span>{s.nome}</span>
                            <span className="font-mono font-bold">{t.tempo_horas.toFixed(2)}h</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {detailProduct.observacoes && (
                  <div>
                    <p className="text-xs text-muted-foreground">Observações</p>
                    <p className="text-sm">{detailProduct.observacoes}</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
