import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ModuleCard } from '@/components/ui/ModuleCard';
import { KPICard } from '@/components/ui/KPICard';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  ShoppingCart, Plus, Edit, Truck, CheckCircle2, AlertCircle, Clock,
  DollarSign, Search, RefreshCw, Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { fetchPedidosCompra, criarPedidoCompra, atualizarStatusPedidoCompra, deletarPedidoCompra, type PedidoCompra } from '@/services/pedidoCompraService';
import { fetchMateriais, type Material } from '@/services/materiaisService';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  emitido: { label: 'Emitido', color: 'bg-blue-500/20 text-blue-400' },
  aprovado: { label: 'Aprovado', color: 'bg-indigo-500/20 text-indigo-400' },
  em_producao: { label: 'Em Produção', color: 'bg-yellow-500/20 text-yellow-400' },
  em_transporte: { label: 'Em Transporte', color: 'bg-orange-500/20 text-orange-400' },
  recebido: { label: 'Recebido', color: 'bg-green-500/20 text-green-400' },
  atrasado: { label: 'Atrasado', color: 'bg-red-500/20 text-red-400' },
  cancelado: { label: 'Cancelado', color: 'bg-gray-500/20 text-gray-400' },
};

const fmtCurrency = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

export function CICCompras() {
  const [pedidos, setPedidos] = useState<PedidoCompra[]>([]);
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedPedido, setSelectedPedido] = useState<PedidoCompra | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [recebimento, setRecebimento] = useState({ data: '', quantidade: 0, nf: '', onTime: true, inFull: true });

  // New order form
  const [form, setForm] = useState({
    material_id: '', fornecedor_id: '', quantidade: 1, valor_unitario: 0,
    data_previsao: '', observacoes: '',
  });

  const loadData = async () => {
    setLoading(true);
    const [pcs, mats, fornData] = await Promise.all([
      fetchPedidosCompra(),
      fetchMateriais(),
      supabase.from('fornecedores').select('*').eq('ativo', true).order('nome'),
    ]);
    setPedidos(pcs);
    setMateriais(mats);
    setFornecedores(fornData.data || []);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const hoje = new Date().toISOString().split('T')[0];
  const pedidosFiltered = pedidos.filter(p => {
    const matchSearch = p.material_nome.toLowerCase().includes(search.toLowerCase()) ||
      p.fornecedor_nome.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'todos' || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const comprasAtivas = pedidos.filter(p => !['recebido', 'cancelado'].includes(p.status));
  const atrasados = pedidos.filter(p => p.data_previsao && p.data_previsao < hoje && !['recebido', 'cancelado'].includes(p.status));
  const valorTotal = comprasAtivas.reduce((s, p) => s + p.valor_total, 0);

  const handleCreate = async () => {
    const mat = materiais.find(m => m.id === form.material_id);
    const forn = fornecedores.find(f => f.id === form.fornecedor_id);
    if (!mat || !forn) { toast.error('Selecione material e fornecedor'); return; }
    const { error } = await criarPedidoCompra({
      material_id: form.material_id,
      material_nome: mat.nome,
      fornecedor_id: form.fornecedor_id,
      fornecedor_nome: forn.nome,
      quantidade: form.quantidade,
      valor_unitario: form.valor_unitario || mat.valor_unitario,
      data_previsao: form.data_previsao || null,
      observacoes: form.observacoes || null,
    });
    if (error) { toast.error(error); return; }
    toast.success('Pedido de compra criado!');
    setDialogOpen(false);
    setForm({ material_id: '', fornecedor_id: '', quantidade: 1, valor_unitario: 0, data_previsao: '', observacoes: '' });
    loadData();
  };

  const handleStatusChange = async () => {
    if (!selectedPedido) return;
    const extras: any = {};
    if (newStatus === 'recebido') {
      extras.data_recebimento = recebimento.data || hoje;
      extras.quantidade_recebida = recebimento.quantidade || selectedPedido.quantidade;
      extras.nota_fiscal = recebimento.nf || null;
      extras.on_time = recebimento.onTime;
      extras.in_full = recebimento.inFull;
    }
    const { error } = await atualizarStatusPedidoCompra(selectedPedido.id, newStatus, newStatus === 'recebido' ? extras : undefined);
    if (error) { toast.error(error); return; }
    toast.success(`Status atualizado para ${STATUS_MAP[newStatus]?.label || newStatus}`);
    setStatusDialogOpen(false);
    setSelectedPedido(null);
    loadData();
  };

  const handleDelete = async (id: string) => {
    const { error } = await deletarPedidoCompra(id);
    if (error) { toast.error(error); return; }
    toast.success('Pedido excluído');
    loadData();
  };

  const openStatusDialog = (pedido: PedidoCompra) => {
    setSelectedPedido(pedido);
    setNewStatus(pedido.status);
    setRecebimento({ data: hoje, quantidade: pedido.quantidade, nf: '', onTime: true, inFull: true });
    setStatusDialogOpen(true);
  };

  const onSelectMaterial = (matId: string) => {
    const mat = materiais.find(m => m.id === matId);
    setForm(f => ({ ...f, material_id: matId, valor_unitario: mat?.valor_unitario || 0 }));
  };

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard title="Compras Ativas" value={comprasAtivas.length} subtitle="Em andamento" icon={<ShoppingCart className="h-5 w-5" />} variant="cic" />
        <KPICard title="Atrasados" value={atrasados.length} subtitle="Fora do prazo" icon={<AlertCircle className="h-5 w-5" />} variant="cic" trend={atrasados.length > 0 ? 'down' : 'up'} trendValue={atrasados.length > 0 ? 'Atenção' : 'OK'} />
        <KPICard title="Valor Total" value={fmtCurrency(valorTotal)} subtitle="Em compras" icon={<DollarSign className="h-5 w-5" />} variant="cic" />
        <KPICard title="Pedidos" value={pedidos.length} subtitle="Total registrados" icon={<Clock className="h-5 w-5" />} variant="cic" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por material ou fornecedor..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            {Object.entries(STATUS_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={() => setDialogOpen(true)} className="ml-auto gap-2 bg-cic hover:bg-cic/90"><Plus className="h-4 w-4" />Novo Pedido</Button>
        <Button variant="ghost" size="sm" onClick={loadData}><RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} /></Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/30 bg-card/80 overflow-hidden">
        <ScrollArea className="max-h-[500px]">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border/50 bg-secondary/30 sticky top-0 z-10">
              <th className="text-left py-3 px-3 text-muted-foreground font-medium text-xs">Material</th>
              <th className="text-left py-3 px-3 text-muted-foreground font-medium text-xs">Fornecedor</th>
              <th className="text-center py-3 px-2 text-muted-foreground font-medium text-xs">Qtd</th>
              <th className="text-right py-3 px-3 text-muted-foreground font-medium text-xs">Valor</th>
              <th className="text-center py-3 px-2 text-muted-foreground font-medium text-xs">Emissão</th>
              <th className="text-center py-3 px-2 text-muted-foreground font-medium text-xs">Previsão</th>
              <th className="text-center py-3 px-2 text-muted-foreground font-medium text-xs">Status</th>
              <th className="text-center py-3 px-2 text-muted-foreground font-medium text-xs">Ações</th>
            </tr></thead>
            <tbody>
              {pedidosFiltered.length === 0 ? (
                <tr><td colSpan={8} className="py-8 text-center text-muted-foreground">Nenhum pedido encontrado.</td></tr>
              ) : pedidosFiltered.map(p => {
                const isAtrasado = p.data_previsao && p.data_previsao < hoje && !['recebido', 'cancelado'].includes(p.status);
                const statusKey = isAtrasado ? 'atrasado' : p.status;
                const st = STATUS_MAP[statusKey] || { label: p.status, color: '' };
                return (
                  <tr key={p.id} className={cn("border-b border-border/30 hover:bg-secondary/30", isAtrasado && "bg-destructive/5")}>
                    <td className="py-2 px-3 font-medium text-xs">{p.material_nome}</td>
                    <td className="py-2 px-3 text-xs text-muted-foreground">{p.fornecedor_nome}</td>
                    <td className="py-2 px-2 text-center text-xs">{p.quantidade}</td>
                    <td className="py-2 px-3 text-right text-xs font-semibold">{fmtCurrency(p.valor_total)}</td>
                    <td className="py-2 px-2 text-center text-xs text-muted-foreground">{p.data_emissao}</td>
                    <td className="py-2 px-2 text-center text-xs text-muted-foreground">{p.data_previsao || '—'}</td>
                    <td className="py-2 px-2 text-center"><Badge className={cn("text-[10px]", st.color)}>{st.label}</Badge></td>
                    <td className="py-2 px-2 text-center">
                      <div className="flex gap-1 justify-center">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openStatusDialog(p)} title="Alterar Status">
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        {p.status !== 'recebido' && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(p.id)} title="Excluir">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </ScrollArea>
      </div>

      {/* Create Order Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="text-cic">Novo Pedido de Compra</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Material *</Label>
              <Select value={form.material_id} onValueChange={onSelectMaterial}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {materiais.map(m => <SelectItem key={m.id} value={m.id}>{m.codigo} — {m.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fornecedor *</Label>
              <Select value={form.fornecedor_id} onValueChange={v => setForm(f => ({ ...f, fornecedor_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {fornecedores.map(f => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Quantidade</Label><Input type="number" value={form.quantidade} onChange={e => setForm(f => ({ ...f, quantidade: Number(e.target.value) }))} /></div>
              <div><Label>Valor Unitário</Label><Input type="number" step="0.01" value={form.valor_unitario} onChange={e => setForm(f => ({ ...f, valor_unitario: Number(e.target.value) }))} /></div>
            </div>
            <div><Label>Previsão Entrega</Label><Input type="date" value={form.data_previsao} onChange={e => setForm(f => ({ ...f, data_previsao: e.target.value }))} /></div>
            <div><Label>Observações</Label><Input value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button className="bg-cic hover:bg-cic/90" onClick={handleCreate}>Criar Pedido</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Change Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="text-cic">Alterar Status</DialogTitle></DialogHeader>
          {selectedPedido && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{selectedPedido.material_nome} — {selectedPedido.fornecedor_nome}</p>
              <div>
                <Label>Novo Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_MAP).filter(([k]) => k !== 'atrasado').map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {newStatus === 'recebido' && (
                <div className="space-y-2 p-3 rounded-lg bg-secondary/30 border border-border/30">
                  <Label className="text-xs text-muted-foreground">Dados de Recebimento</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label className="text-xs">Data</Label><Input type="date" value={recebimento.data} onChange={e => setRecebimento(r => ({ ...r, data: e.target.value }))} /></div>
                    <div><Label className="text-xs">Qtd Recebida</Label><Input type="number" value={recebimento.quantidade} onChange={e => setRecebimento(r => ({ ...r, quantidade: Number(e.target.value) }))} /></div>
                  </div>
                  <div><Label className="text-xs">Nota Fiscal</Label><Input value={recebimento.nf} onChange={e => setRecebimento(r => ({ ...r, nf: e.target.value }))} /></div>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-xs">
                      <input type="checkbox" checked={recebimento.onTime} onChange={e => setRecebimento(r => ({ ...r, onTime: e.target.checked }))} />
                      On Time
                    </label>
                    <label className="flex items-center gap-2 text-xs">
                      <input type="checkbox" checked={recebimento.inFull} onChange={e => setRecebimento(r => ({ ...r, inFull: e.target.checked }))} />
                      In Full
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>Cancelar</Button>
            <Button className="bg-cic hover:bg-cic/90" onClick={handleStatusChange}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
