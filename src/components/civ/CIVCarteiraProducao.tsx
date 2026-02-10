import { useState, useEffect } from 'react';
import { 
  Search, Filter, Plus, Edit, Eye, Package, FileText, 
  Truck, QrCode, BarChart3,
  CheckCircle2, Clock, AlertTriangle, Calendar, ChevronDown, ChevronUp
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { KPICard } from '@/components/ui/KPICard';
import { ModuleCard } from '@/components/ui/ModuleCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CIVCadastroPedidoStepper, type PedidoStepper } from './CIVCadastroPedidoStepper';
import { toast } from 'sonner';
import { fetchPedidos, insertPedido, updatePedido, type PedidoDB } from '@/services/pedidoService';

// Tipos
interface Pedido {
  id: string;
  codigo: string;
  cliente: string;
  produto: string;
  quantidade: number;
  dataEntrada: string;
  prazoEntrega: string;
  status: 'aguardando' | 'programado' | 'em_producao' | 'produzido' | 'expedido' | 'faturado';
  valorTotal: number;
  op?: string;
  margem: number;
  canal: string;
}

interface OP {
  id: string;
  codigo: string;
  pedidoId: string;
  produto: string;
  quantidade: number;
  dataInicio: string;
  previsaoFim: string;
  status: 'aguardando' | 'em_processo' | 'concluido';
  progresso: number;
  qrCode?: string;
}

// Dados mock
const pedidosMock: Pedido[] = [
  { id: '1', codigo: 'PED-2001', cliente: 'Móveis Silva', produto: 'Sofá 3 Lugares Retrátil', quantidade: 5, dataEntrada: '2025-02-01', prazoEntrega: '2025-02-15', status: 'em_producao', valorTotal: 12500, op: 'OP-0501', margem: 28, canal: 'B2B' },
  { id: '2', codigo: 'PED-2002', cliente: 'Loja do Conforto', produto: 'Sofá Canto 5 Lugares', quantidade: 2, dataEntrada: '2025-01-28', prazoEntrega: '2025-02-10', status: 'produzido', valorTotal: 8900, op: 'OP-0502', margem: 32, canal: 'Varejo' },
  { id: '3', codigo: 'PED-2003', cliente: 'Decor House', produto: 'Poltrona Decorativa', quantidade: 10, dataEntrada: '2025-02-02', prazoEntrega: '2025-02-20', status: 'programado', valorTotal: 15000, op: 'OP-0503', margem: 25, canal: 'Digital' },
  { id: '4', codigo: 'PED-2004', cliente: 'Casa & Estilo', produto: 'Sofá 2 Lugares Fixo', quantidade: 8, dataEntrada: '2025-01-25', prazoEntrega: '2025-02-05', status: 'expedido', valorTotal: 11200, op: 'OP-0504', margem: 30, canal: 'B2B' },
  { id: '5', codigo: 'PED-2005', cliente: 'Móveis Paraná', produto: 'Cadeira Bergamo', quantidade: 50, dataEntrada: '2025-02-03', prazoEntrega: '2025-02-25', status: 'aguardando', valorTotal: 25000, margem: 35, canal: 'Projeto' },
  { id: '6', codigo: 'PED-2006', cliente: 'Design Interior', produto: 'Mesa Florença', quantidade: 20, dataEntrada: '2025-02-03', prazoEntrega: '2025-02-18', status: 'faturado', valorTotal: 8500, op: 'OP-0506', margem: 22, canal: 'Varejo' },
];

const opsMock: OP[] = [
  { id: '1', codigo: 'OP-0501', pedidoId: '1', produto: 'Sofá 3 Lugares Retrátil', quantidade: 5, dataInicio: '2025-02-02', previsaoFim: '2025-02-12', status: 'em_processo', progresso: 65, qrCode: 'QR-0501' },
  { id: '2', codigo: 'OP-0502', pedidoId: '2', produto: 'Sofá Canto 5 Lugares', quantidade: 2, dataInicio: '2025-01-30', previsaoFim: '2025-02-08', status: 'concluido', progresso: 100, qrCode: 'QR-0502' },
  { id: '3', codigo: 'OP-0503', pedidoId: '3', produto: 'Poltrona Decorativa', quantidade: 10, dataInicio: '2025-02-05', previsaoFim: '2025-02-18', status: 'aguardando', progresso: 0, qrCode: 'QR-0503' },
];

const statusConfig = {
  aguardando: { label: 'Aguardando', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: Clock },
  programado: { label: 'Programado', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: Calendar },
  em_producao: { label: 'Em Produção', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: Package },
  produzido: { label: 'Produzido', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle2 },
  expedido: { label: 'Expedido', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', icon: Truck },
  faturado: { label: 'Faturado', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: FileText },
};

const opStatusConfig = {
  aguardando: { label: 'Aguardando', color: 'bg-gray-500/20 text-gray-400' },
  em_processo: { label: 'Em Processo', color: 'bg-orange-500/20 text-orange-400' },
  concluido: { label: 'Concluído', color: 'bg-green-500/20 text-green-400' },
};

export function CIVCarteiraProducao() {
  const [search, setSearch] = useState('');
  const [pedidos, setPedidos] = useState<Pedido[]>(pedidosMock);
  const [ops] = useState<OP[]>(opsMock);
  const [stepperOpen, setStepperOpen] = useState(false);
  const [editingPedido, setEditingPedido] = useState<Pedido | null>(null);
  const [showBaixaOPs, setShowBaixaOPs] = useState(false);
  const [loading, setLoading] = useState(true);

  // Carregar pedidos do banco ao montar
  useEffect(() => {
    loadPedidos();
  }, []);

  const loadPedidos = async () => {
    setLoading(true);
    const { data, error } = await fetchPedidos();
    if (error) {
      console.error('[CIV] Erro ao carregar pedidos:', error);
      toast.error('Erro ao carregar pedidos do banco', { description: error });
      // Manter mock como fallback
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
        status: d.status as Pedido['status'],
        valorTotal: Number(d.valor_total),
        op: d.op || undefined,
        margem: Number(d.margem),
        canal: d.canal,
      }));
      setPedidos(mapped);
    }
    // Se não há dados no banco, manter mock
    setLoading(false);
  };

  const filteredPedidos = pedidos.filter(p => 
    p.codigo.toLowerCase().includes(search.toLowerCase()) ||
    p.cliente.toLowerCase().includes(search.toLowerCase()) ||
    p.produto.toLowerCase().includes(search.toLowerCase())
  );

  // KPIs
  const totalPedidos = pedidos.length;
  const valorTotal = pedidos.reduce((acc, p) => acc + p.valorTotal, 0);
  const emProducao = pedidos.filter(p => p.status === 'em_producao').length;
  const aguardando = pedidos.filter(p => p.status === 'aguardando').length;

  // Handlers do stepper
  const handleNewPedido = () => {
    setEditingPedido(null);
    setStepperOpen(true);
  };

  const handleEditPedido = (pedido: Pedido) => {
    setEditingPedido(pedido);
    setStepperOpen(true);
  };

  const handleSavePedido = async (data: Partial<PedidoStepper>) => {
    if (editingPedido) {
      // Atualizar no banco
      const { data: updated, error } = await updatePedido(editingPedido.id, {
        cliente: data.cliente,
        produto: data.produto,
        quantidade: data.quantidade,
        canal: data.canal,
        margem: data.margem,
        valor_total: data.valorTotal,
        prazo_entrega: data.prazoEntrega || null,
        status: data.status || editingPedido.status,
      });
      if (error) {
        toast.error('❌ Falha ao atualizar pedido', { description: error });
        return;
      }
      toast.success('✅ Pedido atualizado com sucesso', { description: `${updated?.codigo} persistido no banco` });
      await loadPedidos();
    } else {
      // Inserir no banco
      const newCodigo = `PED-${String(Date.now()).slice(-4)}`;
      const { data: inserted, error } = await insertPedido({
        codigo: newCodigo,
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
      if (error) {
        toast.error('❌ Falha ao criar pedido', { description: error });
        return;
      }
      toast.success('✅ Pedido criado com sucesso', { description: `${inserted?.codigo} salvo no banco` });
      await loadPedidos();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          title="Total Pedidos"
          value={totalPedidos}
          subtitle="Em carteira"
          icon={<FileText className="h-5 w-5" />}
          variant="civ"
        />
        <KPICard
          title="Valor Total"
          value={`R$ ${(valorTotal / 1000).toFixed(0)}k`}
          subtitle="Carteira ativa"
          icon={<BarChart3 className="h-5 w-5" />}
          trend="up"
          trendValue="+15%"
          variant="civ"
        />
        <KPICard
          title="Em Produção"
          value={emProducao}
          subtitle="Com OP ativa"
          icon={<Package className="h-5 w-5" />}
          variant="civ"
        />
        <KPICard
          title="Aguardando"
          value={aguardando}
          subtitle="Sem OP"
          icon={<Clock className="h-5 w-5" />}
          trend="down"
          trendValue="-2"
          variant="civ"
        />
      </div>

      {/* Header: busca + ações */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar pedido, cliente ou produto..."
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
          <Button size="sm" className="bg-civ hover:bg-civ/90" onClick={handleNewPedido}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Pedido
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBaixaOPs(!showBaixaOPs)}
            className="gap-2"
          >
            {showBaixaOPs ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            <span className="hidden sm:inline">Baixas & OPs</span>
          </Button>
        </div>
      </div>

      {/* Alerta de prazo */}
      <div className="p-3 rounded-lg bg-warning/10 border border-warning/30">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
          <p className="text-sm text-warning font-medium">
            Consultar Simulação de Prazo antes de confirmar a venda. O prazo é calculado automaticamente no cadastro.
          </p>
        </div>
      </div>

      {/* Tabela de Pedidos */}
      <div className="rounded-xl border border-border/30 bg-card/80 overflow-hidden">
        <ScrollArea className="max-h-[500px]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-secondary/30 sticky top-0 z-10">
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Código</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Cliente</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium hidden md:table-cell">Produto</th>
                  <th className="text-center py-3 px-4 text-muted-foreground font-medium hidden lg:table-cell">Qtd</th>
                  <th className="text-center py-3 px-4 text-muted-foreground font-medium hidden lg:table-cell">Prazo</th>
                  <th className="text-center py-3 px-4 text-muted-foreground font-medium">OP</th>
                  <th className="text-center py-3 px-4 text-muted-foreground font-medium">Status</th>
                  <th className="text-right py-3 px-4 text-muted-foreground font-medium hidden md:table-cell">Valor</th>
                  <th className="text-center py-3 px-4 text-muted-foreground font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredPedidos.map((pedido) => {
                  const StatusIcon = statusConfig[pedido.status].icon;
                  return (
                    <tr key={pedido.id} className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-foreground">{pedido.codigo}</td>
                      <td className="py-3 px-4 text-foreground">{pedido.cliente}</td>
                      <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">{pedido.produto}</td>
                      <td className="py-3 px-4 text-center text-foreground hidden lg:table-cell">{pedido.quantidade}</td>
                      <td className="py-3 px-4 text-center text-muted-foreground hidden lg:table-cell">
                        {new Date(pedido.prazoEntrega).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {pedido.op ? (
                          <span className="font-mono text-xs bg-cip/20 text-cip px-2 py-1 rounded">
                            {pedido.op}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge className={cn('text-xs gap-1', statusConfig[pedido.status].color)}>
                          <StatusIcon className="h-3 w-3" />
                          <span className="hidden sm:inline">{statusConfig[pedido.status].label}</span>
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right text-foreground hidden md:table-cell">
                        R$ {pedido.valorTotal.toLocaleString('pt-BR')}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditPedido(pedido)} title="Visualizar">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditPedido(pedido)} title="Editar pedido">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </ScrollArea>
      </div>

      {/* Seção colapsável: Baixas & OPs */}
      {showBaixaOPs && (
        <div className="space-y-4 animate-fade-in">
          {/* Pedidos Prontos para Expedição */}
          <ModuleCard title="Pedidos Produzidos — Prontos para Expedição" variant="civ">
            <div className="space-y-3">
              {pedidos.filter(p => p.status === 'produzido').map((pedido) => (
                <div key={pedido.id} className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border/30">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <CheckCircle2 className="h-6 w-6 text-green-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold">{pedido.codigo}</span>
                        {pedido.op && (
                          <span className="text-xs bg-cip/20 text-cip px-2 py-0.5 rounded">{pedido.op}</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{pedido.cliente} • {pedido.produto}</p>
                      <p className="text-xs text-muted-foreground">Qtd: {pedido.quantidade} | R$ {pedido.valorTotal.toLocaleString('pt-BR')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="gap-2">
                      <QrCode className="h-4 w-4" />
                      <span className="hidden sm:inline">Scanner</span>
                    </Button>
                    <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700 gap-2">
                      <Truck className="h-4 w-4" />
                      <span className="hidden sm:inline">Expedir</span>
                    </Button>
                  </div>
                </div>
              ))}

              {pedidos.filter(p => p.status === 'produzido').length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum pedido pronto para expedição</p>
                </div>
              )}
            </div>
          </ModuleCard>

          {/* OPs vinculadas */}
          <ModuleCard title="Ordens de Produção (OPs)" variant="civ">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">OP</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Produto</th>
                    <th className="text-center py-3 px-4 text-muted-foreground font-medium">Qtd</th>
                    <th className="text-center py-3 px-4 text-muted-foreground font-medium">Progresso</th>
                    <th className="text-center py-3 px-4 text-muted-foreground font-medium">Status</th>
                    <th className="text-center py-3 px-4 text-muted-foreground font-medium">QR</th>
                  </tr>
                </thead>
                <tbody>
                  {ops.map((op) => (
                    <tr key={op.id} className="border-b border-border/30 hover:bg-secondary/30">
                      <td className="py-3 px-4 font-mono font-medium">{op.codigo}</td>
                      <td className="py-3 px-4">{op.produto}</td>
                      <td className="py-3 px-4 text-center">{op.quantidade}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-civ rounded-full transition-all"
                              style={{ width: `${op.progresso}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium">{op.progresso}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge className={opStatusConfig[op.status].color}>
                          {opStatusConfig[op.status].label}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <QrCode className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ModuleCard>
        </div>
      )}

      {/* Stepper de Cadastro de Pedido */}
      <CIVCadastroPedidoStepper
        open={stepperOpen}
        onOpenChange={setStepperOpen}
        pedido={editingPedido}
        onSave={handleSavePedido}
      />
    </div>
  );
}
