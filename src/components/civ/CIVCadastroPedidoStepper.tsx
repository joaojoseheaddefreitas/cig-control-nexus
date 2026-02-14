import { useState, useEffect, useMemo } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  AlertTriangle, Check, ChevronLeft, ChevronRight,
  ShieldAlert, ShieldCheck, Package, Calendar, User, Plus, Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { produtosVenda } from '@/data/civData';
import {
  getMateriaisPorProduto, verificarAlertasMateriais,
  clientesFinanceiro, type Material
} from '@/data/cicData';
import { supabase } from '@/integrations/supabase/client';

export interface PedidoStepperItem {
  produto_nome: string;
  produto_id?: string;
  quantidade: number;
  tempo_unitario: number;
  valor_unitario: number;
  observacoes?: string;
}

export interface PedidoStepperResult {
  codigo: string;
  cliente: string;
  canal: string;
  margem: number;
  dataEntrada: string;
  itens: PedidoStepperItem[];
}

// Keep backward-compat export
export interface PedidoStepper {
  id?: string;
  codigo?: string;
  cliente: string;
  produto: string;
  quantidade: number;
  canal: string;
  margem: number;
  valorTotal: number;
  dataEntrada: string;
  prazoEntrega: string;
  status: string;
  op?: string;
}

interface StepperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pedido?: PedidoStepper | null;
  onSave: (data: Partial<PedidoStepper>, itens?: PedidoStepperItem[]) => void;
}

interface ItemForm {
  produtoCodigo: string;
  quantidade: number;
  observacoes: string;
}

const steps = [
  { number: 1, title: 'Cliente / Canal', icon: User },
  { number: 2, title: 'Produtos / Itens', icon: Package },
  { number: 3, title: 'Prazo e Confirmação', icon: Calendar },
];

const HORAS_POR_DIA = 8;
const DIAS_EXTRA_FALTA_MATERIAL = 5;

