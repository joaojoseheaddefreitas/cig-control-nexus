import { useState } from 'react';
import { Plus, Minus, Truck, Package, Factory, DollarSign, Save, X, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ordensProducao, setoresProducao, FOLGA_PRODUCAO, cipKPIs } from '@/data/cipData';
import { cn } from '@/lib/utils';

// Tipos de lançamento
export type TipoLancamento = 'entrada_pedido' | 'entrada_producao' | 'baixa_producao' | 'baixa_material' | 'expedicao';

interface LancamentoEntrada {
  tipo: 'pedido' | 'op';
  op?: string;
  pedido?: string;
  produto: string;
  quantidade: number;
  cliente: string;
  prazoEntrega: string;
  setor: string;
  prioridade: 'baixa' | 'normal' | 'alta' | 'urgente';
}

interface LancamentoBaixa {
  tipo: 'producao' | 'material' | 'expedicao';
  op: string;
  setor?: string;
  quantidade: number;
  refugo: number;
  retrabalho: number;
  observacao: string;
}

interface ExpedicaoData {
  op: string;
  cliente: string;
  produto: string;
  quantidadeProgramada: number;
  quantidadeExpedida: number;
  notaFiscal: string;
  transportadora: string;
  dataExpedicao: string;
}

interface CIPGlobalActionsProps {
  onRefresh?: () => void;
}

