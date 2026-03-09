import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, ComposedChart, Legend,
} from 'recharts';
import { KPICard } from '@/components/ui/KPICard';
import { ModuleCard } from '@/components/ui/ModuleCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Wallet, TrendingUp, DollarSign, PiggyBank, CreditCard, BarChart2,
  Brain, Home, ChevronLeft, ChevronRight, Menu, X,
  Target, Shield, Gauge, Activity, Scale, RefreshCw,
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { fetchCIFData, type CIFDashboardData } from '@/services/cifService';
import { supabase } from '@/integrations/supabase/client';

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
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const isMobile = useIsMobile();

  const loadData = async () => {
    setLoading(true);
    const [cifData, logsResult] = await Promise.all([
      fetchCIFData(),
      supabase.from('action_logs').select('*').order('created_at', { ascending: false }).limit(20),
    ]);
    setData(cifData);
    setAuditLogs(logsResult.data || []);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleTabChange = (tabId: CIFTab) => {
    setActiveTab(tabId);
    setSidebarOpen(false);
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const statusEquilibrio = data.faturamento > data.pontoEquilibrio ? 'acima' : data.faturamento === data.pontoEquilibrio ? 'empate' : 'abaixo';
  const percentualAcima = data.pontoEquilibrio > 0 ? (((data.faturamento - data.pontoEquilibrio) / data.pontoEquilibrio) * 100).toFixed(1) : '0';

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

  const fmt = (v: number) => `R$ ${(v / 1000).toFixed(0)}k`;

  const renderDashboard = () => (
    <div className="space-y-6 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPICard title="Faturamento" value={fmt(data!.faturamento)} subtitle="Total pedidos" icon={<DollarSign className="h-5 w-5" />} variant="cif" />
        <KPICard title="Custo MOB" value={fmt(data!.custoMaoDeObra)} subtitle="Mão de obra" icon={<CreditCard className="h-5 w-5" />} variant="cif" />
        <KPICard title="Custo Material" value={fmt(data!.custoMateriais)} subtitle="Em estoque" icon={<CreditCard className="h-5 w-5" />} variant="cif" />
        <KPICard title="EBITDA" value={fmt(data!.ebitda)} subtitle="Resultado" icon={<TrendingUp className="h-5 w-5" />} variant="cif" trend={data!.ebitda > 0 ? 'up' : 'down'} trendValue={data!.ebitda > 0 ? 'Positivo' : 'Negativo'} />
        <KPICard title="Margem Líq." value={`${data!.margemLiquida.toFixed(1)}%`} subtitle="Rentabilidade" icon={<PiggyBank className="h-5 w-5" />} variant="cif" />
        <div className={cn(
          "p-3 rounded-xl border flex flex-col justify-center items-center",
          statusEquilibrio === 'acima' ? "bg-success/10 border-success/30" :
          statusEquilibrio === 'empate' ? "bg-warning/10 border-warning/30" :
          "bg-destructive/10 border-destructive/30"
        )}>
          <span className="text-[10px] text-muted-foreground uppercase">Ponto de Equilíbrio</span>
          <span className={cn("text-sm font-bold mt-1",
            statusEquilibrio === 'acima' ? "text-success" : statusEquilibrio === 'empate' ? "text-warning" : "text-destructive"
          )}>
            {statusEquilibrio === 'acima' ? `${percentualAcima}% ACIMA` : statusEquilibrio === 'empate' ? 'EMPATE' : `${Math.abs(Number(percentualAcima))}% ABAIXO`}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ModuleCard title="Receita vs Custo (Mensal)" variant="cif">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data!.receitaMensal}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="mes" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, '']} />
                <Legend />
                <Bar dataKey="receita" fill={CHART_COLORS.verde} name="Receita" radius={[4, 4, 0, 0]} />
                <Bar dataKey="custo" fill={CHART_COLORS.vermelho} name="Custo" radius={[4, 4, 0, 0]} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </ModuleCard>

        <ModuleCard title="Faturamento x Ponto de Equilíbrio" variant="cif">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data!.receitaMensal.map(r => ({ mes: r.mes, faturamento: r.receita, equilibrio: data!.pontoEquilibrio }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="mes" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, '']} />
                <Legend />
                <Bar dataKey="faturamento" fill={CHART_COLORS.verde} name="Faturamento" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="equilibrio" stroke={CHART_COLORS.vermelho} strokeWidth={2} strokeDasharray="5 5" name="Ponto de Equilíbrio" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </ModuleCard>
      </div>
    </div>
  );

  const renderFluxo = () => (
    <div className="space-y-6 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard title="Faturamento" value={fmt(data!.faturamento)} subtitle="Receita total" icon={<TrendingUp className="h-5 w-5" />} variant="cif" />
        <KPICard title="Custos" value={fmt(data!.custoTotal + data!.custoFixo)} subtitle="Total" icon={<CreditCard className="h-5 w-5" />} variant="cif" />
        <KPICard title="EBITDA" value={fmt(data!.ebitda)} subtitle="Resultado" icon={<Wallet className="h-5 w-5" />} variant="cif" trend={data!.ebitda > 0 ? 'up' : 'down'} trendValue={data!.ebitda > 0 ? 'Positivo' : 'Negativo'} />
        <KPICard title="Pedidos" value={data!.pedidosTotal} subtitle={`${data!.pedidosFaturados} faturados`} icon={<Brain className="h-5 w-5" />} variant="cif" />
      </div>
      <ModuleCard title="Fluxo de Caixa por Período" variant="cif">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data!.receitaMensal}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="mes" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, '']} />
              <Legend />
              <Bar dataKey="receita" fill={CHART_COLORS.verde} name="Entradas" radius={[4, 4, 0, 0]} />
              <Bar dataKey="custo" fill={CHART_COLORS.vermelho} name="Saídas" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ModuleCard>
    </div>
  );

  const renderCustos = () => {
    const custoCategories = [
      { categoria: 'Matéria Prima', valor: data!.custoMateriais * 0.3, color: CHART_COLORS.vermelho },
      { categoria: 'Mão de Obra', valor: data!.custoMaoDeObra, color: CHART_COLORS.laranja },
      { categoria: 'Fixos', valor: data!.custoFixo, color: CHART_COLORS.azulMarinho },
    ];
    const total = custoCategories.reduce((s, c) => s + c.valor, 0);
    const withPercent = custoCategories.map(c => ({ ...c, percentual: total > 0 ? ((c.valor / total) * 100).toFixed(1) : '0' }));

    return (
      <div className="space-y-6 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPICard title="Custo Fixo" value={fmt(data!.custoFixo)} subtitle="Mensal" icon={<CreditCard className="h-5 w-5" />} variant="cif" />
          <KPICard title="Custo MOB" value={fmt(data!.custoMaoDeObra)} subtitle="Variável" icon={<Activity className="h-5 w-5" />} variant="cif" />
          <KPICard title="Custo Material" value={fmt(data!.custoMateriais * 0.3)} subtitle="Consumido" icon={<Target className="h-5 w-5" />} variant="cif" />
          <KPICard title="Margem Contrib." value={`${((data!.faturamento - data!.custoTotal) / Math.max(1, data!.faturamento) * 100).toFixed(0)}%`} subtitle="Média" icon={<TrendingUp className="h-5 w-5" />} variant="cif" />
        </div>
        <ModuleCard title="Composição de Custos" variant="cif">
          <div className="h-64 flex items-center">
            <div className="w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={withPercent} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="valor">
                    {withPercent.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, '']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 space-y-2">
              {withPercent.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-muted-foreground">{item.categoria}</span>
                  </div>
                  <span className="text-xs font-semibold text-foreground">{item.percentual}%</span>
                </div>
              ))}
            </div>
          </div>
        </ModuleCard>
      </div>
    );
  };

  const renderEquilibrio = () => (
    <div className="space-y-6 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border/30">
          <p className="text-xs text-muted-foreground">Ponto de Equilíbrio (R$)</p>
          <p className="text-2xl font-bold text-foreground mt-1">{fmt(data!.pontoEquilibrio)}</p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border/30">
          <p className="text-xs text-muted-foreground">Custo Fixo Total</p>
          <p className="text-2xl font-bold text-foreground mt-1">{fmt(data!.custoFixo)}</p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border/30">
          <p className="text-xs text-muted-foreground">Faturamento Atual</p>
          <p className="text-2xl font-bold text-foreground mt-1">{fmt(data!.faturamento)}</p>
        </div>
        <div className={cn(
          "p-4 rounded-xl border-2",
          statusEquilibrio === 'acima' ? "bg-success/10 border-success/50" :
          statusEquilibrio === 'empate' ? "bg-warning/10 border-warning/50" :
          "bg-destructive/10 border-destructive/50"
        )}>
          <p className="text-xs text-muted-foreground">Status da Fábrica</p>
          <p className={cn("text-xl font-bold mt-1",
            statusEquilibrio === 'acima' ? "text-success" : statusEquilibrio === 'empate' ? "text-warning" : "text-destructive"
          )}>
            {statusEquilibrio === 'acima' ? '🟢 ACIMA' : statusEquilibrio === 'empate' ? '🟡 EMPATE' : '🔴 ABAIXO'}
          </p>
        </div>
      </div>
      <ModuleCard title="Faturamento x Ponto de Equilíbrio" variant="cif">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data!.receitaMensal.map(r => ({ mes: r.mes, faturamento: r.receita, equilibrio: data!.pontoEquilibrio }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="mes" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, '']} />
              <Legend />
              <Bar dataKey="faturamento" fill={CHART_COLORS.verde} name="Faturamento Real" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="equilibrio" stroke={CHART_COLORS.vermelho} strokeWidth={3} strokeDasharray="8 4" name="Ponto de Equilíbrio" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </ModuleCard>
      <div className="p-6 rounded-xl bg-card border border-border/30 text-center">
        <Gauge className="h-12 w-12 mx-auto mb-3 text-cif" />
        <p className="text-lg font-bold text-foreground">Status Operacional</p>
        <div className={cn(
          "inline-block px-6 py-2 rounded-full mt-3 text-sm font-bold",
          statusEquilibrio === 'acima' ? "bg-success/20 text-success" :
          statusEquilibrio === 'empate' ? "bg-warning/20 text-warning" :
          "bg-destructive/20 text-destructive"
        )}>
          Fábrica operando {percentualAcima}% {statusEquilibrio === 'acima' ? 'acima' : 'abaixo'} do ponto de equilíbrio
        </div>
      </div>
    </div>
  );

  const renderRentabilidade = () => (
    <div className="space-y-6 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2">
      <div className="p-3 rounded-lg bg-cif/10 border border-cif/30">
        <p className="text-sm text-muted-foreground"><strong className="text-cif">Rentabilidade & Pricing</strong> — Margem por SKU calculada a partir de dados reais de produção.</p>
      </div>
      <div className="rounded-xl border border-border/30 bg-card/80 overflow-hidden" style={{ maxHeight: '400px' }}>
        <ScrollArea className="h-full">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border/50 bg-secondary/30 sticky top-0 z-10">
              <th className="text-left py-3 px-4 text-muted-foreground font-medium">SKU / Produto</th>
              <th className="text-right py-3 px-4 text-muted-foreground font-medium">Preço Venda</th>
              <th className="text-right py-3 px-4 text-muted-foreground font-medium">Custo</th>
              <th className="text-center py-3 px-4 text-muted-foreground font-medium">Margem %</th>
              <th className="text-center py-3 px-4 text-muted-foreground font-medium">Vol.</th>
              <th className="text-right py-3 px-4 text-muted-foreground font-medium">Receita Total</th>
            </tr></thead>
            <tbody>
              {data!.rentabilidadeSKU.map((s, i) => (
                <tr key={i} className="border-b border-border/30 hover:bg-secondary/30">
                  <td className="py-3 px-4 font-medium text-foreground">{s.sku}</td>
                  <td className="py-3 px-4 text-right">R$ {s.preco.toLocaleString('pt-BR')}</td>
                  <td className="py-3 px-4 text-right text-muted-foreground">R$ {s.custo.toLocaleString('pt-BR')}</td>
                  <td className="py-3 px-4 text-center">
                    <Badge className={cn(s.margem >= 35 ? 'bg-success/20 text-success' : s.margem >= 25 ? 'bg-warning/20 text-warning' : 'bg-destructive/20 text-destructive')}>
                      {s.margem}%
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-center">{s.volume}</td>
                  <td className="py-3 px-4 text-right font-semibold text-cif">R$ {(s.preco * s.volume).toLocaleString('pt-BR')}</td>
                </tr>
              ))}
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
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(value: number) => [`${value}%`, 'Margem']} />
                <Bar dataKey="margem" radius={[4, 4, 0, 0]}>
                  {data!.rentabilidadeSKU.map((s, i) => (
                    <Cell key={i} fill={s.margem >= 35 ? CHART_COLORS.verde : s.margem >= 25 ? CHART_COLORS.amarelo : CHART_COLORS.vermelho} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ModuleCard>
      )}
    </div>
  );

  const renderAuditoria = () => (
    <div className="space-y-6 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2">
      <div className="p-3 rounded-lg bg-cif/10 border border-cif/30">
        <p className="text-sm text-muted-foreground"><strong className="text-cif">Auditoria & Compliance</strong> — Logs de ações do sistema. Registros imutáveis.</p>
      </div>
      <div className="rounded-xl border border-border/30 bg-card/80 overflow-hidden" style={{ maxHeight: '500px' }}>
        <ScrollArea className="h-full">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border/50 bg-secondary/30 sticky top-0 z-10">
              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Data</th>
              <th className="text-center py-3 px-4 text-muted-foreground font-medium">Ação</th>
              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Entidade</th>
              <th className="text-center py-3 px-4 text-muted-foreground font-medium">Status</th>
            </tr></thead>
            <tbody>
              {auditLogs.length === 0 ? (
                <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">Nenhum log registrado.</td></tr>
              ) : auditLogs.map((log, i) => (
                <tr key={i} className="border-b border-border/30 hover:bg-secondary/30">
                  <td className="py-3 px-4 text-muted-foreground">{new Date(log.created_at).toLocaleString('pt-BR')}</td>
                  <td className="py-3 px-4 text-center"><Badge variant="outline">{log.action}</Badge></td>
                  <td className="py-3 px-4 text-foreground">{log.entity}</td>
                  <td className="py-3 px-4 text-center">
                    <Badge className={cn(log.status === 'success' ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive')}>
                      {log.status === 'success' ? 'OK' : 'Erro'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollArea>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ModuleCard title="Resultado por Período" variant="cif">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data!.receitaMensal.map(r => ({ mes: r.mes, resultado: r.receita - r.custo }))}>
                <defs>
                  <linearGradient id="colorResultadoCIF" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.verdeEscuro} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={CHART_COLORS.verdeEscuro} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="mes" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Resultado']} />
                <Area type="monotone" dataKey="resultado" stroke={CHART_COLORS.verdeEscuro} strokeWidth={2} fill="url(#colorResultadoCIF)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ModuleCard>

        <ModuleCard title="Receita vs Custo (Tendência)" variant="cif">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data!.receitaMensal}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="mes" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, '']} />
                <Legend />
                <Line type="monotone" dataKey="receita" stroke={CHART_COLORS.verde} strokeWidth={2} name="Receita" dot={{ r: 4 }} />
                <Line type="monotone" dataKey="custo" stroke={CHART_COLORS.vermelho} strokeWidth={2} name="Custo" dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ModuleCard>
      </div>
    </div>
  );

  // === SIDEBAR ===
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
        <button
          onClick={() => { onGoHome?.(); }}
          className={cn('w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-primary hover:bg-primary/10 transition-all font-medium', isCollapsed && 'justify-center px-2')}
        >
          <Home className="h-4 w-4 flex-shrink-0" />
          {!isCollapsed && <span>HOME</span>}
        </button>
      </div>
      <nav className="space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleTabChange(item.id)}
            title={isCollapsed ? item.label : undefined}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all',
              activeTab === item.id ? 'bg-cif/20 text-cif font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50',
              isCollapsed && 'justify-center px-2'
            )}
          >
            <item.icon className="h-4 w-4 flex-shrink-0" />
            {!isCollapsed && <span className="truncate">{item.label}</span>}
          </button>
        ))}
      </nav>
    </>
  );

  return (
    <div className="flex animate-fade-in min-h-screen">
      {isMobile && (
        <div className="fixed top-12 left-0 right-0 z-40 bg-background/95 backdrop-blur border-b border-border/50 px-4 py-3">
          <div className="flex items-center justify-between">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10"><Menu className="h-6 w-6" /></Button>
              </SheetTrigger>
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
        <aside className={cn(
          'h-full border-r border-border/50 bg-card/30 p-4 flex-shrink-0 transition-all duration-300 relative overflow-y-auto',
          sidebarCollapsed ? 'w-16' : 'w-56'
        )}>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="absolute -right-3 top-6 w-6 h-6 bg-card border border-border rounded-full flex items-center justify-center hover:bg-secondary transition-colors z-10"
          >
            {sidebarCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
          </button>
          <SidebarContent isCollapsed={sidebarCollapsed} />
        </aside>
      )}

      <main className={cn(
        'flex-1',
        isMobile ? 'pt-28 px-3 pb-4' : 'p-4 lg:p-6'
      )}>
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
    </div>
  );
}
