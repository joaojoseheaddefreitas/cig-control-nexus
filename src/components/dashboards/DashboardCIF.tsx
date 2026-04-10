import { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, ComposedChart, Legend,
} from 'recharts';
import { KPICard } from '@/components/ui/KPICard';
import { ModuleCard } from '@/components/ui/ModuleCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Wallet, TrendingUp, TrendingDown, DollarSign, PiggyBank, CreditCard, BarChart2,
  Brain, Home, ChevronLeft, ChevronRight, Menu, X,
  Target, Shield, Gauge, Activity, Scale, RefreshCw, Plus, Check, Settings,
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { fetchCIFData, marcarComoPago, criarTransacao, type CIFDashboardData } from '@/services/cifService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const CHART_COLORS = {
  azulMarinho: 'hsl(215, 75%, 48%)',
  verde: 'hsl(145, 70%, 42%)',
  amarelo: 'hsl(45, 95%, 50%)',
  vermelho: 'hsl(0, 72%, 51%)',
  laranja: 'hsl(30, 90%, 50%)',
  verdeEscuro: 'hsl(160, 65%, 40%)',
};

type CIFTab = 'dashboard' | 'fluxo' | 'custos' | 'equilibrio' | 'rentabilidade' | 'auditoria' | 'analytics';

const menuItems: { id: CIFTab; label: string; icon: typeof BarChart2 }[] = [
  { id: 'dashboard', label: 'Dashboard Executivo', icon: BarChart2 },
  { id: 'fluxo', label: 'Fluxo de Caixa', icon: Wallet },
  { id: 'custos', label: 'Custos & Orçamento', icon: CreditCard },
  { id: 'equilibrio', label: 'Ponto de Equilíbrio', icon: Scale },
  { id: 'rentabilidade', label: 'Rentabilidade & Pricing', icon: Target },
  { id: 'auditoria', label: 'Auditoria & Compliance', icon: Shield },
  { id: 'analytics', label: 'Analytics', icon: Activity },
];

interface DashboardCIFProps {
  onGoHome?: () => void;
}

