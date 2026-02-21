import { useState, useEffect } from 'react';
import { 
  Search, Plus, Edit, Eye, Package, FileText, 
  Truck, BarChart3, CheckCircle2, Clock, AlertTriangle, 
  Calendar, Check, Ban, Printer
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { KPICard } from '@/components/ui/KPICard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CIVCadastroPedidoStepper, type PedidoStepper, type PedidoStepperItem } from './CIVCadastroPedidoStepper';
import { toast } from 'sonner';
import { fetchPedidos, insertPedido, updatePedido, type PedidoDB } from '@/services/pedidoService';
import { aprovarPedido, anularPedido, verificarEdicaoPedido } from '@/services/aprovacaoService';
import { imprimirPedido } from '@/services/printService';
import { supabase } from '@/integrations/supabase/client';

interface Pedido {
  id: string;
  codigo: string;
  cliente: string;
  produto: string;
  quantidade: number;
  dataEntrada: string;
  prazoEntrega: string;
  status: string;
  statusProducao: string;
  statusFaturamento: string;
  valorTotal: number;
  op?: string;
  margem: number;
  canal: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  aguardando: { label: 'Aguardando', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: Clock },
  programado: { label: 'Programado', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: Calendar },
  em_producao: { label: 'Em Produção', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: Package },
  produzido: { label: 'Produzido', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle2 },
  finalizado: { label: 'Finalizado', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle2 },
  expedido: { label: 'Expedido', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', icon: Truck },
  faturado: { label: 'Faturado', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: FileText },
  cancelado: { label: 'Cancelado', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: Ban },
};

export function CIVCarteiraProducao() {
  const [search, setSearch] = useState('');
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [stepperOpen, setStepperOpen] = useState(false);
  const [editingPedido, setEditingPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    loadPedidos();
  }, []);

  const loadPedidos = async () => {
    setLoading(true);
    const { data, error } = await fetchPedidos();
    if (error) {
      toast.error('Erro ao carregar pedidos', { description: error });
      setLoading(false);
      return;
    }
    if (data && data.length > 0) {
      const mapped: Pedido[] = data.map(d => ({
        id: d.id,
        codigo: d.codigo,
        cliente: d.cliente,
        produto: d.produto,
        quantidade: d.quantidade,
        dataEntrada: d.data_entrada,
        prazoEntrega: d.prazo_entrega || '',
        status: d.status,
        statusProducao: (d as any).status_producao || 'aguardando',
        statusFaturamento: (d as any).status_faturamento || 'pendente',
        valorTotal: Number(d.valor_total),
        op: d.op || undefined,
        margem: Number(d.margem),
        canal: d.canal,
      }));
      setPedidos(mapped);
    } else {
      setPedidos([]);
    }
    setLoading(false);
  };

  const filteredPedidos = pedidos.filter(p => 
    p.codigo.toLowerCase().includes(search.toLowerCase()) ||
    p.cliente.toLowerCase().includes(search.toLowerCase()) ||
    p.produto.toLowerCase().includes(search.toLowerCase())
  );

  const totalPedidos = pedidos.length;
  const valorTotal = pedidos.reduce((acc, p) => acc + p.valorTotal, 0);
  const emProducao = pedidos.filter(p => p.status === 'em_producao' || p.status === 'programado').length;
  const aguardando = pedidos.filter(p => p.status === 'aguardando').length;

  const handleNewPedido = () => {
    setEditingPedido(null);
    setStepperOpen(true);
  };

  const handleSavePedido = async (data: Partial<PedidoStepper>, itens?: PedidoStepperItem[]) => {
    if (editingPedido) {
      const { error } = await updatePedido(editingPedido.id, {
        cliente: data.cliente,
        produto: data.produto,
        quantidade: data.quantidade,
        canal: data.canal,
        margem: data.margem,
        valor_total: data.valorTotal,
        prazo_entrega: data.prazoEntrega || null,
        status: data.status || editingPedido.status,
        codigo: data.codigo || editingPedido.codigo,
      });
      if (error) {
        toast.error('❌ Falha ao atualizar pedido', { description: error });
        return;
      }
      toast.success('✅ Pedido atualizado');
      await loadPedidos();
      return;
    }

    // === TRANSAÇÃO ÚNICA: Inserir pedido + itens + aprovar + gerar OPs ===
    setSalvando(true);
    let pedidoId: string | null = null;

    try {
      // 1. Inserir pedido
      const { data: newPedido, error: pedidoError } = await insertPedido({
        codigo: data.codigo || `PED-${String(Date.now()).slice(-4)}`,
        cliente: data.cliente || '',
        produto: data.produto || '',
        quantidade: data.quantidade || 1,
        canal: data.canal || '',
        margem: data.margem || 0,
        valor_total: data.valorTotal || 0,
        prazo_entrega: data.prazoEntrega || null,
        data_entrada: data.dataEntrada || new Date().toISOString().split('T')[0],
        status: 'aguardando',
        op: null,
        nota_fiscal: null,
        data_faturamento: null,
        data_expedicao: null,
        origem_dado: 'manual',
      });

      if (pedidoError || !newPedido) {
        toast.error('❌ Falha ao criar pedido', { description: pedidoError || 'Erro desconhecido' });
        setSalvando(false);
        return;
      }
      pedidoId = newPedido.id;

      // 2. Inserir itens_pedido
      const itensParaInserir = (itens || []).map(item => ({
        pedido_id: newPedido.id,
        produto_nome: item.produto_nome,
        quantidade: item.quantidade,
        tempo_unitario: item.tempo_unitario,
        valor_unitario: item.valor_unitario,
        observacoes: item.observacoes || null,
        fraction_count: Math.max(1, item.fraction_count || 1),
      }));

      if (itensParaInserir.length > 0) {
        const { error: itensError } = await supabase
          .from('itens_pedido')
          .insert(itensParaInserir);

        if (itensError) {
          // Rollback: deletar pedido
          await supabase.from('pedidos').delete().eq('id', pedidoId);
          toast.error('❌ Falha ao salvar itens — pedido revertido', { description: itensError.message });
          setSalvando(false);
          return;
        }
      }

      // 3. Aprovar + Gerar OPs
      const approvalItens: PedidoStepperItem[] = (itens || []).map(item => ({
        produto_nome: item.produto_nome,
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        tempo_unitario: item.tempo_unitario,
        valor_unitario: item.valor_unitario,
        observacoes: item.observacoes,
        fraction_count: item.fraction_count,
      }));

      const result = await aprovarPedido(newPedido.id, approvalItens);

      if (result.error) {
        // Rollback: deletar itens + pedido
        await supabase.from('itens_pedido').delete().eq('pedido_id', pedidoId);
        await supabase.from('pedidos').delete().eq('id', pedidoId);
        toast.error('❌ Falha ao gerar OPs — pedido revertido', { description: result.error });
        setSalvando(false);
        return;
      }

      toast.success(
        `✅ Pedido aprovado! OPs: ${result.familiaNumero}`,
        { description: `Prazo calculado: ${result.prazoEntrega ? new Date(result.prazoEntrega).toLocaleDateString('pt-BR') : '—'}` }
      );
    } catch (e: any) {
      // Rollback em caso de exceção
      if (pedidoId) {
        await supabase.from('itens_pedido').delete().eq('pedido_id', pedidoId);
        await supabase.from('pedidos').delete().eq('id', pedidoId);
      }
      toast.error('❌ Erro inesperado — pedido revertido', { description: e.message });
    }

    setSalvando(false);
    await loadPedidos();
  };

  // Aprovação removida — ocorre automaticamente no salvar

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="Total Pedidos" value={totalPedidos} subtitle="Em carteira" icon={<FileText className="h-5 w-5" />} variant="civ" />
        <KPICard title="Valor Total" value={`R$ ${(valorTotal / 1000).toFixed(0)}k`} subtitle="Carteira ativa" icon={<BarChart3 className="h-5 w-5" />} variant="civ" />
        <KPICard title="Em Produção" value={emProducao} subtitle="Com OP" icon={<Package className="h-5 w-5" />} variant="civ" />
        <KPICard title="Aguardando" value={aguardando} subtitle="Sem OP" icon={<Clock className="h-5 w-5" />} variant="civ" />
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar pedido, cliente ou produto..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Button size="sm" className="bg-success hover:bg-success/90" onClick={handleNewPedido}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Pedido
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/30 bg-card/80 overflow-hidden">
        <ScrollArea className="max-h-[500px]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-secondary/30 sticky top-0 z-10">
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Nº Pedido</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Cliente</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium hidden md:table-cell">Produto(s)</th>
                  <th className="text-center py-3 px-4 text-muted-foreground font-medium hidden lg:table-cell">Qtd</th>
                  <th className="text-center py-3 px-4 text-muted-foreground font-medium hidden lg:table-cell">Prazo</th>
                  <th className="text-center py-3 px-4 text-muted-foreground font-medium">OP</th>
                  <th className="text-center py-3 px-4 text-muted-foreground font-medium">Status</th>
                  <th className="text-right py-3 px-4 text-muted-foreground font-medium hidden md:table-cell">Valor</th>
                  <th className="text-center py-3 px-4 text-muted-foreground font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} className="py-8 text-center text-muted-foreground">Carregando...</td></tr>
                ) : filteredPedidos.length === 0 ? (
                  <tr><td colSpan={9} className="py-8 text-center text-muted-foreground">Nenhum pedido encontrado</td></tr>
                ) : (
                  filteredPedidos.map((pedido) => {
                    const config = statusConfig[pedido.status] || statusConfig.aguardando;
                    const StatusIcon = config.icon;
                    return (
                      <tr key={pedido.id} className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                        <td className="py-3 px-4 font-mono font-medium text-foreground">{pedido.codigo}</td>
                        <td className="py-3 px-4 text-foreground">{pedido.cliente}</td>
                        <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">{pedido.produto}</td>
                        <td className="py-3 px-4 text-center text-foreground hidden lg:table-cell">{pedido.quantidade}</td>
                        <td className="py-3 px-4 text-center text-muted-foreground hidden lg:table-cell">
                          {pedido.prazoEntrega ? new Date(pedido.prazoEntrega).toLocaleDateString('pt-BR') : '—'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {pedido.op ? (
                            <span className="font-mono text-xs bg-cip/20 text-cip px-2 py-1 rounded">{pedido.op}</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge className={cn('text-xs gap-1', config.color)}>
                            <StatusIcon className="h-3 w-3" />
                            <span className="hidden sm:inline">{config.label}</span>
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right text-foreground hidden md:table-cell">
                          R$ {pedido.valorTotal.toLocaleString('pt-BR')}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" title="Imprimir Pedido" onClick={() => imprimirPedido(pedido.id)}>
                              <Printer className="h-4 w-4" />
                            </Button>
                            {pedido.status !== 'cancelado' && pedido.status !== 'finalizado' && (
                              <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive hover:bg-destructive/10" onClick={async () => {
                                const result = await anularPedido(pedido.id);
                                if (result.error) {
                                  toast.error(result.error);
                                } else {
                                  toast.success('Pedido anulado com sucesso');
                                  await loadPedidos();
                                }
                              }}>
                                <Ban className="h-3 w-3 mr-1" />
                                Anular
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={async () => {
                              if (pedido.op) {
                                const check = await verificarEdicaoPedido(pedido.id);
                                if (!check.podeEditar) {
                                  toast.error(check.motivo || 'Edição bloqueada');
                                  return;
                                }
                              }
                              setEditingPedido(pedido);
                              setStepperOpen(true);
                            }}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </ScrollArea>
      </div>

      {/* Stepper */}
      <CIVCadastroPedidoStepper
        open={stepperOpen}
        onOpenChange={setStepperOpen}
        pedido={editingPedido ? {
          id: editingPedido.id,
          codigo: editingPedido.codigo,
          cliente: editingPedido.cliente,
          produto: editingPedido.produto,
          quantidade: editingPedido.quantidade,
          canal: editingPedido.canal,
          margem: editingPedido.margem,
          valorTotal: editingPedido.valorTotal,
          dataEntrada: editingPedido.dataEntrada,
          prazoEntrega: editingPedido.prazoEntrega,
          status: editingPedido.status,
          op: editingPedido.op,
        } : null}
        onSave={handleSavePedido}
      />

    </div>
  );
}
