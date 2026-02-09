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
  ShieldAlert, ShieldCheck, Package, Calendar, User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { produtosVenda } from '@/data/civData';
import {
  getMateriaisPorProduto, verificarAlertasMateriais,
  clientesFinanceiro, type Material
} from '@/data/cicData';

// Tipo do pedido aceito pelo stepper
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
  onSave: (data: Partial<PedidoStepper>) => void;
}

interface FormData {
  clienteNome: string;
  canal: string;
  produtoCodigo: string;
  quantidade: number;
  margem: number;
}

const steps = [
  { number: 1, title: 'Cliente / Canal', icon: User },
  { number: 2, title: 'Produtos / Qtd', icon: Package },
  { number: 3, title: 'Prazo e Estoque', icon: Calendar },
];

const HORAS_POR_DIA = 8;
const DIAS_EXTRA_FALTA_MATERIAL = 5;

export function CIVCadastroPedidoStepper({ open, onOpenChange, pedido, onSave }: StepperProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    clienteNome: '',
    canal: '',
    produtoCodigo: '',
    quantidade: 1,
    margem: 0,
  });

  // Reset ou pre-fill ao abrir
  useEffect(() => {
    if (open) {
      if (pedido) {
        const prod = produtosVenda.find(p => p.nome === pedido.produto);
        setFormData({
          clienteNome: pedido.cliente,
          canal: pedido.canal,
          produtoCodigo: prod?.codigo || '',
          quantidade: pedido.quantidade,
          margem: pedido.margem,
        });
      } else {
        setFormData({ clienteNome: '', canal: '', produtoCodigo: '', quantidade: 1, margem: 0 });
      }
      setCurrentStep(1);
    }
  }, [open, pedido]);

  // Dados derivados
  const selectedCliente = useMemo(
    () => clientesFinanceiro.find(c => c.clienteNome === formData.clienteNome),
    [formData.clienteNome]
  );

  const selectedProduto = useMemo(
    () => produtosVenda.find(p => p.codigo === formData.produtoCodigo),
    [formData.produtoCodigo]
  );

  // Verificação de materiais (conexão CIC)
  const { alertas: materialAlerts, temFalta: hasMaterialShortage } = useMemo(
    () => formData.produtoCodigo ? verificarAlertasMateriais(formData.produtoCodigo) : { alertas: [] as Material[], temFalta: false },
    [formData.produtoCodigo]
  );

  const allMaterials = useMemo(
    () => formData.produtoCodigo ? getMateriaisPorProduto(formData.produtoCodigo) : [],
    [formData.produtoCodigo]
  );

  // Cálculo de prazo de entrega
  const deliveryDate = useMemo(() => {
    if (!selectedProduto) return null;
    const today = new Date();
    const leadTimeDays = Math.ceil(selectedProduto.tempoProducao / HORAS_POR_DIA);
    const extraDays = hasMaterialShortage ? DIAS_EXTRA_FALTA_MATERIAL : 0;
    const totalDays = leadTimeDays + extraDays;
    const date = new Date(today);
    date.setDate(date.getDate() + totalDays);
    return date;
  }, [selectedProduto, hasMaterialShortage]);

  const leadTimeDays = selectedProduto ? Math.ceil(selectedProduto.tempoProducao / HORAS_POR_DIA) : 0;
  const valorTotal = selectedProduto ? selectedProduto.precoBase * formData.quantidade : 0;

  // Validações por step
  const canProceedStep1 = formData.clienteNome && formData.canal;
  const canProceedStep2 = formData.produtoCodigo && formData.quantidade > 0;

  const handleSave = () => {
    if (!selectedProduto || !formData.clienteNome) return;
    onSave({
      cliente: formData.clienteNome,
      produto: selectedProduto.nome,
      quantidade: formData.quantidade,
      canal: formData.canal,
      margem: formData.margem || selectedProduto.margem,
      valorTotal,
      prazoEntrega: deliveryDate ? deliveryDate.toISOString().split('T')[0] : '',
      dataEntrada: new Date().toISOString().split('T')[0],
      status: 'aguardando',
    });
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
            {pedido ? 'Edite os dados do pedido selecionado' : 'Preencha os dados do pedido em 3 etapas'}
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

          {/* ─── STEP 1: Cliente / Canal ─── */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="text-sm font-medium text-foreground">Cliente *</label>
                <Select
                  value={formData.clienteNome}
                  onValueChange={(val) => setFormData(prev => ({ ...prev, clienteNome: val }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientesFinanceiro.map((c) => (
                      <SelectItem key={c.clienteNome} value={c.clienteNome}>
                        <span className="flex items-center gap-2">
                          {c.clienteNome}
                          {c.statusFinanceiro === 'bloqueado' && (
                            <ShieldAlert className="h-3 w-3 text-destructive" />
                          )}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Selo Financeiro */}
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
                    <div className="flex items-center gap-2">
                      <Badge className={cn(
                        'text-xs font-semibold',
                        selectedCliente.statusFinanceiro === 'liberado'
                          ? 'bg-success/20 text-success border-success/30'
                          : 'bg-destructive/20 text-destructive border-destructive/30'
                      )}>
                        {selectedCliente.statusFinanceiro === 'liberado' ? '✓ LIBERADO' : '✕ BLOQUEADO'}
                      </Badge>
                    </div>
                    {selectedCliente.statusFinanceiro === 'bloqueado' && (
                      <p className="text-xs text-destructive mt-1 font-medium">{selectedCliente.motivoBloqueio}</p>
                    )}
                    <div className="text-xs text-muted-foreground mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                      <span>Limite: R$ {selectedCliente.limiteCredito.toLocaleString('pt-BR')}</span>
                      <span>Devedor: R$ {selectedCliente.saldoDevedor.toLocaleString('pt-BR')}</span>
                      {selectedCliente.diasAtraso > 0 && (
                        <span className="text-destructive col-span-2">Atraso: {selectedCliente.diasAtraso} dias</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-foreground">Canal de Venda *</label>
                <Select
                  value={formData.canal}
                  onValueChange={(val) => setFormData(prev => ({ ...prev, canal: val }))}
                >
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

          {/* ─── STEP 2: Produto / Quantidade ─── */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="text-sm font-medium text-foreground">Produto *</label>
                <Select
                  value={formData.produtoCodigo}
                  onValueChange={(val) => {
                    const prod = produtosVenda.find(p => p.codigo === val);
                    setFormData(prev => ({ ...prev, produtoCodigo: val, margem: prod?.margem || prev.margem }));
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione o produto" />
                  </SelectTrigger>
                  <SelectContent>
                    {produtosVenda.filter(p => p.ativo).map((p) => (
                      <SelectItem key={p.codigo} value={p.codigo}>
                        {p.codigo} — {p.nome} (R$ {p.precoBase.toLocaleString('pt-BR')})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedProduto && (
                <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-secondary/30 border border-border/30 text-sm">
                  <div>
                    <span className="text-xs text-muted-foreground block">Categoria</span>
                    <span className="font-medium">{selectedProduto.categoria}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Preço Base</span>
                    <span className="font-medium">R$ {selectedProduto.precoBase.toLocaleString('pt-BR')}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Lead Time</span>
                    <span className="font-medium">{selectedProduto.tempoProducao}h ({leadTimeDays} dias)</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Quantidade *</label>
                  <Input
                    type="number"
                    min={1}
                    value={formData.quantidade}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantidade: Math.max(1, parseInt(e.target.value) || 1) }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Margem (%)</label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={formData.margem}
                    onChange={(e) => setFormData(prev => ({ ...prev, margem: parseFloat(e.target.value) || 0 }))}
                    className="mt-1"
                  />
                </div>
              </div>

              {selectedProduto && (
                <div className="p-3 rounded-lg bg-civ/10 border border-civ/30 flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Valor Total Estimado:</span>
                  <span className="text-lg font-bold text-foreground">R$ {valorTotal.toLocaleString('pt-BR')}</span>
                </div>
              )}

              {/* Alerta de Materiais (CIC) */}
              {materialAlerts.length > 0 && (
                <div className="p-3 rounded-lg bg-warning/10 border border-warning/30">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-warning">⚠ Alerta de Materiais (CIC)</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Insumos com estoque crítico ou em atenção. Será adicionado <strong>+5 dias</strong> ao prazo.
                      </p>
                      <div className="mt-2 space-y-1">
                        {materialAlerts.map(m => (
                          <div key={m.id} className="flex items-center gap-2 text-xs">
                            <Badge className={cn(
                              'text-[10px]',
                              m.status === 'critico'
                                ? 'bg-destructive/20 text-destructive border-destructive/30'
                                : 'bg-warning/20 text-warning border-warning/30'
                            )}>
                              {m.status === 'critico' ? 'CRÍTICO' : 'ATENÇÃO'}
                            </Badge>
                            <span>{m.nome} — {m.estoqueAtual}/{m.estoqueMinimo} {m.unidade}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── STEP 3: Prazo e Estoque ─── */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-fade-in">
              {/* Data de Entrega Calculada */}
              <div className="p-4 rounded-lg bg-civ/10 border border-civ/30">
                <div className="flex items-center gap-4">
                  <Calendar className="h-8 w-8 text-civ flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-civ">Data de Entrega Calculada</p>
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

              {/* Alerta de Bloqueio */}
              {selectedCliente?.statusFinanceiro === 'bloqueado' && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-start gap-3">
                  <ShieldAlert className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-destructive">Cliente BLOQUEADO — Pedido não pode ser confirmado</p>
                    <p className="text-xs text-muted-foreground">{selectedCliente.motivoBloqueio}</p>
                  </div>
                </div>
              )}

              {/* Tabela de Materiais */}
              {allMaterials.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Materiais Necessários (CIC)</p>
                  <div className="rounded-lg border border-border/30 overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-secondary/30 border-b border-border/30">
                          <th className="text-left py-2 px-3 font-medium">Material</th>
                          <th className="text-center py-2 px-3 font-medium">Estoque</th>
                          <th className="text-center py-2 px-3 font-medium">Mínimo</th>
                          <th className="text-center py-2 px-3 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allMaterials.map(m => (
                          <tr key={m.id} className="border-b border-border/20 last:border-b-0">
                            <td className="py-2 px-3">{m.nome}</td>
                            <td className="py-2 px-3 text-center font-mono">{m.estoqueAtual} {m.unidade}</td>
                            <td className="py-2 px-3 text-center font-mono">{m.estoqueMinimo}</td>
                            <td className="py-2 px-3 text-center">
                              <Badge className={cn(
                                'text-[10px]',
                                m.status === 'critico' ? 'bg-destructive/20 text-destructive' :
                                m.status === 'atencao' ? 'bg-warning/20 text-warning' :
                                'bg-success/20 text-success'
                              )}>
                                {m.status === 'critico' ? 'Crítico' : m.status === 'atencao' ? 'Atenção' : 'Normal'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Resumo */}
              <div className="p-4 rounded-lg bg-secondary/30 border border-border/30">
                <p className="text-sm font-semibold mb-3">Resumo do Pedido</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground text-xs block">Cliente</span>
                    <span className="font-medium">{formData.clienteNome || '—'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs block">Canal</span>
                    <span className="font-medium">{formData.canal || '—'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs block">Produto</span>
                    <span className="font-medium">{selectedProduto?.nome || '—'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs block">Quantidade</span>
                    <span className="font-medium">{formData.quantidade}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs block">Valor Total</span>
                    <span className="font-bold text-foreground">R$ {valorTotal.toLocaleString('pt-BR')}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs block">Margem</span>
                    <span className="font-medium">{formData.margem}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navegação do Stepper */}
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
              disabled={selectedCliente?.statusFinanceiro === 'bloqueado'}
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
