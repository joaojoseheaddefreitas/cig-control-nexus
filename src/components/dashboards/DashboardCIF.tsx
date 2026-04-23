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

type CIFTab = 'dashboard' | 'estofados' | 'fluxo' | 'custos' | 'equilibrio' | 'rentabilidade' | 'auditoria' | 'analytics';

const menuItems: { id: CIFTab; label: string; icon: typeof BarChart2 }[] = [
  { id: 'dashboard', label: 'Dashboard Executivo', icon: BarChart2 },
  { id: 'estofados', label: 'Performance Estofados', icon: Gauge },
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
  const [auditFilter, setAuditFilter] = useState({ acao: '', risco: '' });
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
      const valorAntigo = existing ? Number(existing.valor_limite) : null;
      await (supabase as any).from('logs_auditoria').insert({
        usuario: 'sistema',
        acao: 'EDITAR_ORCAMENTO',
        valor_antigo: valorAntigo,
        valor_novo: novoValor,
        detalhes: `Orçamento ${categoria} alterado para R$ ${novoValor.toLocaleString('pt-BR')}`,
        entidade: 'orcamentos',
        entidade_id: existing?.id || null,
        campo_alterado: 'valor_limite',
        nivel_risco: valorAntigo && valorAntigo > 0 && Math.abs((novoValor - valorAntigo) / valorAntigo) > 0.2 ? 'ALTO' : 'MEDIO',
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

  const renderRentabilidade = () => {
    const skus = data!.rentabilidadeSKU;
    const comVolume = skus.filter(s => s.volume > 0);
    const semVolume = skus.filter(s => s.volume === 0);
    const margemColor = (m: number) => m >= 60 ? 'bg-success/20 text-success' : m >= 30 ? 'bg-warning/20 text-warning' : 'bg-destructive/20 text-destructive';
    const margemDot = (m: number) => m >= 60 ? '🟢' : m >= 30 ? '🟡' : '🔴';
    const curvaColor = (c: string) => c === 'A' ? 'bg-success/20 text-success' : c === 'B' ? 'bg-warning/20 text-warning' : 'bg-muted text-muted-foreground';
    const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

    // Alertas críticos: Curva A com margem < 30%
    const alertasCriticos = comVolume.filter(s => s.curvaABC === 'A' && s.margem < 30);

    return (
      <div className="space-y-6">
        <div className="p-3 rounded-lg bg-cif/10 border border-cif/30">
          <p className="text-sm text-muted-foreground"><strong className="text-cif">Rentabilidade & Pricing</strong> — Análise de lucro real por SKU com Curva ABC. Ranking por lucro total.</p>
        </div>

        {/* Alertas Críticos */}
        {alertasCriticos.length > 0 && (
          <div className="space-y-2">
            {alertasCriticos.map((s, i) => (
              <div key={i} className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-start gap-2">
                <span className="text-lg">⚠️</span>
                <p className="text-sm text-destructive"><strong>{s.sku}</strong> — Volume alto com margem perigosa ({s.margem}%) — risco de prejuízo operacional. Curva A gera {fmt(s.lucroTotal)} de lucro total.</p>
              </div>
            ))}
          </div>
        )}

        {/* KPIs resumo */}
        {comVolume.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg border border-border/30 bg-card/80">
              <p className="text-xs text-muted-foreground">Lucro Total</p>
              <p className="text-lg font-bold text-foreground">{fmt(comVolume.reduce((s, p) => s + p.lucroTotal, 0))}</p>
            </div>
            <div className="p-3 rounded-lg border border-border/30 bg-card/80">
              <p className="text-xs text-muted-foreground">Margem Média Pond.</p>
              <p className="text-lg font-bold text-foreground">{(() => { const tr = comVolume.reduce((s, p) => s + p.preco * p.volume, 0); const tc = comVolume.reduce((s, p) => s + p.custoTotal * p.volume, 0); return tr > 0 ? ((tr - tc) / tr * 100).toFixed(1) : '0'; })()}%</p>
            </div>
            <div className="p-3 rounded-lg border border-border/30 bg-card/80">
              <p className="text-xs text-muted-foreground">Curva A (80% lucro)</p>
              <p className="text-lg font-bold text-success">{comVolume.filter(s => s.curvaABC === 'A').length} SKUs</p>
            </div>
            <div className="p-3 rounded-lg border border-border/30 bg-card/80">
              <p className="text-xs text-muted-foreground">Margem Crítica</p>
              <p className="text-lg font-bold text-destructive">{comVolume.filter(s => s.margem < 30).length} SKUs 🔴</p>
            </div>
          </div>
        )}

        {/* Tabela Principal - COM VOLUME */}
        <div className="rounded-xl border border-border/30 bg-card/80 overflow-hidden">
          <div className="px-4 py-2 bg-secondary/30 border-b border-border/30">
            <p className="text-xs font-semibold text-muted-foreground">📊 PRODUTOS COM VOLUME ({comVolume.length}) — Ordenados por Lucro Total</p>
          </div>
          <ScrollArea className="max-h-[400px]">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border/50 bg-secondary/20 sticky top-0 z-10">
                <th className="text-left py-2 px-3 text-muted-foreground font-medium text-xs">Produto</th>
                <th className="text-center py-2 px-3 text-muted-foreground font-medium text-xs">ABC</th>
                <th className="text-right py-2 px-3 text-muted-foreground font-medium text-xs">Preço</th>
                <th className="text-right py-2 px-3 text-muted-foreground font-medium text-xs">Custo Total</th>
                <th className="text-right py-2 px-3 text-muted-foreground font-medium text-xs">Lucro Un.</th>
                <th className="text-center py-2 px-3 text-muted-foreground font-medium text-xs">Vol.</th>
                <th className="text-right py-2 px-3 text-muted-foreground font-medium text-xs font-bold">Lucro Total</th>
                <th className="text-center py-2 px-3 text-muted-foreground font-medium text-xs">Margem</th>
              </tr></thead>
              <tbody>
                {comVolume.map((s, i) => (
                  <tr key={i} className={cn("border-b border-border/30 hover:bg-secondary/30", s.curvaABC === 'A' && s.margem < 30 && 'bg-destructive/5')}>
                    <td className="py-2 px-3 font-medium text-foreground">{s.sku}</td>
                    <td className="py-2 px-3 text-center"><Badge className={curvaColor(s.curvaABC)}>{s.curvaABC}</Badge></td>
                    <td className="py-2 px-3 text-right text-xs">{fmt(s.preco)}</td>
                    <td className="py-2 px-3 text-right text-xs text-muted-foreground" title={`Mat: ${fmt(s.custoMaterial)} | MO: ${fmt(s.custoMaoObra)} | Ind: ${fmt(s.custoIndireto)} | Imp: ${fmt(s.custoImpostos)} | Com: ${fmt(s.custoComissao)}`}>
                      {fmt(s.custoTotal)}
                    </td>
                    <td className="py-2 px-3 text-right text-xs">{fmt(s.lucroUnitario)}</td>
                    <td className="py-2 px-3 text-center">{s.volume}</td>
                    <td className="py-2 px-3 text-right font-bold">{fmt(s.lucroTotal)}</td>
                    <td className="py-2 px-3 text-center">
                      <Badge className={margemColor(s.margem)}>{margemDot(s.margem)} {s.margem}%</Badge>
                    </td>
                  </tr>
                ))}
                {comVolume.length === 0 && (
                  <tr><td colSpan={8} className="py-6 text-center text-muted-foreground">Nenhum produto com volume registrado</td></tr>
                )}
              </tbody>
            </table>
          </ScrollArea>
        </div>

        {/* Tabela Secundária - SEM VOLUME */}
        {semVolume.length > 0 && (
          <div className="rounded-xl border border-border/30 bg-card/80 overflow-hidden opacity-70">
            <div className="px-4 py-2 bg-secondary/30 border-b border-border/30">
              <p className="text-xs font-semibold text-muted-foreground">📦 PRODUTOS SEM VOLUME ({semVolume.length}) — Não influenciam ranking</p>
            </div>
            <ScrollArea className="max-h-[200px]">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border/50 bg-secondary/20 sticky top-0 z-10">
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium text-xs">Produto</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium text-xs">Preço</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium text-xs">Custo Total</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium text-xs">Lucro Un.</th>
                  <th className="text-center py-2 px-3 text-muted-foreground font-medium text-xs">Margem</th>
                </tr></thead>
                <tbody>
                  {semVolume.map((s, i) => (
                    <tr key={i} className="border-b border-border/30">
                      <td className="py-2 px-3 font-medium text-foreground">{s.sku}</td>
                      <td className="py-2 px-3 text-right text-xs">{fmt(s.preco)}</td>
                      <td className="py-2 px-3 text-right text-xs text-muted-foreground">{fmt(s.custoTotal)}</td>
                      <td className="py-2 px-3 text-right text-xs">{fmt(s.lucroUnitario)}</td>
                      <td className="py-2 px-3 text-center"><Badge className={margemColor(s.margem)}>{margemDot(s.margem)} {s.margem}%</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          </div>
        )}

        {/* Gráfico Lucro Total por SKU */}
        {comVolume.length > 0 && (
          <ModuleCard title="Lucro Total por Produto (Ranking)" variant="cif">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comVolume.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="sku" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value: number) => [fmt(value), 'Lucro Total']} />
                  <Bar dataKey="lucroTotal" radius={[4, 4, 0, 0]}>
                    {comVolume.slice(0, 10).map((s, i) => <Cell key={i} fill={s.margem >= 60 ? CHART_COLORS.verde : s.margem >= 30 ? CHART_COLORS.amarelo : CHART_COLORS.vermelho} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ModuleCard>
        )}
      </div>
    );
  };

  const renderAuditoria = () => {
    const acaoBadge = (acao: string) => {
      if (acao.includes('CRIAR') || acao.includes('CRIACAO')) return 'bg-success/20 text-success border-success/30';
      if (acao.includes('EDITAR') || acao.includes('ALTERACAO')) return 'bg-warning/20 text-warning border-warning/30';
      if (acao.includes('PAGAMENTO') || acao.includes('BAIXA')) return 'bg-primary/20 text-primary border-primary/30';
      return 'bg-muted text-muted-foreground';
    };
    const acaoIcon = (acao: string) => {
      if (acao.includes('CRIAR') || acao.includes('CRIACAO')) return '➕';
      if (acao.includes('EDITAR') || acao.includes('ALTERACAO')) return '✏️';
      if (acao.includes('PAGAMENTO') || acao.includes('BAIXA')) return '✅';
      return '📋';
    };
    const riscoBadge = (r: string) => {
      if (r === 'ALTO') return 'bg-destructive/20 text-destructive border-destructive/30';
      if (r === 'MEDIO') return 'bg-warning/20 text-warning border-warning/30';
      return 'bg-muted text-muted-foreground';
    };
    const riscoIcon = (r: string) => r === 'ALTO' ? '🔴' : r === 'MEDIO' ? '🟡' : '⚪';

    const uniqueAcoes = [...new Set(data!.logs.map(l => l.acao))];
    const filteredLogs = data!.logs.filter(l => {
      if (auditFilter.acao && l.acao !== auditFilter.acao) return false;
      if (auditFilter.risco && (l.nivel_risco || 'BAIXO') !== auditFilter.risco) return false;
      return true;
    });
    const altoRiscoCount = data!.logs.filter(l => (l.nivel_risco || 'BAIXO') === 'ALTO').length;

    return (
      <div className="space-y-6">
        <div className="p-3 rounded-lg bg-cif/10 border border-cif/30">
          <p className="text-sm text-muted-foreground"><strong className="text-cif">Auditoria & Compliance</strong> — Registro imutável com classificação de risco e rastreabilidade completa.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="p-3 rounded-lg border border-border/30 bg-card/80">
            <p className="text-xs text-muted-foreground">Total Registros</p>
            <p className="text-lg font-bold text-foreground">{data!.logs.length}</p>
          </div>
          <div className="p-3 rounded-lg border border-border/30 bg-card/80">
            <p className="text-xs text-muted-foreground">Criações</p>
            <p className="text-lg font-bold text-success">{data!.logs.filter(l => l.acao.includes('CRIAR') || l.acao.includes('CRIACAO')).length}</p>
          </div>
          <div className="p-3 rounded-lg border border-border/30 bg-card/80">
            <p className="text-xs text-muted-foreground">Edições</p>
            <p className="text-lg font-bold text-warning">{data!.logs.filter(l => l.acao.includes('EDITAR') || l.acao.includes('ALTERACAO')).length}</p>
          </div>
          <div className="p-3 rounded-lg border border-border/30 bg-card/80">
            <p className="text-xs text-muted-foreground">Pagamentos</p>
            <p className="text-lg font-bold text-primary">{data!.logs.filter(l => l.acao.includes('PAGAMENTO') || l.acao.includes('BAIXA')).length}</p>
          </div>
          <div className={cn("p-3 rounded-lg border bg-card/80", altoRiscoCount > 0 ? 'border-destructive/50' : 'border-border/30')}>
            <p className="text-xs text-muted-foreground">Risco ALTO 🔴</p>
            <p className={cn("text-lg font-bold", altoRiscoCount > 0 ? 'text-destructive' : 'text-foreground')}>{altoRiscoCount}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Select value={auditFilter.acao} onValueChange={(v) => setAuditFilter(p => ({ ...p, acao: v === '__all__' ? '' : v }))}>
            <SelectTrigger className="w-[200px] h-8 text-xs"><SelectValue placeholder="Filtrar por ação" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todas as ações</SelectItem>
              {uniqueAcoes.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={auditFilter.risco} onValueChange={(v) => setAuditFilter(p => ({ ...p, risco: v === '__all__' ? '' : v }))}>
            <SelectTrigger className="w-[180px] h-8 text-xs"><SelectValue placeholder="Filtrar por risco" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos os riscos</SelectItem>
              <SelectItem value="BAIXO">⚪ BAIXO</SelectItem>
              <SelectItem value="MEDIO">🟡 MÉDIO</SelectItem>
              <SelectItem value="ALTO">🔴 ALTO</SelectItem>
            </SelectContent>
          </Select>
          {(auditFilter.acao || auditFilter.risco) && (
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setAuditFilter({ acao: '', risco: '' })}>
              <X className="h-3 w-3 mr-1" />Limpar filtros
            </Button>
          )}
          <span className="text-xs text-muted-foreground self-center ml-auto">{filteredLogs.length} registro(s)</span>
        </div>
        <div className="rounded-xl border border-border/30 bg-card/80 overflow-hidden">
          <ScrollArea className="max-h-[500px]">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border/50 bg-secondary/30 sticky top-0 z-10">
                <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Data</th>
                <th className="text-center py-2 px-3 text-xs font-medium text-muted-foreground">Risco</th>
                <th className="text-center py-2 px-3 text-xs font-medium text-muted-foreground">Ação</th>
                <th className="text-center py-2 px-3 text-xs font-medium text-muted-foreground">Entidade</th>
                <th className="text-center py-2 px-3 text-xs font-medium text-muted-foreground">Campo</th>
                <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">Anterior</th>
                <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">Novo</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Detalhes</th>
              </tr></thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr><td colSpan={8} className="py-8 text-center text-muted-foreground">Nenhum registro encontrado.</td></tr>
                ) : filteredLogs.map((log, i) => {
                  const risco = log.nivel_risco || 'BAIXO';
                  return (
                    <tr key={i} className={cn("border-b border-border/30 hover:bg-secondary/30", risco === 'ALTO' && 'bg-destructive/5')}>
                      <td className="py-2 px-3 text-xs text-muted-foreground whitespace-nowrap">{new Date(log.data).toLocaleString('pt-BR')}</td>
                      <td className="py-2 px-3 text-center"><Badge className={cn('text-xs', riscoBadge(risco))}>{riscoIcon(risco)} {risco}</Badge></td>
                      <td className="py-2 px-3 text-center"><Badge className={cn('text-xs', acaoBadge(log.acao))}>{acaoIcon(log.acao)} {log.acao}</Badge></td>
                      <td className="py-2 px-3 text-center"><Badge variant="outline" className="text-xs">{log.entidade || '-'}</Badge></td>
                      <td className="py-2 px-3 text-center text-xs text-muted-foreground">{log.campo_alterado || '-'}</td>
                      <td className="py-2 px-3 text-right text-xs text-muted-foreground">{log.valor_antigo != null ? fmt(log.valor_antigo) : '-'}</td>
                      <td className="py-2 px-3 text-right text-xs font-medium">{log.valor_novo != null ? fmt(log.valor_novo) : '-'}</td>
                      <td className="py-2 px-3 text-xs text-muted-foreground max-w-[180px] truncate" title={log.detalhes || ''}>{log.detalhes || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </ScrollArea>
        </div>
      </div>
    );
  };

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

  // ====================== ESTOFADOS PERFORMANCE LAYER ======================
  const renderEstofados = () => {
    // ===== Camada 1: Inteligência =====
    const faturamento = data!.faturamento;
    const pe = pontoEquilibrioCalc;
    const margemContribPerc = margemContribuicao * 100;
    const lucroLiq = data!.ebitda;
    const pctSobrePE = pe > 0 ? ((faturamento - pe) / pe) * 100 : 0;

    let statusBadge: { label: string; emoji: string; className: string };
    let interpretacaoIA: string;
    if (faturamento < pe) {
      statusBadge = { label: 'Risco', emoji: '🔴', className: 'bg-destructive/20 text-destructive border-destructive/40' };
      interpretacaoIA = `A operação está ${Math.abs(pctSobrePE).toFixed(1)}% ABAIXO do Ponto de Equilíbrio — indica zona de PREJUÍZO. Reforce vendas ou reduza custo fixo.`;
    } else if (pctSobrePE <= 20) {
      statusBadge = { label: 'Atenção', emoji: '🟡', className: 'bg-warning/20 text-warning border-warning/40' };
      interpretacaoIA = `A operação está ${pctSobrePE.toFixed(1)}% acima do PE — zona de ATENÇÃO. Margem de segurança baixa, ainda exposta a oscilações.`;
    } else if (pctSobrePE <= 80) {
      statusBadge = { label: 'Saudável', emoji: '🟢', className: 'bg-success/20 text-success border-success/40' };
      interpretacaoIA = `A operação está ${pctSobrePE.toFixed(1)}% acima do PE — desempenho SAUDÁVEL com margem de segurança consistente.`;
    } else {
      statusBadge = { label: 'Alta Performance', emoji: '🚀', className: 'bg-cif/20 text-cif border-cif/40' };
      interpretacaoIA = `A operação está ${pctSobrePE.toFixed(1)}% acima do PE — ALTA PERFORMANCE. Reaplique resultado em capacidade ou expansão.`;
    }

    // ===== Camada 2: Visual — Faturamento × Custo Total × Linha PE =====
    const visualData = data!.receitaMensal.map(m => ({
      mes: m.mes,
      faturamento: m.receita,
      custoTotal: m.despesa,
      pontoEquilibrio: pe,
    }));

    // ===== Camada 3: Histórica — divisão de matéria-prima estofados =====
    // Procura categorias específicas; se ausente, deriva via proxy proporcional do despesasByCat
    const transacoesPagas = data!.transacoes.filter(t => t.status === 'PAGO');
    const monthlyHist: Record<string, {
      faturamento: number; custoFixo: number; espuma: number; tecido: number;
      madeira: number; impostos: number; comissoes: number;
    }> = {};

    transacoesPagas.forEach(t => {
      const d = new Date(t.data_emissao);
      const key = `${MESES[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`;
      if (!monthlyHist[key]) {
        monthlyHist[key] = { faturamento: 0, custoFixo: 0, espuma: 0, tecido: 0, madeira: 0, impostos: 0, comissoes: 0 };
      }
      const v = Number(t.valor);
      const cat = (t.categoria || '').toLowerCase();
      if (t.tipo === 'RECEITA') {
        monthlyHist[key].faturamento += v;
      } else {
        if (cat.includes('espuma')) monthlyHist[key].espuma += v;
        else if (cat.includes('tecido')) monthlyHist[key].tecido += v;
        else if (cat.includes('madeira')) monthlyHist[key].madeira += v;
        else if (cat.includes('imposto')) monthlyHist[key].impostos += v;
        else if (cat.includes('comiss')) monthlyHist[key].comissoes += v;
        else if (cat === 'aluguel' || cat === 'energia' || cat === 'administrativo' || cat === 'manutencao') {
          monthlyHist[key].custoFixo += v;
        } else if (cat === 'materiais') {
          // Quebra proxy: 40% espuma, 35% tecido, 25% madeira (típico estofados)
          monthlyHist[key].espuma += v * 0.40;
          monthlyHist[key].tecido += v * 0.35;
          monthlyHist[key].madeira += v * 0.25;
        }
      }
      // Impostos/comissões derivados da config se não houver categoria explícita
    });

    const tabelaHistorica = Object.entries(monthlyHist).map(([mes, m]) => {
      const impostosCalc = m.impostos > 0 ? m.impostos : m.faturamento * (configFin.impostos_percentual / 100);
      const comissoesCalc = m.comissoes > 0 ? m.comissoes : m.faturamento * (configFin.comissoes_percentual / 100);
      const custoVarTotal = m.espuma + m.tecido + m.madeira + impostosCalc + comissoesCalc;
      const resultado = m.faturamento - m.custoFixo - custoVarTotal;
      const resultadoPerc = m.faturamento > 0 ? (resultado / m.faturamento) * 100 : 0;
      const margemContribMes = m.faturamento > 0 ? (m.faturamento - custoVarTotal) / m.faturamento : 0;
      const peMes = margemContribMes > 0 ? m.custoFixo / margemContribMes : 0;
      return {
        mes,
        faturamento: m.faturamento,
        custoFixo: m.custoFixo,
        espuma: m.espuma,
        tecido: m.tecido,
        madeira: m.madeira,
        impostos: impostosCalc,
        comissoes: comissoesCalc,
        resultado,
        resultadoPerc,
        pe: peMes,
      };
    }).reverse();

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="p-3 rounded-lg bg-cif/10 border border-cif/30">
          <p className="text-sm text-muted-foreground">
            <strong className="text-cif">CIF Control · Performance Industrial — Fábrica de Estofados</strong> — Camada de Inteligência, Visual e Histórica integradas.
          </p>
        </div>

        {/* ====== CAMADA 1: INTELIGÊNCIA (TOP CARDS) ====== */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-cif" />
            <h3 className="text-lg font-bold text-foreground">Camada de Inteligência</h3>
            <Badge className={cn("ml-auto text-sm font-bold border", statusBadge.className)}>
              {statusBadge.emoji} {statusBadge.label}
            </Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-card border border-border/30">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-cif" />
                <p className="text-xs text-muted-foreground">Faturamento</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{fmt(faturamento)}</p>
              <p className="text-xs text-muted-foreground mt-1">Receita realizada</p>
            </div>

            <div className="p-4 rounded-xl bg-card border border-border/30">
              <div className="flex items-center gap-2 mb-2">
                <Scale className="h-4 w-4 text-warning" />
                <p className="text-xs text-muted-foreground">Ponto de Equilíbrio</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{fmt(pe)}</p>
              <p className="text-xs text-muted-foreground mt-1">Custo Fixo ÷ Margem</p>
            </div>

            <div className="p-4 rounded-xl bg-card border border-border/30">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-success" />
                <p className="text-xs text-muted-foreground">Margem Contribuição</p>
              </div>
              <p className={cn("text-2xl font-bold", margemContribPerc > 0 ? "text-success" : "text-destructive")}>
                {margemContribPerc.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">Receita - Custos Var.</p>
            </div>

            <div className="p-4 rounded-xl bg-card border border-border/30">
              <div className="flex items-center gap-2 mb-2">
                <PiggyBank className="h-4 w-4 text-cif" />
                <p className="text-xs text-muted-foreground">Lucro Líquido</p>
              </div>
              <p className={cn("text-2xl font-bold", lucroLiq >= 0 ? "text-success" : "text-destructive")}>
                {fmt(lucroLiq)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{margemLiquida.toFixed(1)}% sobre receita</p>
            </div>
          </div>

          {/* Interpretador IA */}
          <div className="p-4 rounded-xl bg-cif/5 border border-cif/30">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-cif/20 flex items-center justify-center flex-shrink-0">
                <Brain className="h-4 w-4 text-cif" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-cif mb-1">🧠 INTERPRETADOR IA</p>
                <p className="text-sm text-foreground leading-relaxed">{interpretacaoIA}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ====== CAMADA 2: VISUAL (BREAK-EVEN POINT) ====== */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-cif" />
            <h3 className="text-lg font-bold text-foreground">Camada Visual — Break-Even Point</h3>
          </div>
          <ModuleCard title="Faturamento × Custo Total × Linha de Ponto de Equilíbrio" variant="cif">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={visualData}>
                  <defs>
                    <linearGradient id="fatGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.verde} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={CHART_COLORS.verde} stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="custGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.vermelho} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={CHART_COLORS.vermelho} stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                    formatter={(value: number, name: string) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, name]}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Area type="monotone" dataKey="faturamento" stroke={CHART_COLORS.verde} strokeWidth={2.5} fill="url(#fatGrad)" name="Faturamento" />
                  <Area type="monotone" dataKey="custoTotal" stroke={CHART_COLORS.vermelho} strokeWidth={2.5} fill="url(#custGrad)" name="Custo Total" />
                  <Line type="monotone" dataKey="pontoEquilibrio" stroke={CHART_COLORS.amarelo} strokeWidth={3} strokeDasharray="6 4" dot={false} name="Ponto de Equilíbrio" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ backgroundColor: CHART_COLORS.verde }} />Faturamento (Receita)</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ backgroundColor: CHART_COLORS.vermelho }} />Custo Total</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-1 rounded-sm" style={{ backgroundColor: CHART_COLORS.amarelo }} />Linha PE — onde as áreas cruzam é o <strong className="text-warning">Break-Even Point</strong></span>
            </div>
          </ModuleCard>
        </div>

        {/* ====== CAMADA 3: HISTÓRICA (TABELA EVOLUÇÃO) ====== */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-cif" />
            <h3 className="text-lg font-bold text-foreground">Camada Histórica — Resultados em Função dos Valores Produzidos</h3>
          </div>
          <ModuleCard title="Evolução Mensal — Estofados (Espuma · Tecido · Madeira)" variant="cif">
            <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 380px)', minHeight: '300px' }}>
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-card">
                  <tr className="border-b-2 border-border bg-secondary/50">
                    <th className="text-left py-3 px-3 text-xs font-semibold text-muted-foreground">Mês</th>
                    <th className="text-right py-3 px-3 text-xs font-semibold text-muted-foreground">Faturamento</th>
                    <th className="text-right py-3 px-3 text-xs font-semibold text-muted-foreground">Custos Fixos</th>
                    <th className="text-right py-3 px-3 text-xs font-semibold text-warning" title="Espuma">🟫 Espuma</th>
                    <th className="text-right py-3 px-3 text-xs font-semibold text-cif" title="Tecido">🧵 Tecido</th>
                    <th className="text-right py-3 px-3 text-xs font-semibold text-success" title="Madeira">🪵 Madeira</th>
                    <th className="text-right py-3 px-3 text-xs font-semibold text-muted-foreground">Impostos</th>
                    <th className="text-right py-3 px-3 text-xs font-semibold text-muted-foreground">Comissões</th>
                    <th className="text-right py-3 px-3 text-xs font-semibold text-muted-foreground">Resultado R$</th>
                    <th className="text-right py-3 px-3 text-xs font-semibold text-muted-foreground">Resultado %</th>
                    <th className="text-right py-3 px-3 text-xs font-semibold text-muted-foreground">PE</th>
                  </tr>
                </thead>
                <tbody>
                  {tabelaHistorica.length === 0 ? (
                    <tr><td colSpan={11} className="py-8 text-center text-muted-foreground">Sem dados financeiros cadastrados.</td></tr>
                  ) : tabelaHistorica.map((row, i) => (
                    <tr key={i} className={cn(
                      "border-b border-border/30 hover:bg-secondary/30 transition-colors",
                      row.resultado >= 0 ? "" : "bg-destructive/5"
                    )}>
                      <td className="py-2.5 px-3 font-medium text-foreground">{row.mes}</td>
                      <td className="py-2.5 px-3 text-right font-semibold text-foreground">{fmt(row.faturamento)}</td>
                      <td className="py-2.5 px-3 text-right text-muted-foreground">{fmt(row.custoFixo)}</td>
                      <td className="py-2.5 px-3 text-right text-warning">{fmt(row.espuma)}</td>
                      <td className="py-2.5 px-3 text-right text-cif">{fmt(row.tecido)}</td>
                      <td className="py-2.5 px-3 text-right text-success">{fmt(row.madeira)}</td>
                      <td className="py-2.5 px-3 text-right text-muted-foreground">{fmt(row.impostos)}</td>
                      <td className="py-2.5 px-3 text-right text-muted-foreground">{fmt(row.comissoes)}</td>
                      <td className={cn(
                        "py-2.5 px-3 text-right font-bold",
                        row.resultado >= 0 ? "text-success" : "text-destructive"
                      )}>
                        {row.resultado >= 0 ? '▲ ' : '▼ '}{fmt(row.resultado)}
                      </td>
                      <td className={cn(
                        "py-2.5 px-3 text-right font-bold",
                        row.resultadoPerc >= 0 ? "text-success" : "text-destructive"
                      )}>
                        {row.resultadoPerc.toFixed(1)}%
                      </td>
                      <td className="py-2.5 px-3 text-right text-muted-foreground text-xs">{fmt(row.pe)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 p-2 rounded bg-secondary/20 text-xs text-muted-foreground">
              💡 <strong>Categorias de Estofados</strong>: ao registrar despesas, use <strong className="text-warning">espuma</strong>, <strong className="text-cif">tecido</strong> ou <strong className="text-success">madeira</strong> para classificação automática. Despesas em "materiais" são divididas por proporção típica (40/35/25%).
            </div>
          </ModuleCard>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return renderDashboard();
      case 'estofados': return renderEstofados();
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
        <div className={cn('relative h-full flex-shrink-0 transition-all duration-300', sidebarCollapsed ? 'w-16' : 'w-56')}>
          <aside className="h-full w-full border-r border-border/50 bg-card/30 p-4 overflow-y-auto overflow-x-hidden">
            <SidebarContent isCollapsed={sidebarCollapsed} />
          </aside>
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label={sidebarCollapsed ? 'Expandir menu' : 'Recolher menu'}
            className="absolute right-0 translate-x-1/2 top-6 w-8 h-8 bg-cif border-2 border-background rounded-full flex items-center justify-center hover:bg-cif/80 hover:scale-110 transition-all z-30 shadow-lg shadow-cif/40 text-white">
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
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
