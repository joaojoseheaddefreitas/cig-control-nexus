import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Search, Plus, Edit, Trash2, Save, X, Package, Star, AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Fornecedor {
  id: string;
  nome: string;
  cnpj: string | null;
  contato: string | null;
  email: string | null;
  telefone: string | null;
  ativo: boolean;
}

interface MaterialBase {
  id: string;
  codigo: string;
  nome: string;
  unidade: string;
  categoria: string;
}

interface FornecedorMaterial {
  id: string;
  fornecedor_id: string;
  material_id: string;
  codigo_material_fornecedor: string;
  preco_atual: number;
  lead_time_dias: number;
  quantidade_minima: number;
  fornecedor_preferencial: boolean;
  status: string;
  material?: MaterialBase;
}

const emptyFornecedor: Omit<Fornecedor, 'id'> = {
  nome: '', cnpj: '', contato: '', email: '', telefone: '', ativo: true,
};

export function CICFornecedores() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [materiais, setMateriais] = useState<MaterialBase[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFornecedor, setEditingFornecedor] = useState<Fornecedor | null>(null);
  const [formData, setFormData] = useState(emptyFornecedor);

  const [vinculos, setVinculos] = useState<FornecedorMaterial[]>([]);
  const [loadingVinculos, setLoadingVinculos] = useState(false);
  const [newRows, setNewRows] = useState<Partial<FornecedorMaterial>[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [fRes, mRes] = await Promise.all([
      supabase.from('fornecedores').select('*').order('nome'),
      supabase.from('materiais').select('id, codigo, nome, unidade, categoria').eq('ativo', true).order('nome'),
    ]);
    setFornecedores((fRes.data || []) as Fornecedor[]);
    setMateriais((mRes.data || []) as MaterialBase[]);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const loadVinculos = async (fornecedorId: string) => {
    setLoadingVinculos(true);
    const { data } = await (supabase as any)
      .from('fornecedor_materiais')
      .select('*')
      .eq('fornecedor_id', fornecedorId)
      .order('created_at');
    const rows = (data || []) as FornecedorMaterial[];
    rows.forEach(r => {
      r.material = materiais.find(m => m.id === r.material_id);
    });
    setVinculos(rows);
    setLoadingVinculos(false);
  };

  const openNew = () => {
    setEditingFornecedor(null);
    setFormData({ ...emptyFornecedor });
    setVinculos([]);
    setNewRows([]);
    setDialogOpen(true);
  };

  const openEdit = async (f: Fornecedor) => {
    setEditingFornecedor(f);
    setFormData({ nome: f.nome, cnpj: f.cnpj || '', contato: f.contato || '', email: f.email || '', telefone: f.telefone || '', ativo: f.ativo });
    setNewRows([]);
    await loadVinculos(f.id);
    setDialogOpen(true);
  };

  const saveFornecedor = async () => {
    if (!formData.nome.trim()) { toast.error('Nome do fornecedor é obrigatório'); return; }

    for (const nr of newRows) {
      if (!nr.material_id) { toast.error('Selecione o material em todas as linhas'); return; }
      if (!nr.codigo_material_fornecedor?.trim()) { toast.error('Código do material no fornecedor é obrigatório'); return; }
      if (!nr.preco_atual || nr.preco_atual <= 0) { toast.error('Preço deve ser maior que zero'); return; }
    }

    let fornecedorId = editingFornecedor?.id;

    if (editingFornecedor) {
      const { error } = await supabase.from('fornecedores').update({
        nome: formData.nome, cnpj: formData.cnpj || null, contato: formData.contato || null,
        email: formData.email || null, telefone: formData.telefone || null, ativo: formData.ativo,
      }).eq('id', editingFornecedor.id);
      if (error) { toast.error(error.message); return; }
    } else {
      const { data, error } = await supabase.from('fornecedores').insert({
        nome: formData.nome, cnpj: formData.cnpj || null, contato: formData.contato || null,
        email: formData.email || null, telefone: formData.telefone || null, ativo: formData.ativo,
      }).select('id').single();
      if (error || !data) { toast.error(error?.message || 'Erro ao criar'); return; }
      fornecedorId = data.id;
    }

    if (newRows.length > 0 && fornecedorId) {
      const inserts = newRows.map(nr => ({
        fornecedor_id: fornecedorId!,
        material_id: nr.material_id!,
        codigo_material_fornecedor: nr.codigo_material_fornecedor || '',
        preco_atual: nr.preco_atual || 0,
        lead_time_dias: nr.lead_time_dias || 7,
        quantidade_minima: nr.quantidade_minima || 1,
        fornecedor_preferencial: nr.fornecedor_preferencial || false,
        status: 'ativo',
      }));
      const { error } = await (supabase as any).from('fornecedor_materiais').insert(inserts);
      if (error) { toast.error('Erro ao vincular materiais: ' + error.message); return; }

      for (const ins of inserts) {
        if (ins.fornecedor_preferencial) {
          await supabase.from('materiais').update({
            fornecedor_id: fornecedorId,
            fornecedor_nome: formData.nome,
            lead_time_dias: ins.lead_time_dias,
            valor_unitario: ins.preco_atual,
          }).eq('id', ins.material_id);
        }
      }
    }

    toast.success(editingFornecedor ? 'Fornecedor atualizado!' : 'Fornecedor cadastrado!');
    setDialogOpen(false);
    loadData();
  };

  const removeVinculo = async (vinculoId: string) => {
    const { error } = await (supabase as any).from('fornecedor_materiais').delete().eq('id', vinculoId);
    if (error) { toast.error(error.message); return; }
    setVinculos(prev => prev.filter(v => v.id !== vinculoId));
    toast.success('Material removido do fornecedor');
  };

  const updateVinculo = async (vinculoId: string, field: string, value: any) => {
    const { error } = await (supabase as any).from('fornecedor_materiais').update({ [field]: value }).eq('id', vinculoId);
    if (error) { toast.error(error.message); return; }
    setVinculos(prev => prev.map(v => v.id === vinculoId ? { ...v, [field]: value } : v));
  };

  const addNewRow = () => {
    setNewRows(prev => [...prev, {
      material_id: '', codigo_material_fornecedor: '', preco_atual: 0,
      lead_time_dias: 7, quantidade_minima: 1, fornecedor_preferencial: false,
    }]);
  };

  const updateNewRow = (idx: number, field: string, value: any) => {
    setNewRows(prev => prev.map((r, i) => {
      if (i !== idx) return r;
      const updated = { ...r, [field]: value };
      if (field === 'material_id') {
        const mat = materiais.find(m => m.id === value);
        if (mat) {
          updated.material = mat as any;
        }
      }
      return updated;
    }));
  };

  const removeNewRow = (idx: number) => {
    setNewRows(prev => prev.filter((_, i) => i !== idx));
  };

  const alreadyLinkedIds = [...vinculos.map(v => v.material_id), ...newRows.map(r => r.material_id).filter(Boolean)];
  const availableMateriais = materiais.filter(m => !alreadyLinkedIds.includes(m.id));
  const filtered = fornecedores.filter(f => f.nome.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar fornecedor..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Button onClick={openNew} size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" /> Novo Fornecedor
        </Button>
      </div>

      <div className="rounded-xl border border-border/30 bg-card/80 overflow-hidden">
        <ScrollArea className="max-h-[600px]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-secondary/30 sticky top-0 z-10">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Fornecedor</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">CNPJ</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Contato</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Email</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Telefone</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">Status</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(f => (
                <tr key={f.id} className="border-b border-border/30 hover:bg-secondary/30 cursor-pointer" onClick={() => openEdit(f)}>
                  <td className="py-3 px-4 font-medium text-foreground">{f.nome}</td>
                  <td className="py-3 px-4 text-muted-foreground">{f.cnpj || '—'}</td>
                  <td className="py-3 px-4 text-muted-foreground">{f.contato || '—'}</td>
                  <td className="py-3 px-4 text-muted-foreground">{f.email || '—'}</td>
                  <td className="py-3 px-4 text-muted-foreground">{f.telefone || '—'}</td>
                  <td className="py-3 px-4 text-center">
                    <Badge variant={f.ativo ? 'default' : 'secondary'} className={f.ativo ? 'bg-green-600/80' : ''}>
                      {f.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); openEdit(f); }}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">Nenhum fornecedor encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </ScrollArea>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">
              {editingFornecedor ? `Editar Fornecedor — ${editingFornecedor.nome}` : 'Novo Fornecedor'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Dados do Fornecedor</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Nome *</Label>
                <Input value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} placeholder="Nome do fornecedor" />
              </div>
              <div>
                <Label className="text-xs">CNPJ</Label>
                <Input value={formData.cnpj || ''} onChange={e => setFormData({ ...formData, cnpj: e.target.value })} placeholder="00.000.000/0000-00" />
              </div>
              <div>
                <Label className="text-xs">Contato</Label>
                <Input value={formData.contato || ''} onChange={e => setFormData({ ...formData, contato: e.target.value })} placeholder="Nome do contato" />
              </div>
              <div>
                <Label className="text-xs">Email</Label>
                <Input value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="email@fornecedor.com" />
              </div>
              <div>
                <Label className="text-xs">Telefone</Label>
                <Input value={formData.telefone || ''} onChange={e => setFormData({ ...formData, telefone: e.target.value })} placeholder="(00) 00000-0000" />
              </div>
              <div className="flex items-center gap-2 pt-5">
                <Switch checked={formData.ativo} onCheckedChange={v => setFormData({ ...formData, ativo: v })} />
                <Label className="text-xs">Ativo</Label>
              </div>
            </div>
          </div>

          <div className="space-y-3 mt-6 border-t border-border/50 pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Package className="h-4 w-4" />
                Materiais Fornecidos por Este Fornecedor
              </h3>
              <Button size="sm" variant="outline" onClick={addNewRow} className="gap-1.5 text-xs">
                <Plus className="h-3.5 w-3.5" /> Adicionar Material
              </Button>
            </div>

            {(vinculos.length === 0 && newRows.length === 0) && (
              <div className="flex items-center gap-2 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                Nenhum material vinculado. Adicione ao menos um material para este fornecedor.
              </div>
            )}

            <ScrollArea className="max-h-[350px]">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/50 bg-secondary/20 sticky top-0 z-10">
                    <th className="text-left py-2 px-2 text-muted-foreground font-medium">Cód. Material</th>
                    <th className="text-left py-2 px-2 text-muted-foreground font-medium">Descrição</th>
                    <th className="text-left py-2 px-2 text-muted-foreground font-medium">Cód. Fornecedor</th>
                    <th className="text-left py-2 px-2 text-muted-foreground font-medium">Unid.</th>
                    <th className="text-right py-2 px-2 text-muted-foreground font-medium">Preço Atual</th>
                    <th className="text-center py-2 px-2 text-muted-foreground font-medium">Lead Time</th>
                    <th className="text-center py-2 px-2 text-muted-foreground font-medium">Qtd Mín.</th>
                    <th className="text-center py-2 px-2 text-muted-foreground font-medium">Preferencial</th>
                    <th className="text-center py-2 px-2 text-muted-foreground font-medium">Status</th>
                    <th className="text-center py-2 px-2 text-muted-foreground font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {vinculos.map(v => (
                    <tr key={v.id} className="border-b border-border/20 hover:bg-secondary/20">
                      <td className="py-1.5 px-2 font-mono text-foreground">{v.material?.codigo || '—'}</td>
                      <td className="py-1.5 px-2 text-foreground">{v.material?.nome || '—'}</td>
                      <td className="py-1.5 px-2">
                        <Input className="h-7 text-xs w-24" value={v.codigo_material_fornecedor}
                          onChange={e => updateVinculo(v.id, 'codigo_material_fornecedor', e.target.value)} />
                      </td>
                      <td className="py-1.5 px-2 text-muted-foreground">{v.material?.unidade || 'un'}</td>
                      <td className="py-1.5 px-2 text-right">
                        <Input className="h-7 text-xs w-24 text-right" type="number" step="0.01" value={v.preco_atual}
                          onChange={e => updateVinculo(v.id, 'preco_atual', Number(e.target.value))} />
                      </td>
                      <td className="py-1.5 px-2 text-center">
                        <Input className="h-7 text-xs w-16 text-center" type="number" value={v.lead_time_dias}
                          onChange={e => updateVinculo(v.id, 'lead_time_dias', Number(e.target.value))} />
                      </td>
                      <td className="py-1.5 px-2 text-center">
                        <Input className="h-7 text-xs w-16 text-center" type="number" value={v.quantidade_minima}
                          onChange={e => updateVinculo(v.id, 'quantidade_minima', Number(e.target.value))} />
                      </td>
                      <td className="py-1.5 px-2 text-center">
                        <button onClick={() => updateVinculo(v.id, 'fornecedor_preferencial', !v.fornecedor_preferencial)}
                          className="mx-auto block">
                          <Star className={cn("h-4 w-4", v.fornecedor_preferencial ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")} />
                        </button>
                      </td>
                      <td className="py-1.5 px-2 text-center">
                        <Badge variant={v.status === 'ativo' ? 'default' : 'secondary'} className={cn("text-[10px]", v.status === 'ativo' && 'bg-green-600/80')}>
                          {v.status}
                        </Badge>
                      </td>
                      <td className="py-1.5 px-2 text-center">
                        <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => removeVinculo(v.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}

                  {newRows.map((nr, idx) => {
                    const selMat = materiais.find(m => m.id === nr.material_id);
                    return (
                      <tr key={`new-${idx}`} className="border-b border-border/20 bg-primary/5">
                        <td className="py-1.5 px-2" colSpan={2}>
                          <Select value={nr.material_id || 'none'} onValueChange={v => v !== 'none' && updateNewRow(idx, 'material_id', v)}>
                            <SelectTrigger className="h-7 text-xs">
                              <SelectValue placeholder="Selecione material..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none" disabled>Selecione...</SelectItem>
                              {availableMateriais.map(m => (
                                <SelectItem key={m.id} value={m.id}>{m.codigo} — {m.nome}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="py-1.5 px-2">
                          <Input className="h-7 text-xs w-24" placeholder="Cód. fornecedor" value={nr.codigo_material_fornecedor || ''}
                            onChange={e => updateNewRow(idx, 'codigo_material_fornecedor', e.target.value)} />
                        </td>
                        <td className="py-1.5 px-2 text-muted-foreground text-center">{selMat?.unidade || '—'}</td>
                        <td className="py-1.5 px-2">
                          <Input className="h-7 text-xs w-24 text-right" type="number" step="0.01" placeholder="0.00"
                            value={nr.preco_atual || ''} onChange={e => updateNewRow(idx, 'preco_atual', Number(e.target.value))} />
                        </td>
                        <td className="py-1.5 px-2">
                          <Input className="h-7 text-xs w-16 text-center" type="number" value={nr.lead_time_dias || 7}
                            onChange={e => updateNewRow(idx, 'lead_time_dias', Number(e.target.value))} />
                        </td>
                        <td className="py-1.5 px-2">
                          <Input className="h-7 text-xs w-16 text-center" type="number" value={nr.quantidade_minima || 1}
                            onChange={e => updateNewRow(idx, 'quantidade_minima', Number(e.target.value))} />
                        </td>
                        <td className="py-1.5 px-2 text-center">
                          <button onClick={() => updateNewRow(idx, 'fornecedor_preferencial', !nr.fornecedor_preferencial)} className="mx-auto block">
                            <Star className={cn("h-4 w-4", nr.fornecedor_preferencial ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")} />
                          </button>
                        </td>
                        <td className="py-1.5 px-2 text-center">
                          <Badge className="text-[10px] bg-green-600/80">ativo</Badge>
                        </td>
                        <td className="py-1.5 px-2 text-center">
                          <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => removeNewRow(idx)}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </ScrollArea>
          </div>

          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-border/50">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={saveFornecedor} className="gap-1.5">
              <Save className="h-4 w-4" /> Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