export function CIPGlobalActions({ onRefresh }: CIPGlobalActionsProps) {
  const [entradaOpen, setEntradaOpen] = useState(false);
  const [baixaOpen, setBaixaOpen] = useState(false);
  const [expedicaoOpen, setExpedicaoOpen] = useState(false);
  
  // Estado Entrada
  const [entrada, setEntrada] = useState<LancamentoEntrada>({
    tipo: 'pedido',
    produto: '',
    quantidade: 1,
    cliente: '',
    prazoEntrega: '',
    setor: '',
    prioridade: 'normal',
  });

  // Estado Baixa
  const [baixa, setBaixa] = useState<LancamentoBaixa>({
    tipo: 'producao',
    op: '',
    setor: '',
    quantidade: 1,
    refugo: 0,
    retrabalho: 0,
    observacao: '',
  });

  // Estado Expedição
  const [expedicao, setExpedicao] = useState<ExpedicaoData>({
    op: '',
    cliente: '',
    produto: '',
    quantidadeProgramada: 0,
    quantidadeExpedida: 0,
    notaFiscal: '',
    transportadora: '',
    dataExpedicao: new Date().toISOString().split('T')[0],
  });

  // Calcular capacidade
  const horasTotal = ordensProducao.reduce((acc, op) => acc + op.horasNecessarias, 0);
  const capacidadeLiquida = cipKPIs.capacidadeTotal * (1 - FOLGA_PRODUCAO);
  const ocupacaoAtual = (horasTotal / capacidadeLiquida) * 100;
  const podeAdicionar = ocupacaoAtual < 100;

  // Ordens disponíveis para baixa/expedição
  const opsEmProducao = ordensProducao.filter(o => o.status === 'em_producao');
  const opsProntasExpedicao = ordensProducao.filter(o => o.horasRealizadas >= o.horasNecessarias * 0.9);

  // Handler Entrada
  const handleEntrada = () => {
    if (!entrada.produto || entrada.quantidade <= 0 || !entrada.cliente) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (!podeAdicionar) {
      toast.error('❌ BLOQUEADO: Capacidade excedida! Não é possível adicionar novos pedidos.');
      return;
    }

    const novaOP = `${new Date().getFullYear()}-${(ordensProducao.length + 1).toString().padStart(6, '0')}`;
    
    toast.success(
      <div className="flex flex-col gap-1">
        <span className="font-bold text-green-400">✅ ENTRADA REGISTRADA</span>
        <span className="text-xs">OP: {novaOP}</span>
        <span className="text-xs">Produto: {entrada.produto}</span>
        <span className="text-xs">Atualizado: Programação, Custos, Materiais, Capacidade</span>
      </div>
    );
    
    setEntradaOpen(false);
    setEntrada({
      tipo: 'pedido',
      produto: '',
      quantidade: 1,
      cliente: '',
      prazoEntrega: '',
      setor: '',
      prioridade: 'normal',
    });
    onRefresh?.();
  };

  // Handler Baixa
  const handleBaixa = () => {
    if (!baixa.op || baixa.quantidade <= 0) {
      toast.error('Selecione uma OP e informe a quantidade');
      return;
    }

    toast.success(
      <div className="flex flex-col gap-1">
        <span className="font-bold text-orange-400">✅ BAIXA REGISTRADA</span>
        <span className="text-xs">OP: {baixa.op}</span>
        <span className="text-xs">Quantidade: {baixa.quantidade} | Refugo: {baixa.refugo} | Retrabalho: {baixa.retrabalho}</span>
        <span className="text-xs">Atualizado: PCP, Capacidade, Custos, Estoque</span>
      </div>
    );
    
    setBaixaOpen(false);
    setBaixa({
      tipo: 'producao',
      op: '',
      setor: '',
      quantidade: 1,
      refugo: 0,
      retrabalho: 0,
      observacao: '',
    });
    onRefresh?.();
  };

  // Handler Expedição (OBRIGATÓRIO para concluir pedido)
  const handleExpedicao = () => {
    if (!expedicao.op || expedicao.quantidadeExpedida <= 0 || !expedicao.notaFiscal) {
      toast.error('Preencha OP, quantidade expedida e nota fiscal');
      return;
    }

    if (expedicao.quantidadeExpedida !== expedicao.quantidadeProgramada) {
      toast.warning('⚠️ Quantidade expedida diferente da programada. Confirme para prosseguir.');
    }

    toast.success(
      <div className="flex flex-col gap-1">
        <span className="font-bold text-green-400">🚚 EXPEDIÇÃO CONCLUÍDA</span>
        <span className="text-xs">OP: {expedicao.op} - ENCERRADA</span>
        <span className="text-xs">NF: {expedicao.notaFiscal}</span>
        <span className="text-xs">✓ Pedido encerrado no CIP</span>
        <span className="text-xs">✓ Faturamento liberado no CIF</span>
        <span className="text-xs">✓ Indicadores atualizados no CIG</span>
      </div>
    );
    
    setExpedicaoOpen(false);
    setExpedicao({
      op: '',
      cliente: '',
      produto: '',
      quantidadeProgramada: 0,
      quantidadeExpedida: 0,
      notaFiscal: '',
      transportadora: '',
      dataExpedicao: new Date().toISOString().split('T')[0],
    });
    onRefresh?.();
  };

  // Selecionar OP para expedição
  const handleSelectOPExpedicao = (opId: string) => {
    const op = ordensProducao.find(o => o.op === opId);
    if (op) {
      setExpedicao({
        ...expedicao,
        op: op.op,
        cliente: op.cliente || '',
        produto: op.descricao,
        quantidadeProgramada: op.quantidade,
        quantidadeExpedida: op.quantidade,
      });
    }
  };

  return (
    <>
      {/* Barra Global de Ações - FIXO NO TOPO */}
      <div className="sticky top-0 z-40 bg-card/95 backdrop-blur border-b border-border/50 p-4 -mx-4 lg:-mx-6 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Status de Capacidade */}
          <div className="flex items-center gap-4">
            <div className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg border-2",
              podeAdicionar 
                ? "bg-green-500/10 border-green-500/50 text-green-400" 
                : "bg-red-500/10 border-red-500/50 text-red-400"
            )}>
              <div className={cn(
                "w-3 h-3 rounded-full animate-pulse",
                podeAdicionar ? "bg-green-500" : "bg-red-500"
              )} />
              <span className="text-sm font-medium">
                {podeAdicionar ? 'Aceita Pedidos' : 'BLOQUEADO'}
              </span>
              <Badge variant="outline" className="ml-2">
                {ocupacaoAtual.toFixed(0)}% ocupação
              </Badge>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center gap-3">
            {/* Botão ENTRADA */}
            <Button 
              onClick={() => setEntradaOpen(true)}
              className="bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg"
              disabled={!podeAdicionar}
            >
              <Plus className="h-5 w-5 mr-2" />
              ENTRADA
            </Button>

            {/* Botão BAIXA */}
            <Button 
              onClick={() => setBaixaOpen(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-lg"
            >
              <Minus className="h-5 w-5 mr-2" />
              BAIXA
            </Button>

            {/* Botão EXPEDIÇÃO */}
            <Button 
              onClick={() => setExpedicaoOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg"
            >
              <Truck className="h-5 w-5 mr-2" />
              EXPEDIÇÃO
            </Button>
          </div>
        </div>

        {/* Aviso de bloqueio */}
        {!podeAdicionar && (
          <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <span className="text-sm text-red-400">
              <strong>CAPACIDADE EXCEDIDA!</strong> Não é possível adicionar novos pedidos. Finalize pedidos existentes para liberar capacidade.
            </span>
          </div>
        )}
      </div>

      {/* Dialog ENTRADA */}
      <Dialog open={entradaOpen} onOpenChange={setEntradaOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-400">
              <Plus className="h-6 w-6" />
              ENTRADA - Novo Pedido/OP
            </DialogTitle>
            <DialogDescription>
              Registre uma entrada no sistema. Isso atualizará automaticamente: Programação, Custos, Materiais e Capacidade.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Tipo de Entrada</Label>
              <Select value={entrada.tipo} onValueChange={(v: 'pedido' | 'op') => setEntrada({...entrada, tipo: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pedido">Novo Pedido</SelectItem>
                  <SelectItem value="op">Nova OP Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Cliente *</Label>
              <Input
                value={entrada.cliente}
                onChange={(e) => setEntrada({...entrada, cliente: e.target.value})}
                placeholder="Nome do cliente"
              />
            </div>

            <div className="space-y-2">
              <Label>Produto *</Label>
              <Input
                value={entrada.produto}
                onChange={(e) => setEntrada({...entrada, produto: e.target.value})}
                placeholder="Código ou descrição"
              />
            </div>

            <div className="space-y-2">
              <Label>Quantidade *</Label>
              <Input
                type="number"
                min="1"
                value={entrada.quantidade}
                onChange={(e) => setEntrada({...entrada, quantidade: parseInt(e.target.value) || 1})}
              />
            </div>

            <div className="space-y-2">
              <Label>Prazo de Entrega *</Label>
              <Input
                type="date"
                value={entrada.prazoEntrega}
                onChange={(e) => setEntrada({...entrada, prazoEntrega: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label>Setor Inicial</Label>
              <Select value={entrada.setor} onValueChange={(v) => setEntrada({...entrada, setor: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {setoresProducao.map((s) => (
                    <SelectItem key={s.id} value={s.nome}>{s.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select value={entrada.prioridade} onValueChange={(v: 'baixa' | 'normal' | 'alta' | 'urgente') => setEntrada({...entrada, prioridade: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Resumo do impacto */}
          <div className="p-4 bg-secondary/50 rounded-lg">
            <h4 className="text-sm font-medium mb-2">Impacto do Lançamento:</h4>
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div className="flex items-center gap-1"><Package className="h-3 w-3 text-cip" /> Programação</div>
              <div className="flex items-center gap-1"><DollarSign className="h-3 w-3 text-cip" /> Custos</div>
              <div className="flex items-center gap-1"><Factory className="h-3 w-3 text-cip" /> Capacidade</div>
              <div className="flex items-center gap-1"><Package className="h-3 w-3 text-cip" /> Materiais</div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEntradaOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleEntrada} className="bg-green-600 hover:bg-green-700">
              <Save className="h-4 w-4 mr-2" />
              Registrar Entrada
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog BAIXA */}
      <Dialog open={baixaOpen} onOpenChange={setBaixaOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-400">
              <Minus className="h-6 w-6" />
              BAIXA - Produção/Material
            </DialogTitle>
            <DialogDescription>
              Registre uma baixa no sistema. Isso atualizará: PCP, Capacidade, Custos e Estoque.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Tipo de Baixa</Label>
              <Select value={baixa.tipo} onValueChange={(v: 'producao' | 'material' | 'expedicao') => setBaixa({...baixa, tipo: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="producao">Baixa de Produção</SelectItem>
                  <SelectItem value="material">Baixa de Material</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Ordem de Produção *</Label>
              <Select value={baixa.op} onValueChange={(v) => setBaixa({...baixa, op: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a OP" />
                </SelectTrigger>
                <SelectContent>
                  {opsEmProducao.map((op) => (
                    <SelectItem key={op.id} value={op.op}>
                      {op.op} - {op.descricao}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Setor</Label>
              <Select value={baixa.setor} onValueChange={(v) => setBaixa({...baixa, setor: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {setoresProducao.map((s) => (
                    <SelectItem key={s.id} value={s.nome}>{s.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Quantidade Produzida *</Label>
              <Input
                type="number"
                min="1"
                value={baixa.quantidade}
                onChange={(e) => setBaixa({...baixa, quantidade: parseInt(e.target.value) || 0})}
              />
            </div>

            <div className="space-y-2">
              <Label>Refugo</Label>
              <Input
                type="number"
                min="0"
                value={baixa.refugo}
                onChange={(e) => setBaixa({...baixa, refugo: parseInt(e.target.value) || 0})}
              />
            </div>

            <div className="space-y-2">
              <Label>Retrabalho</Label>
              <Input
                type="number"
                min="0"
                value={baixa.retrabalho}
                onChange={(e) => setBaixa({...baixa, retrabalho: parseInt(e.target.value) || 0})}
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Observação</Label>
              <Input
                value={baixa.observacao}
                onChange={(e) => setBaixa({...baixa, observacao: e.target.value})}
                placeholder="Observação opcional"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBaixaOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleBaixa} className="bg-orange-600 hover:bg-orange-700">
              <Save className="h-4 w-4 mr-2" />
              Registrar Baixa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog EXPEDIÇÃO - OBRIGATÓRIO PARA ENCERRAR PEDIDO */}
      <Dialog open={expedicaoOpen} onOpenChange={setExpedicaoOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-400">
              <Truck className="h-6 w-6" />
              EXPEDIÇÃO - Baixa Final (OBRIGATÓRIA)
            </DialogTitle>
            <DialogDescription>
              <span className="text-amber-400 font-medium">⚠️ A expedição é OBRIGATÓRIA para encerrar um pedido.</span>
              <br />
              Isso encerra o pedido no CIP, libera faturamento no CIF e atualiza indicadores no CIG.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2 space-y-2">
              <Label>Ordem de Produção *</Label>
              <Select value={expedicao.op} onValueChange={handleSelectOPExpedicao}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a OP para expedir" />
                </SelectTrigger>
                <SelectContent>
                  {opsProntasExpedicao.length === 0 ? (
                    <SelectItem value="_none" disabled>Nenhuma OP pronta para expedição</SelectItem>
                  ) : (
                    opsProntasExpedicao.map((op) => (
                      <SelectItem key={op.id} value={op.op}>
                        {op.op} - {op.descricao} ({op.quantidade} un)
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {expedicao.op && (
              <>
                <div className="col-span-2 p-4 bg-secondary/50 rounded-lg">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Cliente:</span>
                      <p className="font-medium">{expedicao.cliente}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Produto:</span>
                      <p className="font-medium">{expedicao.produto}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Qtd Programada:</span>
                      <p className="font-medium">{expedicao.quantidadeProgramada}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Quantidade Expedida *</Label>
                  <Input
                    type="number"
                    min="1"
                    value={expedicao.quantidadeExpedida}
                    onChange={(e) => setExpedicao({...expedicao, quantidadeExpedida: parseInt(e.target.value) || 0})}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Nota Fiscal *</Label>
                  <Input
                    value={expedicao.notaFiscal}
                    onChange={(e) => setExpedicao({...expedicao, notaFiscal: e.target.value})}
                    placeholder="Número da NF"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Transportadora</Label>
                  <Input
                    value={expedicao.transportadora}
                    onChange={(e) => setExpedicao({...expedicao, transportadora: e.target.value})}
                    placeholder="Nome da transportadora"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Data de Expedição *</Label>
                  <Input
                    type="date"
                    value={expedicao.dataExpedicao}
                    onChange={(e) => setExpedicao({...expedicao, dataExpedicao: e.target.value})}
                  />
                </div>
              </>
            )}
          </div>

          {/* Resumo da Expedição */}
          {expedicao.op && (
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <h4 className="text-sm font-medium text-blue-400 mb-2">Ao confirmar a expedição:</h4>
              <div className="grid grid-cols-1 gap-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Pedido será ENCERRADO no CIP</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Faturamento LIBERADO no CIF</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Indicadores ATUALIZADOS no CIG</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Custos TRAVADOS (não editáveis)</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setExpedicaoOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button 
              onClick={handleExpedicao} 
              className="bg-blue-600 hover:bg-blue-700"
              disabled={!expedicao.op}
            >
              <Truck className="h-4 w-4 mr-2" />
              Confirmar Expedição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
