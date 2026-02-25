import { useState, useEffect, useMemo } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  AlertTriangle, Check, ChevronLeft, ChevronRight,
  ShieldAlert, ShieldCheck, Package, Calendar, User, Plus, Trash2, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { fetchConfigCapacidade, calcularDataEntrega, calcularDiasProducao } from '@/services/capacidadeService';

// Step 3 component with real-time prazo calculation
function Step3Prazo({ cargaTotalHoras, clienteBloqueado, codigoManual, clienteNome, canal, itens, totalOPs, valorTotal, observacoesGerais, getPreviewOPMask }: {
  cargaTotalHoras: number; clienteBloqueado: boolean; codigoManual: string; clienteNome: string; canal: string;
  itens: ItemForm[]; totalOPs: number; valorTotal: number; observacoesGerais: string; getPreviewOPMask: (seq: number) => string;
}) {
  const [prazoData, setPrazoData] = useState<string>('Calculando...');
  const [prazoDias, setPrazoDias] = useState<number>(0);
  const [loadingPrazo, setLoadingPrazo] = useState(true);

  useEffect(() => {
    const calc = async () => {
      setLoadingPrazo(true);
      try {
        const config = await fetchConfigCapacidade();
        // Load current wallet hours
        const { data: carteira } = await supabase.from('carteira_producao').select('total_horas_acumuladas').limit(1).maybeSingle();
        const horasCarteira = Number(carteira?.total_horas_acumuladas) || 0;
        const totalHoras = horasCarteira + cargaTotalHoras;
        const dias = calcularDiasProducao(totalHoras, config.capacidade_produtiva_diaria);
        const dataEntrega = calcularDataEntrega(new Date(), dias, config.considerar_sabado);
        setPrazoDias(dias);
        setPrazoData(dataEntrega.toLocaleDateString('pt-BR'));
      } catch {
        setPrazoData('Erro no cálculo');
      }
      setLoadingPrazo(false);
    };
    calc();
  }, [cargaTotalHoras]);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="p-4 rounded-lg bg-civ/10 border border-civ/30">
        <div className="flex items-center gap-4">
          <Calendar className="h-8 w-8 text-civ flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-civ">Prazo Calculado</p>
            {loadingPrazo ? (
              <div className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /><span className="text-sm">Calculando prazo...</span></div>
            ) : (
              <>
                <p className="text-2xl font-bold text-foreground">{prazoData}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {prazoDias} dias úteis | Carga deste pedido: {cargaTotalHoras.toFixed(1)}h
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {clienteBloqueado && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-destructive">Cliente BLOQUEADO — Pedido não pode ser confirmado</p>
            <p className="text-xs text-muted-foreground">Regularize a situação financeira antes de prosseguir.</p>
          </div>
        </div>
      )}

      <div className="p-4 rounded-lg bg-secondary/30 border border-border/30">
        <p className="text-sm font-semibold mb-3">Resumo — {codigoManual}</p>
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
            <span className="text-muted-foreground text-xs block">
              {itens.filter(i => i.produtoNome).length} produto(s) → {totalOPs} OP(s)
            </span>
            <div className="mt-1 space-y-1">
              {(() => {
                let seq = 0;
                return itens.filter(i => i.produtoNome).map((item, idx) => {
                  const fractions = Math.max(1, item.fractionCount);
                  const masks: string[] = [];
                  for (let f = 0; f < fractions; f++) {
                    seq++;
                    masks.push(getPreviewOPMask(seq));
                  }
                  const qty = typeof item.quantidade === 'number' ? item.quantidade : 0;
                  return (
                    <div key={idx} className="flex items-center gap-2 text-xs flex-wrap">
                      {masks.map((m, mi) => (
                        <Badge key={mi} variant="outline" className="font-mono text-[10px]">{m}</Badge>
                      ))}
                      <span>{item.produtoNome}</span>
                      <span className="text-muted-foreground">× {qty}</span>
                      {item.observacoes && <span className="text-warning text-[10px]">📝 obs</span>}
                    </div>
                  );
                });
              })()}
            </div>
          </div>
          {observacoesGerais && (
            <div className="col-span-2">
              <span className="text-muted-foreground text-xs block">Observações Gerais</span>
              <span className="text-xs italic text-foreground">{observacoesGerais}</span>
            </div>
          )}
          <div>
            <span className="text-muted-foreground text-xs block">Valor Total</span>
            <span className="font-bold text-foreground">R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
          <div>
            <span className="text-muted-foreground text-xs block">Carga Total</span>
            <span className="font-medium">{cargaTotalHoras.toFixed(1)}h</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export interface PedidoStepperItem {
  produto_nome: string;
  produto_id?: string;
  quantidade: number;
  tempo_unitario: number;
  valor_unitario: number;
  observacoes?: string;
  fraction_count?: number;
}

export interface PedidoStepperResult {
  codigo: string;
  cliente: string;
  canal: string;
  margem: number;
  dataEntrada: string;
  itens: PedidoStepperItem[];
}

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
  produtoId: string;
  produtoNome: string;
  tempoUnitario: number;
  precoBase: number;
  precoFinal: number;
  precoManualOverride: boolean;
  quantidade: number | '';
  observacoes: string;
  fractionCount: number;
}

interface ProdutoDB {
  id: string;
  nome: string;
  tempo_unitario: number;
  preco_base: number;
  percentual_juros: number;
  unidade: string;
  descricao: string | null;
  ativo: boolean;
}

interface ClienteDB {
  id: string;
  nome: string;
  status_financeiro: string;
  cidade: string | null;
  estado: string | null;
}

const steps = [
  { number: 1, title: 'Cliente / Canal', icon: User },
  { number: 2, title: 'Produtos / Itens', icon: Package },
  { number: 3, title: 'Prazo e Confirmação', icon: Calendar },
];

const emptyItem = (): ItemForm => ({
  produtoId: '', produtoNome: '', tempoUnitario: 0, precoBase: 0, precoFinal: 0, precoManualOverride: false, quantidade: '', observacoes: '', fractionCount: 1
});

export function CIVCadastroPedidoStepper({ open, onOpenChange, pedido, onSave }: StepperProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [clienteId, setClienteId] = useState('');
  const [clienteNome, setClienteNome] = useState('');
  const [canal, setCanal] = useState('');
  const [margem, setMargem] = useState<number | ''>('');
  const [codigoManual, setCodigoManual] = useState('');
  const [observacoesGerais, setObservacoesGerais] = useState('');
  const [itens, setItens] = useState<ItemForm[]>([emptyItem()]);

  // Dados reais do banco
  const [produtos, setProdutos] = useState<ProdutoDB[]>([]);
  const [clientes, setClientes] = useState<ClienteDB[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [loadingItens, setLoadingItens] = useState(false);

  // Se o pedido já tem OP, bloqueia edição de itens
  const isLocked = !!(pedido?.op);

  const margemNum = typeof margem === 'number' ? margem : 0;

  // Carregar produtos e clientes do banco
  useEffect(() => {
    if (open) {
      loadMasterData();
    }
  }, [open]);

  const loadMasterData = async () => {
    setLoadingData(true);
    const [prodRes, cliRes] = await Promise.all([
      supabase.from('produtos').select('id, nome, tempo_unitario, preco_base, percentual_juros, unidade, descricao, ativo').eq('ativo', true).order('nome'),
      supabase.from('clientes').select('id, nome, status_financeiro, cidade, estado').eq('ativo', true).order('nome'),
    ]);
    if (prodRes.data) setProdutos((prodRes.data || []).map((d: any) => ({ ...d, percentual_juros: Number(d.percentual_juros) || 0 })));
    if (cliRes.data) setClientes(cliRes.data);
    setLoadingData(false);
  };

  // Load existing itens when editing
  const loadPedidoItens = async (pedidoId: string) => {
    setLoadingItens(true);
    const { data: itensDB } = await supabase
      .from('itens_pedido')
      .select('*')
      .eq('pedido_id', pedidoId)
      .order('created_at');

    if (itensDB && itensDB.length > 0) {
      const loaded: ItemForm[] = itensDB.map(i => ({
        produtoId: i.produto_id || '',
        produtoNome: i.produto_nome,
        tempoUnitario: Number(i.tempo_unitario),
        precoBase: Number(i.valor_unitario), // stored price
        precoFinal: Number(i.valor_unitario),
        precoManualOverride: false,
        quantidade: i.quantidade,
        observacoes: i.observacoes || '',
        fractionCount: (i as any).fraction_count || 1,
      }));

      // Try to load actual preco_base from produtos table
      const prodIds = loaded.filter(l => l.produtoId).map(l => l.produtoId);
      if (prodIds.length > 0) {
        const { data: prodsData } = await supabase
          .from('produtos')
          .select('id, preco_base')
          .in('id', prodIds);
        if (prodsData) {
          const pbMap = new Map(prodsData.map(p => [p.id, Number(p.preco_base)]));
          loaded.forEach(item => {
            if (item.produtoId && pbMap.has(item.produtoId)) {
              item.precoBase = pbMap.get(item.produtoId)!;
            }
          });
        }
      }

      setItens(loaded);
    }
    setLoadingItens(false);
  };

  useEffect(() => {
    if (open) {
      if (pedido) {
        setClienteNome(pedido.cliente);
        setClienteId('');
        setCanal(pedido.canal);
        setMargem(pedido.margem || '');
        setCodigoManual(pedido.codigo || '');
        // Load observações from DB
        if (pedido.id) {
          supabase.from('pedidos').select('observacoes').eq('id', pedido.id).single().then(({ data }) => {
            setObservacoesGerais(data?.observacoes || '');
          });
        } else {
          setObservacoesGerais('');
        }
        // Load real itens from DB
        if (pedido.id) {
          loadPedidoItens(pedido.id);
        } else {
          setItens([{ ...emptyItem(), produtoNome: pedido.produto, quantidade: pedido.quantidade }]);
        }
      } else {
        resetForm();
        generateNextCodigo();
      }
      setCurrentStep(1);
    }
  }, [open, pedido]);

  const resetForm = () => {
    setClienteId('');
    setClienteNome('');
    setCanal('');
    setMargem('');
    setCodigoManual('');
    setObservacoesGerais('');
    setItens([emptyItem()]);
  };

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
    () => clientes.find(c => c.id === clienteId || c.nome === clienteNome),
    [clientes, clienteId, clienteNome]
  );

  const totalOPs = useMemo(() => {
    return itens.reduce((sum, item) => sum + Math.max(1, item.fractionCount), 0);
  }, [itens]);

  const valorTotal = useMemo(() => {
    return itens.reduce((sum, item) => {
      const qty = typeof item.quantidade === 'number' ? item.quantidade : 0;
      return sum + (item.precoFinal * qty);
    }, 0);
  }, [itens]);

  const cargaTotalHoras = useMemo(() => {
    return itens.reduce((sum, item) => {
      const qty = typeof item.quantidade === 'number' ? item.quantidade : 0;
      return sum + (item.tempoUnitario * qty);
    }, 0);
  }, [itens]);

  // Recalculate all non-overridden prices when margin changes
  useEffect(() => {
    setItens(prev => prev.map(item => {
      if (item.precoManualOverride || !item.produtoId) return item;
      const prod = produtos.find(p => p.id === item.produtoId);
      const juros = prod?.percentual_juros || 0;
      const pf = item.precoBase * (1 + juros / 100) * (1 + margemNum / 100);
      return { ...item, precoFinal: Math.round(pf * 100) / 100 };
    }));
  }, [margemNum, produtos]);

  const getPreviewOPMask = (globalSeq: number) => {
    if (totalOPs === 1) return codigoManual;
    const suffix = String.fromCharCode(64 + globalSeq);
    return `${codigoManual}-${suffix}`;
  };

  const canProceedStep1 = clienteNome && canal && codigoManual;
  const canProceedStep2 = itens.length > 0 && itens.every(i => i.produtoNome && (typeof i.quantidade === 'number' && i.quantidade > 0));
  const clienteBloqueado = selectedCliente?.status_financeiro === 'BLOQUEADO';

  const addItem = () => {
    if (isLocked) return;
    setItens([...itens, emptyItem()]);
  };

  const removeItem = (idx: number) => {
    if (isLocked || itens.length <= 1) return;
    setItens(itens.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: keyof ItemForm, value: any) => {
    if (isLocked) return;
    const updated = [...itens];
    (updated[idx] as any)[field] = value;
    if (field === 'precoFinal') {
      updated[idx].precoManualOverride = true;
    }
    setItens(updated);
  };

  const selectProduto = (idx: number, produtoId: string) => {
    if (isLocked) return;
    const prod = produtos.find(p => p.id === produtoId);
    if (!prod) return;
    const pb = Number(prod.preco_base) || 0;
    const juros = prod.percentual_juros || 0;
    // Formula: preco_final = preco_base × (1 + percentual_juros/100) × (1 + margem/100)
    const pf = pb * (1 + juros / 100) * (1 + margemNum / 100);
    const updated = [...itens];
    updated[idx] = {
      ...updated[idx],
      produtoId: prod.id,
      produtoNome: prod.nome,
      tempoUnitario: Number(prod.tempo_unitario),
      precoBase: pb,
      precoFinal: Math.round(pf * 100) / 100,
      precoManualOverride: false,
      quantidade: updated[idx].quantidade || '',
    };
    setItens(updated);
  };

  const handleSave = () => {
    if (!clienteNome || !codigoManual) return;

    const stepperItens: PedidoStepperItem[] = itens
      .filter(i => i.produtoNome)
      .map(i => ({
        produto_nome: i.produtoNome,
        produto_id: i.produtoId || undefined,
        quantidade: typeof i.quantidade === 'number' ? i.quantidade : 0,
        tempo_unitario: i.tempoUnitario,
        valor_unitario: i.precoFinal,
        observacoes: i.observacoes || undefined,
        fraction_count: Math.max(1, i.fractionCount),
      }));

    onSave({
      codigo: codigoManual,
      cliente: clienteNome,
      produto: stepperItens.length === 1 ? stepperItens[0].produto_nome : `${stepperItens.length} produtos`,
      quantidade: stepperItens.reduce((s, i) => s + i.quantidade, 0),
      canal,
      margem: margemNum,
      valorTotal,
      prazoEntrega: '',
      dataEntrada: new Date().toISOString().split('T')[0],
      status: 'aguardando',
      observacoesGerais,
    } as any, stepperItens);

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {pedido ? `Editar Pedido — ${pedido.codigo}` : 'Novo Pedido — Cadastro'}
            {isLocked && <Badge variant="outline" className="text-warning border-warning/30">🔒 BLOQUEADO</Badge>}
          </DialogTitle>
          <DialogDescription>
            {isLocked
              ? 'Pedido já possui OPs geradas. Edição de itens bloqueada.'
              : pedido ? 'Edite os dados do pedido selecionado' : 'Preencha os dados em 3 etapas. Cada produto gerará OPs independentes.'
            }
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
                  {currentStep > step.number ? <Check className="h-5 w-5" /> : <step.icon className="h-5 w-5" />}
                </div>
                <span className={cn('text-xs mt-1.5 font-medium whitespace-nowrap', currentStep === step.number ? 'text-civ' : 'text-muted-foreground')}>
                  {step.title}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={cn('w-12 sm:w-16 h-0.5 mx-1 sm:mx-2 mb-6', currentStep > step.number ? 'bg-success' : 'bg-border')} />
              )}
            </div>
          ))}
        </div>

        {(loadingData || loadingItens) && (
          <div className="flex items-center justify-center py-4 gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Carregando dados...</span>
          </div>
        )}

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
                  disabled={isLocked}
                />
                <p className="text-xs text-muted-foreground mt-1">Gerado automaticamente, mas pode ser editado.</p>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Cliente *</label>
                {clientes.length > 0 ? (
                  <Select
                    value={clienteId}
                    onValueChange={(val) => {
                      setClienteId(val);
                      const c = clientes.find(c => c.id === val);
                      if (c) setClienteNome(c.nome);
                    }}
                    disabled={isLocked}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecione o cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          <span className="flex items-center gap-2">
                            {c.nome}
                            {c.status_financeiro === 'BLOQUEADO' && <ShieldAlert className="h-3 w-3 text-destructive" />}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={clienteNome}
                    onChange={(e) => setClienteNome(e.target.value)}
                    placeholder="Nome do cliente"
                    className="mt-1"
                    disabled={isLocked}
                  />
                )}
                {clientes.length === 0 && !loadingData && (
                  <p className="text-xs text-warning mt-1">⚠ Nenhum cliente cadastrado. Cadastre clientes no sistema primeiro, ou digite o nome.</p>
                )}
              </div>

              {selectedCliente && (
                <div className={cn(
                  'p-4 rounded-lg border flex items-start gap-3',
                  selectedCliente.status_financeiro === 'LIBERADO'
                    ? 'bg-success/10 border-success/30'
                    : 'bg-destructive/10 border-destructive/30'
                )}>
                  {selectedCliente.status_financeiro === 'LIBERADO' ? (
                    <ShieldCheck className="h-6 w-6 text-success flex-shrink-0 mt-0.5" />
                  ) : (
                    <ShieldAlert className="h-6 w-6 text-destructive flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <Badge className={cn(
                      'text-xs font-semibold',
                      selectedCliente.status_financeiro === 'LIBERADO'
                        ? 'bg-success/20 text-success border-success/30'
                        : 'bg-destructive/20 text-destructive border-destructive/30'
                    )}>
                      {selectedCliente.status_financeiro === 'LIBERADO' ? '✓ LIBERADO' : '✕ BLOQUEADO'}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedCliente.cidade}{selectedCliente.estado ? `/${selectedCliente.estado}` : ''}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-foreground">Canal de Venda *</label>
                <Select value={canal} onValueChange={setCanal} disabled={isLocked}>
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

              <div>
                <label className="text-sm font-medium text-foreground">Margem (%)</label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={0.01}
                  value={margem}
                  onChange={(e) => setMargem(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Ex: 15"
                  className="mt-1"
                  disabled={isLocked}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Observações Gerais do Pedido</label>
                <Textarea
                  value={observacoesGerais}
                  onChange={(e) => setObservacoesGerais(e.target.value)}
                  placeholder="Observações gerais que serão herdadas pelas OPs..."
                  className="mt-1 resize-none"
                  rows={3}
                  disabled={isLocked}
                />
              </div>
            </div>
          )}

          {/* ─── STEP 2: Múltiplos Produtos ─── */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-foreground">Itens do Pedido</label>
                {!isLocked && (
                  <Button variant="outline" size="sm" onClick={addItem}>
                    <Plus className="h-3 w-3 mr-1" /> Adicionar Produto
                  </Button>
                )}
              </div>

              {produtos.length === 0 && !loadingData && (
                <div className="p-3 rounded-lg bg-warning/10 border border-warning/30 text-sm text-warning">
                  ⚠ Nenhum produto cadastrado no CIP. Cadastre produtos primeiro.
                </div>
              )}

              {(() => {
                let globalSeq = 0;
                return itens.map((item, idx) => {
                  const fractions = Math.max(1, item.fractionCount);
                  const opsForItem: string[] = [];
                  for (let f = 0; f < fractions; f++) {
                    globalSeq++;
                    opsForItem.push(getPreviewOPMask(globalSeq));
                  }
                  const qty = typeof item.quantidade === 'number' ? item.quantidade : 0;

                  return (
                    <div key={idx} className="p-3 rounded-lg bg-secondary/20 border border-border/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-muted-foreground">Item {idx + 1}</span>
                        {!isLocked && itens.length > 1 && (
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeItem(idx)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                        <div className="sm:col-span-2">
                          <label className="text-[10px] text-muted-foreground">Produto *</label>
                          {produtos.length > 0 ? (
                            <Select
                              value={item.produtoId}
                              onValueChange={(val) => selectProduto(idx, val)}
                              disabled={isLocked}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="Selecione o produto" />
                              </SelectTrigger>
                              <SelectContent>
                                {produtos.map((p) => (
                                  <SelectItem key={p.id} value={p.id}>
                                    {p.nome} {p.preco_base > 0 ? `(R$ ${Number(p.preco_base).toFixed(2)})` : ''}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              value={item.produtoNome}
                              onChange={(e) => updateItem(idx, 'produtoNome', e.target.value)}
                              placeholder="Nome do produto"
                              className="h-8 text-xs"
                              disabled={isLocked}
                            />
                          )}
                        </div>
                        <div>
                          <label className="text-[10px] text-muted-foreground">Quantidade *</label>
                          <Input
                            type="number"
                            min={1}
                            value={item.quantidade}
                            onChange={(e) => updateItem(idx, 'quantidade', e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value) || 0))}
                            placeholder="0"
                            className="h-8 text-xs"
                            disabled={isLocked}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-muted-foreground">Frações (OPs)</label>
                          <Input
                            type="number"
                            min={1}
                            max={qty || 1}
                            value={item.fractionCount}
                            onChange={(e) => updateItem(idx, 'fractionCount', Math.max(1, parseInt(e.target.value) || 1))}
                            className="h-8 text-xs"
                            disabled={isLocked}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] text-muted-foreground">RTC - Tempo Unit. (h)</label>
                          <Input
                            type="number"
                            min={0}
                            step={0.1}
                            value={item.tempoUnitario || ''}
                            className="h-8 text-xs bg-muted/50"
                            disabled
                            title="Vem do cadastro do produto"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-muted-foreground">Preço Base (R$)</label>
                          <Input
                            type="number"
                            min={0}
                            step={0.01}
                            value={item.precoBase || ''}
                            className="h-8 text-xs bg-muted/50"
                            disabled
                            title="Vem do cadastro do produto"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-muted-foreground">
                            Preço Final (R$) {item.precoManualOverride && <span className="text-warning">✏️</span>}
                          </label>
                          <Input
                            type="number"
                            min={0}
                            step={0.01}
                            value={item.precoFinal || ''}
                            onChange={(e) => updateItem(idx, 'precoFinal', parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                            className="h-8 text-xs"
                            disabled={isLocked}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground">Observação do Item (herdada pela OP)</label>
                        <Input
                          value={item.observacoes}
                          onChange={(e) => updateItem(idx, 'observacoes', e.target.value)}
                          placeholder="Especificações técnicas, detalhes..."
                          className="h-8 text-xs"
                          disabled={isLocked}
                        />
                      </div>
                      {item.produtoNome && qty > 0 && (
                        <div className="space-y-1">
                          <div className="flex gap-4 text-xs text-muted-foreground">
                            <span>Subtotal: R$ {(item.precoFinal * qty).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            <span>Carga: {(item.tempoUnitario * qty).toFixed(1)}h</span>
                            {margemNum > 0 && !item.precoManualOverride && <span className="text-success">Margem {margemNum}% aplicada</span>}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {opsForItem.map((mask, fi) => (
                              <Badge key={fi} variant="outline" className="font-mono text-[10px]">{mask}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                });
              })()}

              <div className="p-3 rounded-lg bg-civ/10 border border-civ/30 flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Valor Total:</span>
                <span className="text-lg font-bold text-foreground">R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>

              <div className="p-3 rounded-lg bg-secondary/30 border border-border/30 text-xs text-muted-foreground">
                <strong>{itens.filter(i => i.produtoNome).length}</strong> produto(s) → <strong>{totalOPs}</strong> OP(s) | Carga: <strong>{cargaTotalHoras.toFixed(1)}h</strong>
              </div>
            </div>
          )}

          {/* ─── STEP 3: Prazo e Confirmação ─── */}
          {currentStep === 3 && (
            <Step3Prazo
              cargaTotalHoras={cargaTotalHoras}
              clienteBloqueado={clienteBloqueado}
              codigoManual={codigoManual}
              clienteNome={clienteNome}
              canal={canal}
              itens={itens}
              totalOPs={totalOPs}
              valorTotal={valorTotal}
              observacoesGerais={observacoesGerais}
              getPreviewOPMask={getPreviewOPMask}
            />
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
              disabled={clienteBloqueado || isLocked}
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
