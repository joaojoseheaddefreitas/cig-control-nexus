import { useState, useEffect } from 'react';
import { 
  Search, Plus, Edit, Eye, Package, FileText, 
  Truck, BarChart3, CheckCircle2, Clock, AlertTriangle, 
  Calendar, Check
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
import { aprovarPedido } from '@/services/aprovacaoService';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

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
  expedido: { label: 'Expedido', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', icon: Truck },
  faturado: { label: 'Faturado', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: FileText },
};

export function CIVCarteiraProducao() {
  const [search, setSearch] = useState('');
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [stepperOpen, setStepperOpen] = useState(false);
  const [editingPedido, setEditingPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Aprovação
  const [aprovacaoOpen, setAprovacaoOpen] = useState(false);
  const [pedidoParaAprovar, setPedidoParaAprovar] = useState<Pedido | null>(null);
  const [itensAprovacao, setItensAprovacao] = useState<PedidoStepperItem[]>([]);
  const [aprovando, setAprovando] = useState(false);

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
    } else {
      // Insert pedido
      const { data: newPedido, error } = await insertPedido({
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
      if (error || !newPedido) {
        toast.error('❌ Falha ao criar pedido', { description: error || 'Erro desconhecido' });
        return;
      }

      // Insert itens_pedido for each product
      if (itens && itens.length > 0) {
        const itensToInsert = itens.map(item => ({
          pedido_id: newPedido.id,
          produto_nome: item.produto_nome,
          quantidade: item.quantidade,
          tempo_unitario: item.tempo_unitario,
          valor_unitario: item.valor_unitario,
          tempo_total: item.quantidade * item.tempo_unitario,
          valor_total: item.quantidade * item.valor_unitario,
          observacoes: item.observacoes || null,
          fraction_count: Math.max(1, item.fraction_count || 1),
        }));

        const { error: itensError } = await supabase
          .from('itens_pedido')
          .insert(itensToInsert);

        if (itensError) {
          toast.error('⚠ Pedido criado mas erro ao salvar itens', { description: itensError.message });
        }
      }

      toast.success('✅ Pedido criado — Aguardando aprovação');
    }
    await loadPedidos();
  };

  // Aprovação — carrega itens existentes do pedido
  const handleIniciarAprovacao = async (pedido: Pedido) => {
    setPedidoParaAprovar(pedido);
    
    // Load existing itens_pedido
    const { data: existingItens } = await supabase
      .from('itens_pedido')
      .select('*')
      .eq('pedido_id', pedido.id);

    if (existingItens && existingItens.length > 0) {
      setItensAprovacao(existingItens.map(i => ({
        produto_nome: i.produto_nome,
        produto_id: i.produto_id || undefined,
        quantidade: i.quantidade,
        tempo_unitario: Number(i.tempo_unitario),
        valor_unitario: Number(i.valor_unitario),
      })));
    } else {
      // Fallback: use pedido's single product
      setItensAprovacao([{
        produto_nome: pedido.produto,
        quantidade: pedido.quantidade,
        tempo_unitario: 1,
        valor_unitario: pedido.valorTotal / Math.max(1, pedido.quantidade),
      }]);
    }
    setAprovacaoOpen(true);
  };

  const handleConfirmarAprovacao = async () => {
    if (!pedidoParaAprovar) return;
    setAprovando(true);

    const result = await aprovarPedido(pedidoParaAprovar.id, itensAprovacao);

    if (result.error) {
      toast.error(`❌ Erro na aprovação: ${result.error}`);
    } else {
      toast.success(
        `✅ Pedido aprovado! OPs: ${result.familiaNumero}`,
        { description: `Prazo calculado: ${result.prazoEntrega ? new Date(result.prazoEntrega).toLocaleDateString('pt-BR') : '—'}` }
      );
      setAprovacaoOpen(false);
      await loadPedidos();
    }
    setAprovando(false);
  };

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
                            {pedido.status === 'aguardando' && (
                              <Button variant="outline" size="sm" className="h-7 text-xs border-success text-success hover:bg-success/10" onClick={() => handleIniciarAprovacao(pedido)}>
                                <Check className="h-3 w-3 mr-1" />
                                Aprovar
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingPedido(pedido); setStepperOpen(true); }}>
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

      {/* Dialog de Aprovação */}
      <Dialog open={aprovacaoOpen} onOpenChange={setAprovacaoOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-success">
              <Check className="h-5 w-5" />
              Aprovar Pedido — {pedidoParaAprovar?.codigo}
            </DialogTitle>
            <DialogDescription>
              Confirme os itens abaixo. A aprovação gera 1 OP por item automaticamente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="p-3 rounded-lg bg-civ/10 border border-civ/30 text-sm">
              <p><strong>Cliente:</strong> {pedidoParaAprovar?.cliente}</p>
              <p><strong>Valor:</strong> R$ {pedidoParaAprovar?.valorTotal.toLocaleString('pt-BR')}</p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold">Itens do Pedido ({itensAprovacao.length})</Label>
              {itensAprovacao.map((item, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-secondary/20 border border-border/30 text-sm flex items-center gap-3">
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {pedidoParaAprovar?.codigo}-{String(idx + 1).padStart(2, '0')}
                  </Badge>
                  <span className="flex-1">{item.produto_nome}</span>
                  <span className="text-muted-foreground">× {item.quantidade}</span>
                  <span className="text-muted-foreground">{(item.quantidade * item.tempo_unitario).toFixed(1)}h</span>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-lg bg-success/10 border border-success/30 text-sm">
              <p className="font-bold text-success">Resumo:</p>
              <p>OPs a gerar: {itensAprovacao.length} | Carga: {itensAprovacao.reduce((s, i) => s + i.quantidade * i.tempo_unitario, 0).toFixed(1)}h</p>
              <p className="text-xs text-muted-foreground mt-1">
                O prazo será calculado com base na capacidade finita configurada.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAprovacaoOpen(false)}>Cancelar</Button>
            <Button className="bg-success hover:bg-success/90" onClick={handleConfirmarAprovacao} disabled={aprovando}>
              {aprovando ? 'Processando...' : '✅ Confirmar Aprovação'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
