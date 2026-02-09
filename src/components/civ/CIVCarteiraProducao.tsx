import { useState } from 'react';
import { 
  Search, Filter, Plus, Edit, Trash2, Eye, Package, FileText, 
  ArrowUpCircle, ArrowDownCircle, Truck, QrCode, BarChart3,
  CheckCircle2, Clock, AlertTriangle, Calendar
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { KPICard } from '@/components/ui/KPICard';
import { ModuleCard } from '@/components/ui/ModuleCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';

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
  const [pedidos] = useState<Pedido[]>(pedidosMock);
  const [ops] = useState<OP[]>(opsMock);
  const [activeTab, setActiveTab] = useState('carteira');
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);

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

      {/* Tabs principais */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full max-w-lg">
          <TabsTrigger value="carteira" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Carteira</span>
          </TabsTrigger>
          <TabsTrigger value="entrada" className="gap-2">
            <ArrowUpCircle className="h-4 w-4 text-green-400" />
            <span className="hidden sm:inline">Entrada</span>
          </TabsTrigger>
          <TabsTrigger value="baixa" className="gap-2">
            <ArrowDownCircle className="h-4 w-4 text-orange-400" />
            <span className="hidden sm:inline">Baixa</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab Carteira */}
        <TabsContent value="carteira" className="space-y-4">
          {/* Header */}
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
              <Button size="sm" className="bg-civ hover:bg-civ/90">
                <Plus className="h-4 w-4 mr-2" />
                Novo Pedido
              </Button>
            </div>
          </div>

          {/* Tabela de Pedidos */}
          <div className="rounded-xl border border-border/30 bg-card/80 overflow-hidden max-h-[500px]">
            <ScrollArea className="h-full">
              <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 bg-secondary/30">
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
                <tbody className="max-h-[400px]">
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
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedPedido(pedido)}>
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
        </TabsContent>

        {/* Tab Entrada */}
        <TabsContent value="entrada" className="space-y-4">
          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
            <div className="flex items-start gap-3">
              <ArrowUpCircle className="h-6 w-6 text-green-400 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-green-400">Entrada de Pedidos</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Cadastre novos pedidos na carteira. A entrada gera automaticamente a programação e pode vincular uma OP para produção.
                </p>
              </div>
            </div>
          </div>

      {/* Alerta de Prazo */}
          <div className="p-3 rounded-lg bg-warning/10 border border-warning/30">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
              <p className="text-sm text-warning font-medium">
                Consultar Simulação de Prazo antes de confirmar a venda.
              </p>
            </div>
          </div>

          <ModuleCard title="Novo Pedido" variant="civ">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">Cliente</label>
                <Input placeholder="Selecione o cliente" className="mt-1" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Produto</label>
                <Input placeholder="Selecione o produto" className="mt-1" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Quantidade</label>
                <Input type="number" placeholder="0" className="mt-1" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Prazo de Entrega</label>
                <Input type="date" className="mt-1" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Canal</label>
                <Input placeholder="B2B, Varejo, Digital..." className="mt-1" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Margem (%)</label>
                <Input type="number" placeholder="0" className="mt-1" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline">Cancelar</Button>
              <Button className="bg-civ hover:bg-civ/90 gap-2">
                <Plus className="h-4 w-4" />
                Cadastrar Pedido
              </Button>
            </div>
          </ModuleCard>
        </TabsContent>

        {/* Tab Baixa */}
        <TabsContent value="baixa" className="space-y-4">
          <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/30">
            <div className="flex items-start gap-3">
              <ArrowDownCircle className="h-6 w-6 text-orange-400 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-orange-400">Baixa de Pedidos</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  A baixa ocorre via <strong>Nota Fiscal</strong> gerada pelo Financeiro e entregue pela <strong>Expedição</strong> no momento do embarque.
                </p>
              </div>
            </div>
          </div>

          {/* Pedidos prontos para baixa */}
          <ModuleCard title="Pedidos Produzidos - Prontos para Expedição" variant="civ">
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
        </TabsContent>
      </Tabs>

      {/* Modal Detalhe do Pedido */}
      <Dialog open={!!selectedPedido} onOpenChange={(open) => !open && setSelectedPedido(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-civ" />
              Detalhe do Pedido — {selectedPedido?.codigo}
            </DialogTitle>
            <DialogDescription>Informações do pedido selecionado</DialogDescription>
          </DialogHeader>
          {selectedPedido && (
            <div className="grid grid-cols-2 gap-4 pt-2 text-sm">
              <div>
                <span className="text-muted-foreground block text-xs">Código</span>
                <span className="font-mono font-semibold">{selectedPedido.codigo}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs">Cliente</span>
                <span className="font-medium">{selectedPedido.cliente}</span>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground block text-xs">Produto / Descrição</span>
                <span>{selectedPedido.produto}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs">Quantidade</span>
                <span className="font-semibold">{selectedPedido.quantidade}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs">Status</span>
                <Badge className={cn('text-xs', statusConfig[selectedPedido.status].color)}>
                  {statusConfig[selectedPedido.status].label}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs">Data do Pedido</span>
                <span>{new Date(selectedPedido.dataEntrada).toLocaleDateString('pt-BR')}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs">Data de Entrega</span>
                <span>{new Date(selectedPedido.prazoEntrega).toLocaleDateString('pt-BR')}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs">Valor Total</span>
                <span className="font-semibold">R$ {selectedPedido.valorTotal.toLocaleString('pt-BR')}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs">Canal</span>
                <span>{selectedPedido.canal}</span>
              </div>
              {selectedPedido.op && (
                <div>
                  <span className="text-muted-foreground block text-xs">OP Vinculada</span>
                  <span className="font-mono text-xs bg-cip/20 text-cip px-2 py-1 rounded">{selectedPedido.op}</span>
                </div>
              )}
              <div>
                <span className="text-muted-foreground block text-xs">Margem</span>
                <span className="font-semibold">{selectedPedido.margem}%</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