export function CIVCadastroPedidoStepper({ open, onOpenChange, pedido, onSave }: StepperProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [clienteNome, setClienteNome] = useState('');
  const [canal, setCanal] = useState('');
  const [margem, setMargem] = useState(0);
  const [codigoManual, setCodigoManual] = useState('');
  const [itens, setItens] = useState<ItemForm[]>([{ produtoCodigo: '', quantidade: 1, observacoes: '' }]);

  useEffect(() => {
    if (open) {
      if (pedido) {
        setClienteNome(pedido.cliente);
        setCanal(pedido.canal);
        setMargem(pedido.margem);
        setCodigoManual(pedido.codigo || '');
        // For editing, pre-fill single item (legacy)
        const prod = produtosVenda.find(p => p.nome === pedido.produto);
        setItens([{ produtoCodigo: prod?.codigo || '', quantidade: pedido.quantidade, observacoes: '' }]);
      } else {
        setClienteNome('');
        setCanal('');
        setMargem(0);
        setCodigoManual('');
        setItens([{ produtoCodigo: '', quantidade: 1, observacoes: '' }]);
        generateNextCodigo();
      }
      setCurrentStep(1);
    }
  }, [open, pedido]);

  const generateNextCodigo = async () => {
    const { data } = await supabase
      .from('pedidos')
      .select('codigo')
      .order('created_at', { ascending: false })
      .limit(1);
    if (data && data.length > 0) {
      const last = data[0].codigo;
      const num = parseInt(last.replace(/\D/g, '')) || 0;
      setCodigoManual(String(num + 1));
    } else {
      setCodigoManual('1001');
    }
  };

  const selectedCliente = useMemo(
    () => clientesFinanceiro.find(c => c.clienteNome === clienteNome),
    [clienteNome]
  );

  const resolvedItens = useMemo(() => {
    return itens.map(item => ({
      ...item,
      produto: produtosVenda.find(p => p.codigo === item.produtoCodigo),
    }));
  }, [itens]);

  const hasMaterialShortage = useMemo(() => {
    return itens.some(item => {
      if (!item.produtoCodigo) return false;
      const { temFalta } = verificarAlertasMateriais(item.produtoCodigo);
      return temFalta;
    });
  }, [itens]);

  const valorTotal = useMemo(() => {
    return resolvedItens.reduce((sum, item) => {
      return sum + (item.produto ? item.produto.precoBase * item.quantidade : 0);
    }, 0);
  }, [resolvedItens]);

  const cargaTotalHoras = useMemo(() => {
    return resolvedItens.reduce((sum, item) => {
      return sum + (item.produto ? item.produto.tempoProducao * item.quantidade : 0);
    }, 0);
  }, [resolvedItens]);

  const leadTimeDays = Math.ceil(cargaTotalHoras / HORAS_POR_DIA);

  const deliveryDate = useMemo(() => {
    if (cargaTotalHoras <= 0) return null;
    const today = new Date();
    const extraDays = hasMaterialShortage ? DIAS_EXTRA_FALTA_MATERIAL : 0;
    const totalDays = leadTimeDays + extraDays;
    const date = new Date(today);
    date.setDate(date.getDate() + totalDays);
    return date;
  }, [leadTimeDays, hasMaterialShortage, cargaTotalHoras]);

  const canProceedStep1 = clienteNome && canal && codigoManual;
  const canProceedStep2 = itens.length > 0 && itens.every(i => i.produtoCodigo && i.quantidade > 0);
  const canProceedStep3 = selectedCliente?.statusFinanceiro !== 'bloqueado';

  const addItem = () => {
    setItens([...itens, { produtoCodigo: '', quantidade: 1, observacoes: '' }]);
  };

  const removeItem = (idx: number) => {
    if (itens.length <= 1) return;
    setItens(itens.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: keyof ItemForm, value: any) => {
    const updated = [...itens];
    (updated[idx] as any)[field] = value;
    setItens(updated);
  };

  const handleSave = () => {
    if (!clienteNome || !codigoManual) return;

    const stepperItens: PedidoStepperItem[] = resolvedItens
      .filter(i => i.produto)
      .map(i => ({
        produto_nome: i.produto!.nome,
        quantidade: i.quantidade,
        tempo_unitario: i.produto!.tempoProducao,
        valor_unitario: i.produto!.precoBase,
        observacoes: i.observacoes || undefined,
      }));

    const firstProd = resolvedItens.find(i => i.produto);

    onSave({
      codigo: codigoManual,
      cliente: clienteNome,
      produto: stepperItens.length === 1 ? stepperItens[0].produto_nome : `${stepperItens.length} produtos`,
      quantidade: stepperItens.reduce((s, i) => s + i.quantidade, 0),
      canal,
      margem,
      valorTotal,
      prazoEntrega: deliveryDate ? deliveryDate.toISOString().split('T')[0] : '',
      dataEntrada: new Date().toISOString().split('T')[0],
      status: 'aguardando',
    }, stepperItens);

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {pedido ? `Editar Pedido — ${pedido.codigo}` : 'Novo Pedido — Cadastro'}
          </DialogTitle>
          <DialogDescription>
            {pedido ? 'Edite os dados do pedido selecionado' : 'Preencha os dados do pedido em 3 etapas. Cada produto gerará 1 OP independente.'}
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-0 py-4">
          {steps.map((step, i) => (
            <div key={step.number} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all',
                  currentStep === step.number
                    ? 'bg-civ border-civ text-civ-foreground'
                    : currentStep > step.number
                      ? 'bg-success/20 border-success text-success'
                      : 'bg-secondary border-border text-muted-foreground'
                )}>
                  {currentStep > step.number ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                </div>
                <span className={cn(
                  'text-xs mt-1.5 font-medium whitespace-nowrap',
                  currentStep === step.number ? 'text-civ' : 'text-muted-foreground'
                )}>
                  {step.title}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={cn(
                  'w-12 sm:w-16 h-0.5 mx-1 sm:mx-2 mb-6',
                  currentStep > step.number ? 'bg-success' : 'bg-border'
                )} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="min-h-[300px]">

          {/* ─── STEP 1: Cliente / Canal / Código ─── */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="text-sm font-medium text-foreground">Nº Pedido Interno *</label>
                <Input
                  value={codigoManual}
                  onChange={(e) => setCodigoManual(e.target.value)}
                  placeholder="Ex: 1025"
                  className="mt-1 font-mono"
                />
                <p className="text-xs text-muted-foreground mt-1">Gerado automaticamente, mas pode ser editado.</p>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Cliente *</label>
                <Select value={clienteNome} onValueChange={setClienteNome}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientesFinanceiro.map((c) => (
                      <SelectItem key={c.clienteNome} value={c.clienteNome}>
                        <span className="flex items-center gap-2">
                          {c.clienteNome}
                          {c.statusFinanceiro === 'bloqueado' && <ShieldAlert className="h-3 w-3 text-destructive" />}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedCliente && (
                <div className={cn(
                  'p-4 rounded-lg border flex items-start gap-3',
                  selectedCliente.statusFinanceiro === 'liberado'
                    ? 'bg-success/10 border-success/30'
                    : 'bg-destructive/10 border-destructive/30'
                )}>
                  {selectedCliente.statusFinanceiro === 'liberado' ? (
                    <ShieldCheck className="h-6 w-6 text-success flex-shrink-0 mt-0.5" />
                  ) : (
                    <ShieldAlert className="h-6 w-6 text-destructive flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <Badge className={cn(
                      'text-xs font-semibold',
                      selectedCliente.statusFinanceiro === 'liberado'
                        ? 'bg-success/20 text-success border-success/30'
                        : 'bg-destructive/20 text-destructive border-destructive/30'
                    )}>
                      {selectedCliente.statusFinanceiro === 'liberado' ? '✓ LIBERADO' : '✕ BLOQUEADO'}
                    </Badge>
                    {selectedCliente.statusFinanceiro === 'bloqueado' && (
                      <p className="text-xs text-destructive mt-1 font-medium">{selectedCliente.motivoBloqueio}</p>
                    )}
                    <div className="text-xs text-muted-foreground mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                      <span>Limite: R$ {selectedCliente.limiteCredito.toLocaleString('pt-BR')}</span>
                      <span>Devedor: R$ {selectedCliente.saldoDevedor.toLocaleString('pt-BR')}</span>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-foreground">Canal de Venda *</label>
                <Select value={canal} onValueChange={setCanal}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione o canal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="B2B">B2B</SelectItem>
                    <SelectItem value="Varejo">Varejo</SelectItem>
                    <SelectItem value="Digital">Digital</SelectItem>
                    <SelectItem value="Projeto">Projeto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* ─── STEP 2: Múltiplos Produtos ─── */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-foreground">Itens do Pedido</label>
                <Button variant="outline" size="sm" onClick={addItem}>
                  <Plus className="h-3 w-3 mr-1" /> Adicionar Produto
                </Button>
              </div>

              {itens.map((item, idx) => {
                const prod = produtosVenda.find(p => p.codigo === item.produtoCodigo);
                return (
                  <div key={idx} className="p-3 rounded-lg bg-secondary/20 border border-border/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-muted-foreground">Item {idx + 1}</span>
                      {itens.length > 1 && (
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeItem(idx)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="sm:col-span-2">
                        <label className="text-[10px] text-muted-foreground">Produto *</label>
                        <Select
                          value={item.produtoCodigo}
                          onValueChange={(val) => updateItem(idx, 'produtoCodigo', val)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {produtosVenda.filter(p => p.ativo).map((p) => (
                              <SelectItem key={p.codigo} value={p.codigo}>
                                {p.codigo} — {p.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground">Quantidade *</label>
                        <Input
                          type="number"
                          min={1}
                          value={item.quantidade}
                          onChange={(e) => updateItem(idx, 'quantidade', Math.max(1, parseInt(e.target.value) || 1))}
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                    {prod && (
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>Preço: R$ {(prod.precoBase * item.quantidade).toLocaleString('pt-BR')}</span>
                        <span>Tempo: {(prod.tempoProducao * item.quantidade).toFixed(1)}h</span>
                        <span className="text-foreground font-medium">→ OP {codigoManual}-{String(idx + 1).padStart(2, '0')}</span>
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="p-3 rounded-lg bg-civ/10 border border-civ/30 flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Valor Total:</span>
                <span className="text-lg font-bold text-foreground">R$ {valorTotal.toLocaleString('pt-BR')}</span>
              </div>

              <div className="p-3 rounded-lg bg-secondary/30 border border-border/30 text-xs text-muted-foreground">
                <strong>{itens.filter(i => i.produtoCodigo).length}</strong> produto(s) → <strong>{itens.filter(i => i.produtoCodigo).length}</strong> OP(s) independentes | Carga total: <strong>{cargaTotalHoras.toFixed(1)}h</strong>
              </div>
            </div>
          )}

          {/* ─── STEP 3: Prazo e Confirmação ─── */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-lg bg-civ/10 border border-civ/30">
                <div className="flex items-center gap-4">
                  <Calendar className="h-8 w-8 text-civ flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-civ">Data de Entrega Estimada</p>
                    <p className="text-2xl font-bold text-foreground">
                      {deliveryDate ? deliveryDate.toLocaleDateString('pt-BR') : '—'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Hoje + {leadTimeDays} dias (lead time)
                      {hasMaterialShortage && (
                        <span className="text-warning font-medium"> + 5 dias (falta de material)</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {selectedCliente?.statusFinanceiro === 'bloqueado' && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-start gap-3">
                  <ShieldAlert className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-destructive">Cliente BLOQUEADO — Pedido não pode ser confirmado</p>
                    <p className="text-xs text-muted-foreground">{selectedCliente.motivoBloqueio}</p>
                  </div>
                </div>
              )}

              <div className="p-4 rounded-lg bg-secondary/30 border border-border/30">
                <p className="text-sm font-semibold mb-3">Resumo do Pedido — {codigoManual}</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground text-xs block">Cliente</span>
                    <span className="font-medium">{clienteNome}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs block">Canal</span>
                    <span className="font-medium">{canal}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground text-xs block">Itens ({resolvedItens.filter(i => i.produto).length} produtos)</span>
                    <div className="mt-1 space-y-1">
                      {resolvedItens.filter(i => i.produto).map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs">
                          <Badge variant="outline" className="font-mono text-[10px]">{codigoManual}-{String(idx + 1).padStart(2, '0')}</Badge>
                          <span>{item.produto!.nome}</span>
                          <span className="text-muted-foreground">× {item.quantidade}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs block">Valor Total</span>
                    <span className="font-bold text-foreground">R$ {valorTotal.toLocaleString('pt-BR')}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs block">Carga</span>
                    <span className="font-medium">{cargaTotalHoras.toFixed(1)}h</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-border/30">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Voltar
          </Button>

          {currentStep < 3 ? (
            <Button
              onClick={() => setCurrentStep(prev => prev + 1)}
              disabled={
                (currentStep === 1 && !canProceedStep1) ||
                (currentStep === 2 && !canProceedStep2)
              }
              className="bg-civ hover:bg-civ/90 gap-2"
            >
              Próximo
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSave}
              disabled={!canProceedStep3}
              className="bg-success hover:bg-success/90 gap-2"
            >
              <Check className="h-4 w-4" />
              {pedido ? 'Salvar Alterações' : 'Confirmar Pedido'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
