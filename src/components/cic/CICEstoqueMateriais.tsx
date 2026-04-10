import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { ModuleCard } from '@/components/ui/ModuleCard';
import { KPICard } from '@/components/ui/KPICard';
import { ArrowUp, ArrowDown, Package, RefreshCw, Warehouse, AlertTriangle, Trash2, RotateCcw, ShieldAlert, Pencil, Check, X, Save } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import {
  fetchMateriais,
  fetchMovimentacoesMateriais,
  registrarEntradaMaterial,
  registrarConsumoMaterial,
  type Material,
  type MovimentacaoMaterial,
} from '@/services/materiaisService';

function getSituacaoEstoque(m: Material) {
  if (m.estoque_atual <= 0) return { label: 'Falta', color: 'bg-destructive/20 text-destructive', emoji: '🔴' };
  if (m.estoque_atual <= m.estoque_minimo) return { label: 'Pouco', color: 'bg-warning/20 text-warning', emoji: '🟠' };
  if (m.estoque_atual > m.estoque_maximo && m.estoque_maximo > 0) return { label: 'Elevado', color: 'bg-blue-500/20 text-blue-400', emoji: '🔵' };
  return { label: 'Normal', color: 'bg-success/20 text-success', emoji: '🟢' };
}

export function CICEstoqueMateriais() {
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [lixeira, setLixeira] = useState<any[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tipoMov, setTipoMov] = useState<'entrada' | 'saida'>('entrada');
  const [materialId, setMaterialId] = useState('');
  const [quantidade, setQuantidade] = useState(1);
  const [valorUnit, setValorUnit] = useState(0);
  const [notaFiscal, setNotaFiscal] = useState('');
  const [motivo, setMotivo] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<Material | null>(null);
  const [tab, setTab] = useState('estoque');
  // Inline editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Record<string, any>>({});

  const loadData = async () => {
    setLoading(true);
    const [mats, movs] = await Promise.all([
      fetchMateriais(),
      fetchMovimentacoesMateriais(50),
    ]);
    const { data: inativos } = await (supabase as any)
      .from('materiais')
      .select('*')
      .eq('ativo', false)
      .order('nome');
    setMateriais(mats);
    setMovimentacoes(movs);
    setLixeira(inativos || []);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  // Inline edit handlers
  const startEdit = (m: Material) => {
    setEditingId(m.id);
    setEditData({
      estoque_atual: m.estoque_atual,
      valor_unitario: m.valor_unitario,
      lead_time_dias: m.lead_time_dias,
      categoria: m.categoria,
      fornecedor_nome: m.fornecedor_nome || '',
      estoque_minimo: m.estoque_minimo,
      estoque_maximo: m.estoque_maximo,
      tipo_controle: m.tipo_controle || 'MRP',
      margem_seguranca_percentual: m.margem_seguranca_percentual || 20,
    });
  };

  const cancelEdit = () => { setEditingId(null); setEditData({}); };

  const saveEdit = async () => {
    if (!editingId) return;
    const { error } = await (supabase as any)
      .from('materiais')
      .update({
        estoque_atual: Number(editData.estoque_atual) || 0,
        valor_unitario: Number(editData.valor_unitario) || 0,
        lead_time_dias: Number(editData.lead_time_dias) || 0,
        categoria: editData.categoria || 'geral',
        fornecedor_nome: editData.fornecedor_nome || null,
        estoque_minimo: Number(editData.estoque_minimo) || 0,
        estoque_maximo: Number(editData.estoque_maximo) || 0,
        tipo_controle: editData.tipo_controle || 'MRP',
        margem_seguranca_percentual: Number(editData.margem_seguranca_percentual) || 20,
      })
      .eq('id', editingId);

    if (error) {
      toast.error('Erro ao salvar: ' + error.message);
    } else {
      toast.success('Material atualizado!');
      setEditingId(null);
      setEditData({});
      await loadData();
    }
  };

  const handleRegistrar = async () => {
    if (!materialId) { toast.error('Selecione um material'); return; }
    if (tipoMov === 'saida') {
      const mat = materiais.find(m => m.id === materialId);
      if (mat && mat.estoque_atual < quantidade) {
        toast.error(`Estoque insuficiente! Disponível: ${mat.estoque_atual} ${mat.unidade}`);
        return;
      }
    }
    let result: { error: string | null };
    if (tipoMov === 'entrada') {
      result = await registrarEntradaMaterial(materialId, quantidade, valorUnit || 0, notaFiscal, motivo);
    } else {
      result = await registrarConsumoMaterial(materialId, quantidade, undefined, motivo);
    }
    if (result.error) {
      toast.error(`❌ Erro: ${result.error}`);
    } else {
      toast.success(`✅ ${tipoMov === 'entrada' ? 'Entrada' : 'Saída'} registrada`);
      setDialogOpen(false);
      setMaterialId(''); setQuantidade(1); setValorUnit(0); setNotaFiscal(''); setMotivo('');
      await loadData();
    }
  };

  const openDialog = (tipo: 'entrada' | 'saida') => { setTipoMov(tipo); setDialogOpen(true); };

  const handleSoftDelete = async (mat: Material) => {
    const { data: bomUsage } = await supabase.from('bom_produto').select('id').eq('material_id', mat.id).limit(1);
    if (bomUsage && bomUsage.length > 0) {
      toast.error(`❌ Material "${mat.nome}" está vinculado a produtos (BOM). Remova os vínculos primeiro.`);
      return;
    }
    const { error } = await (supabase as any).from('materiais').update({ ativo: false }).eq('id', mat.id);
    if (error) { toast.error('Erro: ' + error.message); }
    else {
      toast.success(`Material "${mat.nome}" movido para a Lixeira.`);
      await supabase.from('action_logs').insert({ action: 'material_lixeira', entity: 'materiais', entity_id: mat.id, status: 'success', details: { nome: mat.nome } as any });
    }
    setDeleteConfirm(null);
    await loadData();
  };

  const handleRestore = async (mat: any) => {
    const { error } = await (supabase as any).from('materiais').update({ ativo: true }).eq('id', mat.id);
    if (error) toast.error('Erro: ' + error.message);
    else toast.success(`Material "${mat.nome}" restaurado!`);
    await loadData();
  };

  const handlePermanentDelete = async (mat: any) => {
    const { data: bomUsage } = await supabase.from('bom_produto').select('id').eq('material_id', mat.id).limit(1);
    if (bomUsage && bomUsage.length > 0) { toast.error('Não é possível excluir: material vinculado a produtos (BOM).'); return; }
    const { error } = await (supabase as any).from('materiais').delete().eq('id', mat.id);
    if (error) toast.error('Erro: ' + error.message);
    else toast.success(`Material "${mat.nome}" excluído permanentemente.`);
    await loadData();
  };

  const criticos = materiais.filter(m => m.status === 'critico').length;
  const falta = materiais.filter(m => m.estoque_atual <= 0).length;
  const valorTotal = materiais.reduce((s, m) => s + (m.valor_estoque || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KPICard title="Materiais Ativos" value={materiais.length} subtitle="Cadastrados" icon={<Package className="h-5 w-5" />} variant="cic" />
        <KPICard title="Valor Estoque" value={`R$ ${(valorTotal / 1000).toFixed(0)}k`} subtitle="Total valorizado" icon={<Warehouse className="h-5 w-5" />} variant="cic" />
        <KPICard title="Críticos" value={criticos} subtitle="Abaixo ponto pedido" icon={<AlertTriangle className="h-5 w-5" />} variant="cic" trend={criticos > 0 ? 'down' : 'up'} trendValue={criticos > 0 ? 'Atenção' : 'OK'} />
        <KPICard title="Em Falta" value={falta} subtitle="Estoque = 0" icon={<ShieldAlert className="h-5 w-5" />} variant="cic" trend={falta > 0 ? 'down' : 'up'} trendValue={falta > 0 ? '🔴' : '🟢'} />
        <KPICard title="Lixeira" value={lixeira.length} subtitle="Inativos" icon={<Trash2 className="h-5 w-5" />} variant="cic" />
      </div>

      {/* Ações */}
      <div className="flex gap-3">
        <Button className="bg-success hover:bg-success/90" onClick={() => openDialog('entrada')}>
          <ArrowUp className="h-4 w-4 mr-2" /> Entrada via NF
        </Button>
        <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10" onClick={() => openDialog('saida')}>
          <ArrowDown className="h-4 w-4 mr-2" /> Saída / Requisição
        </Button>
        <Button variant="ghost" size="sm" onClick={loadData}>
          <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} /> Atualizar
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="estoque">Estoque ({materiais.length})</TabsTrigger>
          <TabsTrigger value="movimentacoes">Movimentações ({movimentacoes.length})</TabsTrigger>
          <TabsTrigger value="lixeira">🗑 Lixeira ({lixeira.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="estoque">
          <ModuleCard title="Estoque de Materiais — Editável (clique no lápis para editar)" variant="cic">
            {loading ? (
              <div className="py-8 text-center text-muted-foreground">Carregando...</div>
            ) : materiais.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">Nenhum material cadastrado.</div>
            ) : (
              <div className="overflow-auto" style={{ maxHeight: '600px' }}>
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-card">
                    <tr className="border-b border-border/50 bg-secondary/30">
                      <th className="text-left py-3 px-2 text-muted-foreground font-medium text-xs">Código</th>
                      <th className="text-left py-3 px-2 text-muted-foreground font-medium text-xs">Material</th>
                      <th className="text-center py-3 px-2 text-muted-foreground font-medium text-xs">Tipo</th>
                      <th className="text-center py-3 px-2 text-muted-foreground font-medium text-xs">Categoria</th>
                      <th className="text-center py-3 px-2 text-muted-foreground font-medium text-xs">Estoque</th>
                      <th className="text-center py-3 px-2 text-muted-foreground font-medium text-xs">Disponível</th>
                      <th className="text-center py-3 px-2 text-muted-foreground font-medium text-xs">Mín</th>
                      <th className="text-center py-3 px-2 text-muted-foreground font-medium text-xs">Máx</th>
                      <th className="text-center py-3 px-2 text-muted-foreground font-medium text-xs">PP Calc.</th>
                      <th className="text-center py-3 px-2 text-muted-foreground font-medium text-xs">Margem %</th>
                      <th className="text-center py-3 px-2 text-muted-foreground font-medium text-xs">Val Unit</th>
                      <th className="text-right py-3 px-2 text-muted-foreground font-medium text-xs">Val Total</th>
                      <th className="text-center py-3 px-2 text-muted-foreground font-medium text-xs">Lead Time</th>
                      <th className="text-center py-3 px-2 text-muted-foreground font-medium text-xs">Fornecedor</th>
                      <th className="text-center py-3 px-2 text-muted-foreground font-medium text-xs">Status</th>
                      <th className="text-center py-3 px-2 text-muted-foreground font-medium text-xs">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materiais.map(m => {
                      const sit = getSituacaoEstoque(m);
                      const isEditing = editingId === m.id;
                      return (
                        <tr key={m.id} className={cn("border-b border-border/30 hover:bg-secondary/30",
                          m.estoque_atual <= 0 && "bg-destructive/5",
                          isEditing && "bg-cip/5 ring-1 ring-cip/30"
                        )}>
                          <td className="py-1.5 px-2 font-mono text-xs">{m.codigo}</td>
                          <td className="py-1.5 px-2 font-medium text-xs max-w-[140px] truncate">{m.nome}</td>
                          <td className="py-1.5 px-2 text-center text-xs">
                            {isEditing ? (
                              <select className="h-7 text-xs bg-background border rounded px-1" value={editData.tipo_controle}
                                onChange={e => setEditData({ ...editData, tipo_controle: e.target.value })}>
                                <option value="MRP">MRP</option>
                                <option value="DUAS_GAVETAS">2 Gavetas</option>
                              </select>
                            ) : (
                              <Badge className={cn("text-[9px]", m.tipo_controle === 'DUAS_GAVETAS' ? 'bg-purple-500/20 text-purple-400' : 'bg-secondary text-muted-foreground')}>
                                {m.tipo_controle === 'DUAS_GAVETAS' ? '2GAV' : 'MRP'}
                              </Badge>
                            )}
                          </td>
                          <td className="py-1.5 px-2 text-center text-xs">
                            {isEditing ? (
                              <Input className="h-7 text-xs w-20" value={editData.categoria}
                                onChange={e => setEditData({ ...editData, categoria: e.target.value })} />
                            ) : m.categoria}
                          </td>
                          <td className="py-1.5 px-2 text-center font-semibold text-xs">
                            {isEditing ? (
                              <Input type="number" className="h-7 text-xs w-16" value={editData.estoque_atual}
                                onChange={e => setEditData({ ...editData, estoque_atual: e.target.value })} />
                            ) : <>{m.estoque_atual} {m.unidade}</>}
                          <td className="py-1.5 px-2 text-center text-xs text-muted-foreground">{Math.max(0, m.estoque_atual - m.estoque_minimo)} {m.unidade}</td>
                          <td className="py-1.5 px-2 text-center text-xs">
                            {isEditing ? (
                              <Input type="number" className="h-7 text-xs w-14" value={editData.estoque_minimo}
                                onChange={e => setEditData({ ...editData, estoque_minimo: e.target.value })} />
                            ) : m.estoque_minimo}
                          </td>
                          <td className="py-1.5 px-2 text-center text-xs">
                            {isEditing ? (
                              <Input type="number" className="h-7 text-xs w-14" value={editData.estoque_maximo}
                                onChange={e => setEditData({ ...editData, estoque_maximo: e.target.value })} />
                            ) : m.estoque_maximo}
                          </td>
                          <td className="py-1.5 px-2 text-center text-xs font-semibold text-warning">{(m.ponto_pedido_calculado || 0).toFixed(0)}</td>
                          <td className="py-1.5 px-2 text-center text-xs">
                            {isEditing ? (
                              <Input type="number" className="h-7 text-xs w-14" value={editData.margem_seguranca_percentual}
                                onChange={e => setEditData({ ...editData, margem_seguranca_percentual: e.target.value })} />
                            ) : <>{m.margem_seguranca_percentual}%</>}
                          </td>
                          <td className="py-1.5 px-2 text-center text-xs">
                            {isEditing ? (
                              <Input type="number" step="0.01" className="h-7 text-xs w-20" value={editData.valor_unitario}
                                onChange={e => setEditData({ ...editData, valor_unitario: e.target.value })} />
                            ) : `R$ ${Number(m.valor_unitario).toFixed(2)}`}
                          </td>
                          <td className="py-1.5 px-2 text-right font-semibold text-xs">
                            R$ {((m.valor_estoque || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-1.5 px-2 text-center text-xs">
                            {isEditing ? (
                              <Input type="number" className="h-7 text-xs w-14" value={editData.lead_time_dias}
                                onChange={e => setEditData({ ...editData, lead_time_dias: e.target.value })} />
                            ) : <>{m.lead_time_dias}d</>}
                          </td>
                          <td className="py-1.5 px-2 text-center text-xs max-w-[100px] truncate">
                            {isEditing ? (
                              <Input className="h-7 text-xs w-24" value={editData.fornecedor_nome}
                                onChange={e => setEditData({ ...editData, fornecedor_nome: e.target.value })} />
                            ) : (m.fornecedor_nome || '—')}
                          </td>
                          <td className="py-1.5 px-2 text-center">
                            <Badge className={cn("text-[10px]", sit.color)}>
                              {sit.emoji} {sit.label}
                            </Badge>
                          </td>
                          <td className="py-1.5 px-2 text-center">
                            {isEditing ? (
                              <div className="flex justify-center gap-1">
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-success" onClick={saveEdit} title="Salvar">
                                  <Check className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={cancelEdit} title="Cancelar">
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex justify-center gap-1">
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-cip/70 hover:text-cip" onClick={() => startEdit(m)} title="Editar">
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/60 hover:text-destructive" onClick={() => setDeleteConfirm(m)} title="Lixeira">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </ModuleCard>
        </TabsContent>

        <TabsContent value="movimentacoes">
          <ModuleCard title="Últimas Movimentações" variant="cic">
            <div className="overflow-auto" style={{ maxHeight: '500px' }}>
              {movimentacoes.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">Nenhuma movimentação registrada.</div>
              ) : (
                <div className="space-y-2 p-2">
                  {movimentacoes.map(m => {
                    const isAuto = m.tipo === 'consumo_op';
                    return (
                      <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/20 border border-border/30">
                        <div className="flex items-center gap-3">
                          {m.tipo === 'entrada' ? <ArrowUp className="h-4 w-4 text-success" /> : <ArrowDown className="h-4 w-4 text-destructive" />}
                          <div>
                            <p className="text-sm font-medium">
                              {m.tipo === 'entrada' ? 'Entrada' : m.tipo === 'consumo_op' ? 'Consumo Automático (Produção)' : 'Saída Manual'}
                              {' — '}{m.quantidade} un
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {m.motivo || 'Sem motivo'} • {m.usuario || 'Admin'} • {new Date(m.created_at).toLocaleString('pt-BR')}
                              {m.nota_fiscal ? ` • NF: ${m.nota_fiscal}` : ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isAuto && <Badge className="bg-cip/20 text-cip text-[10px]">Auto</Badge>}
                          <Badge variant="outline" className="text-[10px]">
                            R$ {Number(m.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </ModuleCard>
        </TabsContent>

        <TabsContent value="lixeira">
          <ModuleCard title="🗑 Lixeira — Materiais Inativos" variant="cic">
            {lixeira.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">Lixeira vazia.</div>
            ) : (
              <div className="overflow-auto" style={{ maxHeight: '500px' }}>
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-card">
                    <tr className="border-b border-border/50 bg-secondary/30">
                      <th className="text-left py-3 px-3 text-xs text-muted-foreground">Código</th>
                      <th className="text-left py-3 px-3 text-xs text-muted-foreground">Material</th>
                      <th className="text-center py-3 px-2 text-xs text-muted-foreground">Estoque</th>
                      <th className="text-center py-3 px-2 text-xs text-muted-foreground">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lixeira.map((m: any) => (
                      <tr key={m.id} className="border-b border-border/30 opacity-60 hover:opacity-100">
                        <td className="py-2 px-3 font-mono text-xs">{m.codigo}</td>
                        <td className="py-2 px-3 font-medium text-xs">{m.nome}</td>
                        <td className="py-2 px-2 text-center text-xs">{m.estoque_atual} {m.unidade}</td>
                        <td className="py-2 px-2 text-center">
                          <div className="flex justify-center gap-1">
                            <Button variant="ghost" size="sm" className="h-7 text-success text-xs" onClick={() => handleRestore(m)}>
                              <RotateCcw className="h-3.5 w-3.5 mr-1" /> Restaurar
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 text-destructive text-xs" onClick={() => handlePermanentDelete(m)}>
                              <Trash2 className="h-3.5 w-3.5 mr-1" /> Excluir
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </ModuleCard>
        </TabsContent>
      </Tabs>

      {/* Dialog Entrada/Saída */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {tipoMov === 'entrada' ? <ArrowUp className="h-5 w-5 text-success" /> : <ArrowDown className="h-5 w-5 text-destructive" />}
              {tipoMov === 'entrada' ? 'Entrada via Nota Fiscal' : 'Saída / Requisição'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Material *</Label>
              <Select value={materialId} onValueChange={setMaterialId}>
                <SelectTrigger><SelectValue placeholder="Selecione o material" /></SelectTrigger>
                <SelectContent>
                  {materiais.map(m => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.codigo} — {m.nome} (estoque: {m.estoque_atual} {m.unidade})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantidade *</Label>
                <Input type="number" min={1} value={quantidade} onChange={e => setQuantidade(Math.max(1, parseInt(e.target.value) || 1))} />
              </div>
              {tipoMov === 'entrada' && (
                <div className="space-y-2">
                  <Label>Valor Unitário (R$)</Label>
                  <Input type="number" step="0.01" min={0} value={valorUnit} onChange={e => setValorUnit(parseFloat(e.target.value) || 0)} />
                </div>
              )}
            </div>
            {tipoMov === 'entrada' && (
              <div className="space-y-2">
                <Label>Nota Fiscal</Label>
                <Input placeholder="Nº da NF" value={notaFiscal} onChange={e => setNotaFiscal(e.target.value)} />
              </div>
            )}
            <div className="space-y-2">
              <Label>Motivo</Label>
              <Input placeholder="Ex: Reposição, Ajuste, Requisição..." value={motivo} onChange={e => setMotivo(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleRegistrar} className={tipoMov === 'entrada' ? 'bg-success hover:bg-success/90' : 'bg-destructive hover:bg-destructive/90'}>
              Confirmar {tipoMov === 'entrada' ? 'Entrada' : 'Saída'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Confirmação Exclusão */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" /> Mover para Lixeira?
            </DialogTitle>
            <DialogDescription>
              O material <strong>{deleteConfirm?.nome}</strong> será desativado e movido para a lixeira.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
            <Button className="bg-destructive hover:bg-destructive/90" onClick={() => deleteConfirm && handleSoftDelete(deleteConfirm)}>
              Confirmar Exclusão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