export function DashboardCIF({ onGoHome }: DashboardCIFProps) {
  const [activeTab, setActiveTab] = useState<CIFTab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CIFDashboardData | null>(null);
  const [showNewTx, setShowNewTx] = useState(false);
  const [showNewDespesa, setShowNewDespesa] = useState(false);
  const [hoverCard, setHoverCard] = useState<string | null>(null);
  const [newTx, setNewTx] = useState({ tipo: 'DESPESA', categoria: 'materiais', descricao: '', valor: '', data_vencimento: '' });
  const [newDespesa, setNewDespesa] = useState({ categoria: 'materiais', descricao: '', valor: '', data_emissao: '', status: 'PENDENTE' });
  const [editingBudgets, setEditingBudgets] = useState<Record<string, string>>({});
  const [showConfigEquil, setShowConfigEquil] = useState(false);
  const [configFin, setConfigFin] = useState({ id: '', impostos_percentual: 8.5, comissoes_percentual: 5.0 });
  const [configFinEdit, setConfigFinEdit] = useState({ impostos_percentual: '8.5', comissoes_percentual: '5.0' });
  const isMobile = useIsMobile();

  const loadData = async () => {
    setLoading(true);
    const cifData = await fetchCIFData();
    setData(cifData);
    setLoading(false);
  };

  useEffect(() => { loadData(); loadConfigFin(); }, []);

  const loadConfigFin = async () => {
    const { data: rows } = await (supabase as any).from('configuracoes_financeiras').select('*').limit(1);
    if (rows && rows.length > 0) {
      const r = rows[0];
      setConfigFin({ id: r.id, impostos_percentual: Number(r.impostos_percentual), comissoes_percentual: Number(r.comissoes_percentual) });
      setConfigFinEdit({ impostos_percentual: String(r.impostos_percentual), comissoes_percentual: String(r.comissoes_percentual) });
    }
  };

  const handleSaveConfigFin = async () => {
    const imp = Number(configFinEdit.impostos_percentual);
    const com = Number(configFinEdit.comissoes_percentual);
    if (isNaN(imp) || isNaN(com) || imp < 0 || imp > 100 || com < 0 || com > 100) {
      toast.error('Valores devem estar entre 0 e 100'); return;
    }
    try {
      if (configFin.id) {
        await (supabase as any).from('configuracoes_financeiras').update({ impostos_percentual: imp, comissoes_percentual: com }).eq('id', configFin.id);
      } else {
        const { data: inserted } = await (supabase as any).from('configuracoes_financeiras').insert({ impostos_percentual: imp, comissoes_percentual: com }).select().single();
        if (inserted) setConfigFin(prev => ({ ...prev, id: inserted.id }));
      }
      setConfigFin(prev => ({ ...prev, impostos_percentual: imp, comissoes_percentual: com }));
      toast.success('Configurações salvas');
      setShowConfigEquil(false);
      loadData();
    } catch { toast.error('Erro ao salvar configurações'); }
  };

  // Realtime
  useEffect(() => {
    const ch = supabase.channel('cif-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transacoes' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orcamentos' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'logs_auditoria' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'configuracoes_financeiras' }, () => { loadData(); loadConfigFin(); })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const handleTabChange = (tabId: CIFTab) => { setActiveTab(tabId); setSidebarOpen(false); };

  const handleMarcarPago = async (id: string, valor: number) => {
    try {
      await marcarComoPago(id, valor);
      toast.success('Transação marcada como PAGO');
    } catch { toast.error('Erro ao marcar como pago'); }
  };

  const handleCriarTx = async () => {
    if (!newTx.descricao || !newTx.valor) { toast.error('Preencha descrição e valor'); return; }
    try {
      await criarTransacao({
        tipo: newTx.tipo,
        categoria: newTx.categoria,
        descricao: newTx.descricao,
        valor: Number(newTx.valor),
        data_emissao: new Date().toISOString().slice(0, 10),
        data_vencimento: newTx.data_vencimento || new Date().toISOString().slice(0, 10),
        status: 'PENDENTE',
      });
      toast.success('Transação criada');
      setShowNewTx(false);
      setNewTx({ tipo: 'DESPESA', categoria: 'materiais', descricao: '', valor: '', data_vencimento: '' });
    } catch { toast.error('Erro ao criar transação'); }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const fmt = (v: number) => v >= 1000000 ? `R$ ${(v / 1000000).toFixed(2)}M` : v >= 1000 ? `R$ ${(v / 1000).toFixed(0)}k` : `R$ ${v.toFixed(0)}`;
  const margemLiquida = data.receita > 0 ? (data.ebitda / data.receita) * 100 : 0;

  // Break-even calculations with configurable params
  const custosVariaveisPerc = data.receita > 0 ? (data.despesa - data.custoFixo * (data.receitaMensal.length || 1)) / data.receita : 0;
  const margemContribuicao = 1 - (Math.max(0, custosVariaveisPerc) + configFin.impostos_percentual / 100 + configFin.comissoes_percentual / 100);
  const pontoEquilibrioCalc = margemContribuicao > 0 ? data.custoFixo / margemContribuicao : 0;
  const margemInvalida = margemContribuicao <= 0;

  const statusEquilibrio = data.faturamento > pontoEquilibrioCalc ? 'acima' : 'abaixo';
  const percentualAcima = pontoEquilibrioCalc > 0 ? (((data.faturamento - pontoEquilibrioCalc) / pontoEquilibrioCalc) * 100).toFixed(1) : '0';

  // Gauge data for break-even
  const gaugePercent = pontoEquilibrioCalc > 0 ? Math.min(200, (data.faturamento / pontoEquilibrioCalc) * 100) : 0;

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="relative" onMouseEnter={() => setHoverCard(null)}>
          <KPICard title="Receita Total" value={fmt(data!.receita)} icon={<DollarSign className="h-5 w-5" />} variant="cif"
            trend={data!.tendenciaReceita >= 0 ? 'up' : 'down'}
            trendValue={`${data!.tendenciaReceita >= 0 ? '+' : ''}${data!.tendenciaReceita.toFixed(1)}% MoM`}
          />
        </div>
        <div className="relative" onMouseEnter={() => setHoverCard(null)}>
          <KPICard title="Despesa Total" value={fmt(data!.despesa)} icon={<CreditCard className="h-5 w-5" />} variant="cif"
            trend={data!.tendenciaDespesa <= 0 ? 'up' : 'down'}
            trendValue={`${data!.tendenciaDespesa >= 0 ? '+' : ''}${data!.tendenciaDespesa.toFixed(1)}% MoM`}
          />
        </div>
        <KPICard title="EBITDA" value={fmt(data!.ebitda)} icon={<TrendingUp className="h-5 w-5" />} variant="cif" trend={data!.ebitda > 0 ? 'up' : 'down'} trendValue={data!.ebitda > 0 ? 'Positivo' : 'Negativo'} />
        <KPICard title="Saldo de Caixa" value={fmt(data!.saldoCaixa)} icon={<Wallet className="h-5 w-5" />} variant="cif" />
        <div className="relative" onMouseEnter={() => setHoverCard('material')} onMouseLeave={() => setHoverCard(null)}>
          <KPICard title="Custo Material" value={fmt(data!.top3CustoMaterial.reduce((s, c) => s + c.valor, 0))} subtitle="Hover: TOP 3" icon={<Target className="h-5 w-5" />} variant="cif" />
          {hoverCard === 'material' && (
            <div className="absolute top-full left-0 z-50 mt-1 p-3 bg-card border border-border rounded-lg shadow-xl min-w-[200px]">
              <p className="text-xs font-semibold text-cif mb-2">TOP 3 Custos Material</p>
              {data!.top3CustoMaterial.map((c, i) => (
                <div key={i} className="flex justify-between text-xs py-1">
                  <span className="text-muted-foreground capitalize">{c.categoria}</span>
                  <span className="font-medium">{fmt(c.valor)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="relative" onMouseEnter={() => setHoverCard('mob')} onMouseLeave={() => setHoverCard(null)}>
          <KPICard title="Custo Mão de Obra" value={fmt(data!.top3CustoMaoObra.reduce((s, c) => s + c.valor, 0))} subtitle="Hover: TOP 3" icon={<Activity className="h-5 w-5" />} variant="cif" />
          {hoverCard === 'mob' && (
            <div className="absolute top-full left-0 z-50 mt-1 p-3 bg-card border border-border rounded-lg shadow-xl min-w-[200px]">
              <p className="text-xs font-semibold text-cif mb-2">TOP 3 Custos MOB</p>
              {data!.top3CustoMaoObra.map((c, i) => (
                <div key={i} className="flex justify-between text-xs py-1">
                  <span className="text-muted-foreground capitalize">{c.categoria}</span>
                  <span className="font-medium">{fmt(c.valor)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Break-even Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ModuleCard title="Break-Even (Velocímetro)" variant="cif">
          <div className="h-52 flex flex-col items-center justify-center">
            <div className="relative w-40 h-20 overflow-hidden">
              <div className="absolute inset-0 rounded-t-full border-[12px] border-b-0 border-destructive/30" />
              <div className="absolute inset-0 rounded-t-full border-[12px] border-b-0 border-transparent" style={{
                borderTopColor: gaugePercent >= 100 ? CHART_COLORS.verde : CHART_COLORS.amarelo,
                borderLeftColor: gaugePercent >= 50 ? (gaugePercent >= 100 ? CHART_COLORS.verde : CHART_COLORS.amarelo) : 'transparent',
                borderRightColor: gaugePercent >= 100 ? CHART_COLORS.verde : 'transparent',
              }} />
              <div className="absolute bottom-0 left-1/2 w-1 h-16 bg-foreground origin-bottom rounded-full" style={{
                transform: `translateX(-50%) rotate(${Math.min(180, (gaugePercent / 200) * 180) - 90}deg)`,
              }} />
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full bg-foreground" />
            </div>
            <p className="text-2xl font-bold mt-3">{gaugePercent.toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">
              {gaugePercent < 80 ? '🔴 Zona de Prejuízo' : gaugePercent < 110 ? '🟡 Zona de Equilíbrio' : '🟢 Zona de Lucro'}
            </p>
          </div>
        </ModuleCard>

        <ModuleCard title="Receita vs Despesa (Mensal)" variant="cif" className="lg:col-span-2">
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data!.receitaMensal}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="mes" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, '']} />
                <Legend />
                <Bar dataKey="receita" fill={CHART_COLORS.verde} name="Receita" radius={[4, 4, 0, 0]} />
                <Bar dataKey="despesa" fill={CHART_COLORS.vermelho} name="Despesa" radius={[4, 4, 0, 0]} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </ModuleCard>
      </div>
    </div>
  );

  const renderFluxo = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Fluxo de Caixa & Conciliação</h3>
        <Button size="sm" onClick={() => setShowNewTx(true)}><Plus className="h-4 w-4 mr-1" />Nova Transação</Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard title="Saldo Atual" value={fmt(data!.saldoCaixa)} icon={<Wallet className="h-5 w-5" />} variant="cif" />
        <KPICard title="A Receber (Pendente)" value={fmt(data!.transacoes.filter(t => t.tipo === 'RECEITA' && t.status === 'PENDENTE').reduce((s, t) => s + Number(t.valor), 0))} icon={<TrendingUp className="h-5 w-5" />} variant="cif" />
        <KPICard title="A Pagar (Pendente)" value={fmt(data!.transacoes.filter(t => t.tipo === 'DESPESA' && t.status === 'PENDENTE').reduce((s, t) => s + Number(t.valor), 0))} icon={<TrendingDown className="h-5 w-5" />} variant="cif" />
        <KPICard title="Margem Líquida" value={`${margemLiquida.toFixed(1)}%`} icon={<PiggyBank className="h-5 w-5" />} variant="cif" />
      </div>

      <ModuleCard title="Projeção de Caixa (30 dias)" variant="cif">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data!.fluxoProjetado}>
              <defs>
                <linearGradient id="fluxoGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.verde} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={CHART_COLORS.verde} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="dia" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Saldo']} />
              <Area type="monotone" dataKey="saldo" stroke={CHART_COLORS.verde} strokeWidth={2} fill="url(#fluxoGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ModuleCard>

      {/* Conciliação */}
      <ModuleCard title="Transações Pendentes (Conciliação)" variant="cif">
        <div className="overflow-auto max-h-[300px]">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border/50 bg-secondary/30 sticky top-0">
              <th className="text-left py-2 px-3">Tipo</th>
              <th className="text-left py-2 px-3">Descrição</th>
              <th className="text-left py-2 px-3">Categoria</th>
              <th className="text-right py-2 px-3">Valor</th>
              <th className="text-center py-2 px-3">Vencimento</th>
              <th className="text-center py-2 px-3">Ação</th>
            </tr></thead>
            <tbody>
              {data!.transacoes.filter(t => t.status === 'PENDENTE').map(t => (
                <tr key={t.id} className="border-b border-border/30 hover:bg-secondary/20">
                  <td className="py-2 px-3">
                    <Badge className={t.tipo === 'RECEITA' ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}>{t.tipo}</Badge>
                  </td>
                  <td className="py-2 px-3 text-foreground">{t.descricao}</td>
                  <td className="py-2 px-3 text-muted-foreground capitalize">{t.categoria.replace('_', ' ')}</td>
                  <td className="py-2 px-3 text-right font-medium">{fmt(Number(t.valor))}</td>
                  <td className="py-2 px-3 text-center text-muted-foreground">{new Date(t.data_vencimento).toLocaleDateString('pt-BR')}</td>
                  <td className="py-2 px-3 text-center">
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleMarcarPago(t.id, Number(t.valor))}>
                      <Check className="h-3 w-3 mr-1" />PAGO
                    </Button>
                  </td>
                </tr>
              ))}
              {data!.transacoes.filter(t => t.status === 'PENDENTE').length === 0 && (
                <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">Todas as transações estão conciliadas ✅</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </ModuleCard>
    </div>
  );

  const handleCriarDespesa = async () => {
    if (!newDespesa.descricao || !newDespesa.valor) { toast.error('Preencha descrição e valor'); return; }
    const valor = Number(newDespesa.valor);
    // Check budget overshoot
    const orcCat = data!.custosPorCategoria.find(c => c.categoria === newDespesa.categoria);
    if (orcCat && orcCat.limite > 0 && (orcCat.valor + valor) > orcCat.limite) {
      toast.warning('⚠️ Atenção: Esta despesa excede o orçamento planejado para este mês');
    }
    try {
      await criarTransacao({
        tipo: 'DESPESA',
        categoria: newDespesa.categoria,
        descricao: newDespesa.descricao,
        valor,
        data_emissao: newDespesa.data_emissao || new Date().toISOString().slice(0, 10),
        data_vencimento: newDespesa.data_emissao || new Date().toISOString().slice(0, 10),
        status: newDespesa.status as 'PENDENTE' | 'PAGO',
      });
      toast.success('Despesa criada com sucesso');
      setShowNewDespesa(false);
      setNewDespesa({ categoria: 'materiais', descricao: '', valor: '', data_emissao: '', status: 'PENDENTE' });
    } catch { toast.error('Erro ao criar despesa'); }
  };

  const handleSaveBudget = async (categoria: string) => {
    const novoValor = Number(editingBudgets[categoria]);
    if (isNaN(novoValor) || novoValor < 0) { toast.error('Valor inválido'); return; }
    const now = new Date();
    const mesAno = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    // Check if budget exists for this category+month
    const existing = data!.orcamentos.find(o => {
      const d = new Date(o.mes_ano);
      return o.categoria === categoria && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    try {
      if (existing) {
        await (supabase as any).from('orcamentos').update({ valor_limite: novoValor }).eq('id', existing.id);
      } else {
        await (supabase as any).from('orcamentos').insert({ categoria, valor_limite: novoValor, mes_ano: mesAno });
      }
      // Log audit
      await (supabase as any).from('logs_auditoria').insert({
        usuario: 'sistema',
        acao: 'ALTERACAO_ORCAMENTO',
        valor_antigo: existing ? Number(existing.valor_limite) : null,
        valor_novo: novoValor,
        detalhes: `Orçamento ${categoria} alterado para R$ ${novoValor}`,
        entidade: 'orcamentos',
        entidade_id: existing?.id || null,
      });
      toast.success(`Orçamento de ${categoria} atualizado`);
      setEditingBudgets(prev => { const n = { ...prev }; delete n[categoria]; return n; });
    } catch { toast.error('Erro ao salvar orçamento'); }
  };

  const renderCustos = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="p-3 rounded-lg bg-cif/10 border border-cif/30 flex-1">
          <p className="text-sm text-muted-foreground"><strong className="text-cif">Custos & Orçamento</strong> — Edite limites e registre despesas em tempo real.</p>
        </div>
        <Button size="sm" className="ml-3" onClick={() => setShowNewDespesa(true)}><Plus className="h-4 w-4 mr-1" />Nova Despesa</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data!.custosPorCategoria.map((c, i) => {
          const isEditing = editingBudgets[c.categoria] !== undefined;
          return (
            <div key={i} className="p-4 rounded-xl bg-card border border-border/30">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium capitalize">{c.categoria.replace('_', ' ')}</span>
                <Badge className={cn(
                  c.percentual <= 80 ? 'bg-success/20 text-success' :
                  c.percentual <= 100 ? 'bg-warning/20 text-warning' :
                  'bg-destructive/20 text-destructive'
                )}>{c.percentual.toFixed(0)}%</Badge>
              </div>
              <Progress value={Math.min(100, c.percentual)} className={cn(
                "h-3",
                c.percentual > 100 ? '[&>div]:bg-destructive' : c.percentual > 80 ? '[&>div]:bg-warning' : '[&>div]:bg-success'
              )} />
              <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                <span>Real: {fmt(c.valor)}</span>
                {isEditing ? (
                  <div className="flex items-center gap-1">
                    <span>Limite: R$</span>
                    <Input
                      type="number"
                      className="h-6 w-20 text-xs px-1"
                      value={editingBudgets[c.categoria]}
                      onChange={(e) => setEditingBudgets(prev => ({ ...prev, [c.categoria]: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveBudget(c.categoria)}
                    />
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => handleSaveBudget(c.categoria)}>
                      <Check className="h-3 w-3 text-success" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setEditingBudgets(prev => { const n = { ...prev }; delete n[c.categoria]; return n; })}>
                      <X className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                ) : (
                  <button
                    className="hover:text-foreground transition-colors cursor-pointer underline decoration-dashed"
                    onClick={() => setEditingBudgets(prev => ({ ...prev, [c.categoria]: String(c.limite) }))}
                  >
                    Limite: {fmt(c.limite)} ✏️
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <ModuleCard title="Composição de Custos" variant="cif">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data!.custosPorCategoria.filter(c => c.valor > 0)} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="valor" nameKey="categoria">
                {data!.custosPorCategoria.map((_, i) => <Cell key={i} fill={Object.values(CHART_COLORS)[i % 6]} />)}
              </Pie>
              <Tooltip formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, '']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </ModuleCard>
    </div>
  );

  const renderEquilibrio = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Ponto de Equilíbrio</h3>
        <Button size="sm" variant="outline" onClick={() => setShowConfigEquil(true)}>
          <Settings className="h-4 w-4 mr-1" />Configurações
        </Button>
      </div>

      {margemInvalida && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/50">
          <p className="text-sm font-semibold text-destructive">⚠️ Margem inválida — operação em prejuízo estrutural</p>
          <p className="text-xs text-muted-foreground mt-1">A margem de contribuição é negativa ou zero. Revise custos variáveis, impostos e comissões.</p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border/30">
          <p className="text-xs text-muted-foreground">Ponto de Equilíbrio</p>
          <p className="text-2xl font-bold text-foreground mt-1">{fmt(pontoEquilibrioCalc)}</p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border/30">
          <p className="text-xs text-muted-foreground">Custo Fixo Mensal</p>
          <p className="text-2xl font-bold text-foreground mt-1">{fmt(data!.custoFixo)}</p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border/30">
          <p className="text-xs text-muted-foreground">Margem Contribuição</p>
          <p className={cn("text-2xl font-bold mt-1", margemContribuicao > 0 ? "text-success" : "text-destructive")}>{(margemContribuicao * 100).toFixed(1)}%</p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border/30">
          <p className="text-xs text-muted-foreground">Faturamento Atual</p>
          <p className="text-2xl font-bold text-foreground mt-1">{fmt(data!.faturamento)}</p>
        </div>
        <div className={cn("p-4 rounded-xl border-2", statusEquilibrio === 'acima' ? "bg-success/10 border-success/50" : "bg-destructive/10 border-destructive/50")}>
          <p className="text-xs text-muted-foreground">Status</p>
          <p className={cn("text-xl font-bold mt-1", statusEquilibrio === 'acima' ? "text-success" : "text-destructive")}>
            {statusEquilibrio === 'acima' ? `🟢 ${percentualAcima}% ACIMA` : `🔴 ${Math.abs(Number(percentualAcima))}% ABAIXO`}
          </p>
        </div>
      </div>

      {/* Parâmetros ativos */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-lg bg-secondary/30 border border-border/30 text-center">
          <p className="text-xs text-muted-foreground">Impostos</p>
          <p className="text-lg font-bold">{configFin.impostos_percentual}%</p>
        </div>
        <div className="p-3 rounded-lg bg-secondary/30 border border-border/30 text-center">
          <p className="text-xs text-muted-foreground">Comissões</p>
          <p className="text-lg font-bold">{configFin.comissoes_percentual}%</p>
        </div>
        <div className="p-3 rounded-lg bg-secondary/30 border border-border/30 text-center">
          <p className="text-xs text-muted-foreground">Custos Var. %</p>
          <p className="text-lg font-bold">{(Math.max(0, custosVariaveisPerc) * 100).toFixed(1)}%</p>
        </div>
      </div>

      {/* Gauge visual */}
      <ModuleCard title="Velocímetro Break-Even" variant="cif">
        <div className="h-56 flex flex-col items-center justify-center">
          <div className="relative w-48 h-24 overflow-hidden">
            <svg viewBox="0 0 200 100" className="w-full h-full">
              <path d="M 20 95 A 80 80 0 0 1 100 15" fill="none" stroke={CHART_COLORS.vermelho} strokeWidth="14" strokeLinecap="round" opacity="0.3" />
              <path d="M 100 15 A 80 80 0 0 1 140 30" fill="none" stroke={CHART_COLORS.amarelo} strokeWidth="14" strokeLinecap="round" opacity="0.3" />
              <path d="M 140 30 A 80 80 0 0 1 180 95" fill="none" stroke={CHART_COLORS.verde} strokeWidth="14" strokeLinecap="round" opacity="0.3" />
              {(() => {
                const angle = Math.PI - (Math.min(gaugePercent, 200) / 200) * Math.PI;
                const nx = 100 + 65 * Math.cos(angle);
                const ny = 95 - 65 * Math.sin(angle);
                return <line x1="100" y1="95" x2={nx} y2={ny} stroke="hsl(var(--foreground))" strokeWidth="3" strokeLinecap="round" />;
              })()}
              <circle cx="100" cy="95" r="5" fill="hsl(var(--foreground))" />
            </svg>
          </div>
          <p className="text-3xl font-bold mt-2">{gaugePercent.toFixed(0)}%</p>
          <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-destructive" />Prejuízo</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-warning" />Equilíbrio</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success" />Lucro</span>
          </div>
        </div>
      </ModuleCard>

      {/* Modal Configurações */}
      <Dialog open={showConfigEquil} onOpenChange={setShowConfigEquil}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>⚙️ Configurações do Ponto de Equilíbrio</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">% Impostos Médios</label>
              <Input type="number" min="0" max="100" step="0.1" value={configFinEdit.impostos_percentual}
                onChange={e => setConfigFinEdit(prev => ({ ...prev, impostos_percentual: e.target.value }))}
                placeholder="Ex: 8.5" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">% Comissões</label>
              <Input type="number" min="0" max="100" step="0.1" value={configFinEdit.comissoes_percentual}
                onChange={e => setConfigFinEdit(prev => ({ ...prev, comissoes_percentual: e.target.value }))}
                placeholder="Ex: 5.0" className="mt-1" />
            </div>
            <div className="p-3 rounded-lg bg-secondary/30 text-xs text-muted-foreground">
              <p><strong>Fórmula:</strong> Margem = 1 - (Custos Var.% + Impostos% + Comissões%)</p>
              <p className="mt-1"><strong>Break-Even:</strong> Custo Fixo / Margem de Contribuição</p>
            </div>
            <Button className="w-full" onClick={handleSaveConfigFin}>Salvar Configurações</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  const renderRentabilidade = () => (
    <div className="space-y-6">
      <div className="p-3 rounded-lg bg-cif/10 border border-cif/30">
        <p className="text-sm text-muted-foreground"><strong className="text-cif">Rentabilidade & Pricing</strong> — Margem por SKU calculada com custos reais.</p>
      </div>
      <div className="rounded-xl border border-border/30 bg-card/80 overflow-hidden max-h-[400px]">
        <ScrollArea className="h-full">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border/50 bg-secondary/30 sticky top-0 z-10">
              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Produto</th>
              <th className="text-right py-3 px-4 text-muted-foreground font-medium">Preço Venda</th>
              <th className="text-right py-3 px-4 text-muted-foreground font-medium">Custo Total</th>
              <th className="text-center py-3 px-4 text-muted-foreground font-medium">Margem</th>
              <th className="text-center py-3 px-4 text-muted-foreground font-medium">Vol.</th>
            </tr></thead>
            <tbody>
              {data!.rentabilidadeSKU.map((s, i) => (
                <tr key={i} className="border-b border-border/30 hover:bg-secondary/30">
                  <td className="py-3 px-4 font-medium text-foreground">{s.sku}</td>
                  <td className="py-3 px-4 text-right">R$ {s.preco.toLocaleString('pt-BR')}</td>
                  <td className="py-3 px-4 text-right text-muted-foreground">R$ {s.custo.toLocaleString('pt-BR')}</td>
                  <td className="py-3 px-4 text-center">
                    <Badge className={cn(s.margem >= 35 ? 'bg-success/20 text-success' : s.margem >= 25 ? 'bg-warning/20 text-warning' : 'bg-destructive/20 text-destructive')}>{s.margem}%</Badge>
                  </td>
                  <td className="py-3 px-4 text-center">{s.volume}</td>
                </tr>
              ))}
              {data!.rentabilidadeSKU.length === 0 && (
                <tr><td colSpan={5} className="py-6 text-center text-muted-foreground">Sem dados de produtos cadastrados</td></tr>
              )}
            </tbody>
          </table>
        </ScrollArea>
      </div>
      {data!.rentabilidadeSKU.length > 0 && (
        <ModuleCard title="Margem por Produto" variant="cif">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data!.rentabilidadeSKU}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="sku" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(value: number) => [`${value}%`, 'Margem']} />
                <Bar dataKey="margem" radius={[4, 4, 0, 0]}>
                  {data!.rentabilidadeSKU.map((s, i) => <Cell key={i} fill={s.margem >= 35 ? CHART_COLORS.verde : s.margem >= 25 ? CHART_COLORS.amarelo : CHART_COLORS.vermelho} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ModuleCard>
      )}
    </div>
  );

  const renderAuditoria = () => (
    <div className="space-y-6">
      <div className="p-3 rounded-lg bg-cif/10 border border-cif/30">
        <p className="text-sm text-muted-foreground"><strong className="text-cif">Auditoria</strong> — Registro imutável de todas as operações financeiras.</p>
      </div>
      <div className="rounded-xl border border-border/30 bg-card/80 overflow-hidden max-h-[500px]">
        <ScrollArea className="h-full">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border/50 bg-secondary/30 sticky top-0 z-10">
              <th className="text-left py-3 px-4">Data</th>
              <th className="text-center py-3 px-4">Ação</th>
              <th className="text-right py-3 px-4">Valor Anterior</th>
              <th className="text-right py-3 px-4">Valor Novo</th>
              <th className="text-left py-3 px-4">Detalhes</th>
            </tr></thead>
            <tbody>
              {data!.logs.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">Nenhum log de auditoria registrado.</td></tr>
              ) : data!.logs.map((log, i) => (
                <tr key={i} className="border-b border-border/30 hover:bg-secondary/30">
                  <td className="py-3 px-4 text-muted-foreground">{new Date(log.data).toLocaleString('pt-BR')}</td>
                  <td className="py-3 px-4 text-center"><Badge variant="outline">{log.acao}</Badge></td>
                  <td className="py-3 px-4 text-right">{log.valor_antigo != null ? fmt(log.valor_antigo) : '-'}</td>
                  <td className="py-3 px-4 text-right font-medium">{log.valor_novo != null ? fmt(log.valor_novo) : '-'}</td>
                  <td className="py-3 px-4 text-xs text-muted-foreground">{log.detalhes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollArea>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ModuleCard title="Evolução Receita (12 meses)" variant="cif">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data!.receitaMensal}>
                <defs>
                  <linearGradient id="recGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.verde} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={CHART_COLORS.verde} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="mes" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, '']} />
                <Area type="monotone" dataKey="receita" stroke={CHART_COLORS.verde} strokeWidth={2} fill="url(#recGrad)" name="Receita" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ModuleCard>

        <ModuleCard title="Evolução Despesas (12 meses)" variant="cif">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data!.receitaMensal}>
                <defs>
                  <linearGradient id="despGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.vermelho} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={CHART_COLORS.vermelho} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="mes" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, '']} />
                <Area type="monotone" dataKey="despesa" stroke={CHART_COLORS.vermelho} strokeWidth={2} fill="url(#despGrad)" name="Despesa" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ModuleCard>

        <ModuleCard title="Margem ao Longo do Tempo" variant="cif" className="lg:col-span-2">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data!.receitaMensal.map(r => ({
                mes: r.mes,
                margem: r.receita > 0 ? ((r.receita - r.despesa) / r.receita * 100) : 0,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="mes" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(value: number) => [`${Number(value).toFixed(1)}%`, 'Margem']} />
                <Line type="monotone" dataKey="margem" stroke={CHART_COLORS.azulMarinho} strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ModuleCard>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return renderDashboard();
      case 'fluxo': return renderFluxo();
      case 'custos': return renderCustos();
      case 'equilibrio': return renderEquilibrio();
      case 'rentabilidade': return renderRentabilidade();
      case 'auditoria': return renderAuditoria();
      case 'analytics': return renderAnalytics();
      default: return renderDashboard();
    }
  };

  const SidebarContent = ({ isCollapsed = false }: { isCollapsed?: boolean }) => (
    <>
      <div className={cn("mb-6", isCollapsed && "text-center")}>
        {!isCollapsed ? (
          <>
            <h3 className="text-cif font-display text-lg font-bold">CIF CONTROL</h3>
            <p className="text-xs text-muted-foreground">Inteligência Financeira</p>
          </>
        ) : (
          <div className="w-8 h-8 rounded-lg bg-cif/20 flex items-center justify-center mx-auto">
            <Wallet className="h-4 w-4 text-cif" />
          </div>
        )}
      </div>
      <div className={cn("mb-2 pb-2 border-b border-border/30", isCollapsed && "pb-1 mb-1")}>
        <button onClick={() => { onGoHome?.(); }} className={cn('w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-primary hover:bg-primary/10 transition-all font-medium', isCollapsed && 'justify-center px-2')}>
          <Home className="h-4 w-4 flex-shrink-0" />
          {!isCollapsed && <span>HOME</span>}
        </button>
      </div>
      <nav className="space-y-1">
        {menuItems.map((item) => (
          <button key={item.id} onClick={() => handleTabChange(item.id)} title={isCollapsed ? item.label : undefined}
            className={cn('w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all',
              activeTab === item.id ? 'bg-cif/20 text-cif font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50',
              isCollapsed && 'justify-center px-2'
            )}>
            <item.icon className="h-4 w-4 flex-shrink-0" />
            {!isCollapsed && <span className="truncate">{item.label}</span>}
          </button>
        ))}
      </nav>
    </>
  );

  return (
    <div className="flex animate-fade-in h-full overflow-hidden">
      {isMobile && (
        <div className="fixed top-12 left-0 right-0 z-40 bg-background/95 backdrop-blur border-b border-border/50 px-4 py-3">
          <div className="flex items-center justify-between">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild><Button variant="ghost" size="icon" className="h-10 w-10"><Menu className="h-6 w-6" /></Button></SheetTrigger>
              <SheetContent side="left" className="w-72 p-4 overflow-y-auto">
                <SheetClose className="absolute right-4 top-4"><X className="h-5 w-5" /></SheetClose>
                <SidebarContent />
              </SheetContent>
            </Sheet>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cif animate-pulse" />
              <span className="text-sm font-semibold text-cif">CIF CONTROL</span>
            </div>
            <div className="w-10" />
          </div>
        </div>
      )}

      {!isMobile && (
        <aside className={cn('h-full border-r border-border/50 bg-card/30 p-4 flex-shrink-0 transition-all duration-300 relative overflow-y-auto', sidebarCollapsed ? 'w-16' : 'w-56')}>
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="absolute -right-4 top-6 w-8 h-8 bg-cif border-2 border-cif/50 rounded-full flex items-center justify-center hover:bg-cif/80 hover:scale-110 transition-all z-10 shadow-lg shadow-cif/30 text-white">
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
          <SidebarContent isCollapsed={sidebarCollapsed} />
        </aside>
      )}

      <main className={cn('flex-1 overflow-y-auto', isMobile ? 'pt-28 px-3 pb-4' : 'p-4 lg:p-6')}>
        {!isMobile && (
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cif/20 flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-cif" />
                </div>
                {menuItems.find(m => m.id === activeTab)?.label || 'Dashboard'}
              </h2>
              <p className="text-muted-foreground mt-1 ml-13">CIF CONTROL – Central de Inteligência Financeira</p>
            </div>
            <Button variant="ghost" size="sm" onClick={loadData}><RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />Atualizar</Button>
          </div>
        )}
        {renderContent()}
      </main>

      {/* Modal Nova Transação */}
      <Dialog open={showNewTx} onOpenChange={setShowNewTx}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Transação</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Select value={newTx.tipo} onValueChange={(v) => setNewTx(p => ({ ...p, tipo: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="RECEITA">Receita</SelectItem>
                <SelectItem value="DESPESA">Despesa</SelectItem>
              </SelectContent>
            </Select>
            <Select value={newTx.categoria} onValueChange={(v) => setNewTx(p => ({ ...p, categoria: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="materiais">Materiais</SelectItem>
                <SelectItem value="mao_de_obra">Mão de Obra</SelectItem>
                <SelectItem value="aluguel">Aluguel</SelectItem>
                <SelectItem value="energia">Energia</SelectItem>
                <SelectItem value="manutencao">Manutenção</SelectItem>
                <SelectItem value="administrativo">Administrativo</SelectItem>
                <SelectItem value="vendas_moveis">Vendas Móveis</SelectItem>
                <SelectItem value="projetos_especiais">Projetos Especiais</SelectItem>
                <SelectItem value="assistencia">Assistência</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Descrição" value={newTx.descricao} onChange={(e) => setNewTx(p => ({ ...p, descricao: e.target.value }))} />
            <Input type="number" placeholder="Valor (R$)" value={newTx.valor} onChange={(e) => setNewTx(p => ({ ...p, valor: e.target.value }))} />
            <Input type="date" value={newTx.data_vencimento} onChange={(e) => setNewTx(p => ({ ...p, data_vencimento: e.target.value }))} />
            <Button className="w-full" onClick={handleCriarTx}>Criar Transação</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Nova Despesa (Custos & Orçamento) */}
      <Dialog open={showNewDespesa} onOpenChange={setShowNewDespesa}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Despesa</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Select value={newDespesa.categoria} onValueChange={(v) => setNewDespesa(p => ({ ...p, categoria: v }))}>
              <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="materiais">Materiais</SelectItem>
                <SelectItem value="mao_de_obra">Mão de Obra</SelectItem>
                <SelectItem value="aluguel">Aluguel</SelectItem>
                <SelectItem value="energia">Energia</SelectItem>
                <SelectItem value="manutencao">Manutenção</SelectItem>
                <SelectItem value="administrativo">Administrativo</SelectItem>
                <SelectItem value="vendas_moveis">Vendas Móveis</SelectItem>
                <SelectItem value="projetos_especiais">Projetos Especiais</SelectItem>
                <SelectItem value="assistencia">Assistência</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Descrição" value={newDespesa.descricao} onChange={(e) => setNewDespesa(p => ({ ...p, descricao: e.target.value }))} />
            <Input type="number" placeholder="Valor (R$)" value={newDespesa.valor} onChange={(e) => setNewDespesa(p => ({ ...p, valor: e.target.value }))} />
            <Input type="date" value={newDespesa.data_emissao} onChange={(e) => setNewDespesa(p => ({ ...p, data_emissao: e.target.value }))} />
            <Select value={newDespesa.status} onValueChange={(v) => setNewDespesa(p => ({ ...p, status: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDENTE">Pendente</SelectItem>
                <SelectItem value="PAGO">Pago</SelectItem>
              </SelectContent>
            </Select>
            <Button className="w-full" onClick={handleCriarDespesa}>Criar Despesa</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
