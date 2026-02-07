import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, ComposedChart, Legend,
} from 'recharts';
import { executiveKPIs, chartData } from '@/data/cigData';
import { KPICard } from '@/components/ui/KPICard';
import { ModuleCard } from '@/components/ui/ModuleCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Wallet, TrendingUp, DollarSign, PiggyBank, CreditCard, BarChart2,
  Brain, Home, ChevronLeft, ChevronRight, Menu, X,
  Target, Shield, Gauge, AlertTriangle, CheckCircle2,
  FileText, Eye, Activity, Scale
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

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

// Data
const receitaCusto = [
  { mes: 'Jan', receita: 145000, custo: 112000, margem: 22.8 },
  { mes: 'Fev', receita: 158000, custo: 118000, margem: 25.3 },
  { mes: 'Mar', receita: 172000, custo: 128000, margem: 25.6 },
  { mes: 'Abr', receita: 168000, custo: 125000, margem: 25.6 },
  { mes: 'Mai', receita: 179188, custo: 142888, margem: 20.3 },
  { mes: 'Jun', receita: 185000, custo: 145000, margem: 21.6 },
];

const fluxoCaixaMensal = [
  { mes: 'Jan', entradas: 145000, saidas: 118000, saldo: 27000 },
  { mes: 'Fev', entradas: 158000, saidas: 125000, saldo: 33000 },
  { mes: 'Mar', entradas: 172000, saidas: 135000, saldo: 37000 },
  { mes: 'Abr', entradas: 168000, saidas: 130000, saldo: 38000 },
  { mes: 'Mai', entradas: 179188, saidas: 148000, saldo: 31188 },
  { mes: 'Jun', entradas: 185000, saidas: 150000, saldo: 35000 },
];

const custosPorCategoria = [
  { categoria: 'Matéria Prima', valor: 68000, percentual: 47.6, color: CHART_COLORS.vermelho },
  { categoria: 'Mão de Obra', valor: 42000, percentual: 29.4, color: CHART_COLORS.laranja },
  { categoria: 'Energia', valor: 12000, percentual: 8.4, color: CHART_COLORS.amarelo },
  { categoria: 'Logística', valor: 15000, percentual: 10.5, color: CHART_COLORS.verde },
  { categoria: 'Outros', valor: 5888, percentual: 4.1, color: CHART_COLORS.azulMarinho },
];

const custoFixoVariavel = [
  { mes: 'Jan', fixo: 52000, variavel: 60000 },
  { mes: 'Fev', fixo: 52000, variavel: 66000 },
  { mes: 'Mar', fixo: 53000, variavel: 75000 },
  { mes: 'Abr', fixo: 53000, variavel: 72000 },
  { mes: 'Mai', fixo: 54000, variavel: 88888 },
  { mes: 'Jun', fixo: 54000, variavel: 91000 },
];

const rentabilidadeSKU = [
  { sku: 'Sofá 3L', preco: 2800, custo: 1820, margem: 35, volume: 45 },
  { sku: 'Poltrona R', preco: 1200, custo: 840, margem: 30, volume: 62 },
  { sku: 'Sofá Retrátil', preco: 3500, custo: 2450, margem: 30, volume: 28 },
  { sku: 'Puff Grande', preco: 450, custo: 270, margem: 40, volume: 95 },
  { sku: 'Cama Box', preco: 1800, custo: 1260, margem: 30, volume: 35 },
  { sku: 'Cabeceira', preco: 650, custo: 390, margem: 40, volume: 48 },
];

const auditoriaLogs = [
  { data: '2025-02-05', tipo: 'NF-e', descricao: 'NF-e 00145 — entrada conferida', status: 'ok' },
  { data: '2025-02-04', tipo: 'Conciliação', descricao: 'Extrato bancário conciliado — sem divergência', status: 'ok' },
  { data: '2025-02-03', tipo: 'Anomalia', descricao: 'Duplicidade de lançamento detectada — R$ 2.450', status: 'alerta' },
  { data: '2025-02-02', tipo: 'Fiscal', descricao: 'DARF vencida — IRPJ competência 01/2025', status: 'critico' },
  { data: '2025-02-01', tipo: 'NF-e', descricao: 'NF-e 00139 — entrada conferida', status: 'ok' },
  { data: '2025-01-30', tipo: 'Conciliação', descricao: 'Divergência de R$ 1.200 no extrato — em análise', status: 'alerta' },
];

// Ponto de equilíbrio
const custoFixoTotal = 54000;
const margemContribuicaoPercent = 35;
const pontoEquilibrio = custoFixoTotal / (margemContribuicaoPercent / 100);
const faturamentoAtual = 185000;
const diferencaEquilibrio = faturamentoAtual - pontoEquilibrio;
const percentualAcima = ((diferencaEquilibrio / pontoEquilibrio) * 100).toFixed(1);
const statusEquilibrio = diferencaEquilibrio > 0 ? 'acima' : diferencaEquilibrio === 0 ? 'empate' : 'abaixo';

// EBITDA simplificado
const ebitda = faturamentoAtual - (custoFixoTotal + 91000);
const margemLiquida = ((ebitda / faturamentoAtual) * 100).toFixed(1);

interface DashboardCIFProps {
  onGoHome?: () => void;
}

export function DashboardCIF({ onGoHome }: DashboardCIFProps) {
  const [activeTab, setActiveTab] = useState<CIFTab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isMobile = useIsMobile();

  const handleTabChange = (tabId: CIFTab) => {
    setActiveTab(tabId);
    setSidebarOpen(false);
  };

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

  // === DASHBOARD EXECUTIVO ===
  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPICard title="Saldo de Caixa" value={`R$ ${(fluxoCaixaMensal[5].saldo / 1000).toFixed(0)}k`} subtitle="Atual" icon={<Wallet className="h-5 w-5" />} variant="cif" trend="up" trendValue="+12%" />
        <KPICard title="Faturamento" value={`R$ ${(faturamentoAtual / 1000).toFixed(0)}k`} subtitle="Este mês" icon={<DollarSign className="h-5 w-5" />} variant="cif" trend="up" trendValue="+6.7%" />
        <KPICard title="Custo Total" value={`R$ ${((custoFixoTotal + 91000) / 1000).toFixed(0)}k`} subtitle="Este mês" icon={<CreditCard className="h-5 w-5" />} variant="cif" trend="up" trendValue="+3.2%" />
        <KPICard title="EBITDA" value={`R$ ${(ebitda / 1000).toFixed(0)}k`} subtitle="Resultado" icon={<TrendingUp className="h-5 w-5" />} variant="cif" trend={ebitda > 0 ? 'up' : 'down'} trendValue={ebitda > 0 ? 'Positivo' : 'Negativo'} />
        <KPICard title="Margem Líquida" value={`${margemLiquida}%`} subtitle="Rentabilidade" icon={<PiggyBank className="h-5 w-5" />} variant="cif" />
        {/* Ponto de Equilíbrio Badge */}
        <div className={cn(
          "p-3 rounded-xl border flex flex-col justify-center items-center",
          statusEquilibrio === 'acima' ? "bg-success/10 border-success/30" :
          statusEquilibrio === 'empate' ? "bg-warning/10 border-warning/30" :
          "bg-destructive/10 border-destructive/30"
        )}>
          <span className="text-[10px] text-muted-foreground uppercase">Ponto de Equilíbrio</span>
          <span className={cn("text-sm font-bold mt-1",
            statusEquilibrio === 'acima' ? "text-success" :
            statusEquilibrio === 'empate' ? "text-warning" : "text-destructive"
          )}>
            {statusEquilibrio === 'acima' ? `${percentualAcima}% ACIMA` :
             statusEquilibrio === 'empate' ? 'EMPATE' : `${Math.abs(Number(percentualAcima))}% ABAIXO`}
          </span>
          <span className="text-[9px] text-muted-foreground mt-0.5">
            {statusEquilibrio === 'acima' ? '🟢 Lucro' : statusEquilibrio === 'empate' ? '🟡 Neutro' : '🔴 Prejuízo'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ModuleCard title="Receita vs Custo" variant="cif">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={receitaCusto}>
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
              <ComposedChart data={receitaCusto.map(r => ({ mes: r.mes, faturamento: r.receita, equilibrio: pontoEquilibrio }))}>
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

  // === FLUXO DE CAIXA ===
  const renderFluxo = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard title="Entradas" value={`R$ ${(fluxoCaixaMensal[5].entradas / 1000).toFixed(0)}k`} subtitle="Este mês" icon={<TrendingUp className="h-5 w-5" />} variant="cif" trend="up" trendValue="+3.2%" />
        <KPICard title="Saídas" value={`R$ ${(fluxoCaixaMensal[5].saidas / 1000).toFixed(0)}k`} subtitle="Este mês" icon={<CreditCard className="h-5 w-5" />} variant="cif" trend="up" trendValue="+1.4%" />
        <KPICard title="Saldo" value={`R$ ${(fluxoCaixaMensal[5].saldo / 1000).toFixed(0)}k`} subtitle="Líquido" icon={<Wallet className="h-5 w-5" />} variant="cif" trend="up" trendValue="+12%" />
        <KPICard title="Projeção 30d" value={`R$ ${(38000 / 1000).toFixed(0)}k`} subtitle="Estimado" icon={<Brain className="h-5 w-5" />} variant="cif" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ModuleCard title="Fluxo de Caixa Mensal" variant="cif">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fluxoCaixaMensal}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="mes" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, '']} />
                <Legend />
                <Bar dataKey="entradas" fill={CHART_COLORS.verde} name="Entradas" radius={[4, 4, 0, 0]} />
                <Bar dataKey="saidas" fill={CHART_COLORS.vermelho} name="Saídas" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ModuleCard>
        <ModuleCard title="Saldo Acumulado" variant="cif">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={fluxoCaixaMensal}>
                <defs>
                  <linearGradient id="colorSaldoCIF" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.verdeEscuro} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={CHART_COLORS.verdeEscuro} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="mes" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Saldo']} />
                <Area type="monotone" dataKey="saldo" stroke={CHART_COLORS.verdeEscuro} strokeWidth={2} fill="url(#colorSaldoCIF)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ModuleCard>
      </div>
      <ModuleCard title="Fluxo de Caixa Semanal" variant="cif">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData.fluxoCaixa}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="semana" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, '']} />
              <Legend />
              <Bar dataKey="entradas" fill={CHART_COLORS.verde} name="Entradas" radius={[4, 4, 0, 0]} />
              <Bar dataKey="saidas" fill={CHART_COLORS.vermelho} name="Saídas" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ModuleCard>
    </div>
  );

  // === CUSTOS & ORÇAMENTO ===
  const renderCustos = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard title="Custo Fixo" value={`R$ ${(custoFixoTotal / 1000).toFixed(0)}k`} subtitle="Mensal" icon={<CreditCard className="h-5 w-5" />} variant="cif" />
        <KPICard title="Custo Variável" value="R$ 91k" subtitle="Este mês" icon={<Activity className="h-5 w-5" />} variant="cif" trend="up" trendValue="+2.4%" />
        <KPICard title="CPV" value="R$ 145k" subtitle="Custo Prod. Vendida" icon={<Target className="h-5 w-5" />} variant="cif" />
        <KPICard title="Margem Contribuição" value={`${margemContribuicaoPercent}%`} subtitle="Média" icon={<TrendingUp className="h-5 w-5" />} variant="cif" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ModuleCard title="Composição de Custos" variant="cif">
          <div className="h-64 flex items-center">
            <div className="w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={custosPorCategoria} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="valor">
                    {custosPorCategoria.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, '']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 space-y-2">
              {custosPorCategoria.map((item, index) => (
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
        <ModuleCard title="Custo Fixo vs Variável" variant="cif">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={custoFixoVariavel}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="mes" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, '']} />
                <Legend />
                <Bar dataKey="fixo" fill={CHART_COLORS.azulMarinho} name="Fixo" radius={[4, 4, 0, 0]} />
                <Bar dataKey="variavel" fill={CHART_COLORS.laranja} name="Variável" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ModuleCard>
      </div>
      <ModuleCard title="Evolução da Margem" variant="cif">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={receitaCusto}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="mes" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickFormatter={(v) => `${v}%`} domain={[15, 30]} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(value: number) => [`${value.toFixed(1)}%`, 'Margem']} />
              <Line type="monotone" dataKey="margem" stroke={CHART_COLORS.verdeEscuro} strokeWidth={3} dot={{ fill: CHART_COLORS.verdeEscuro, strokeWidth: 2, r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ModuleCard>
    </div>
  );

  // === PONTO DE EQUILÍBRIO ===
  const renderEquilibrio = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border/30">
          <p className="text-xs text-muted-foreground">Ponto de Equilíbrio (R$)</p>
          <p className="text-2xl font-bold text-foreground mt-1">R$ {(pontoEquilibrio / 1000).toFixed(0)}k</p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border/30">
          <p className="text-xs text-muted-foreground">Custo Fixo Total</p>
          <p className="text-2xl font-bold text-foreground mt-1">R$ {(custoFixoTotal / 1000).toFixed(0)}k</p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border/30">
          <p className="text-xs text-muted-foreground">Margem Contribuição</p>
          <p className="text-2xl font-bold text-foreground mt-1">{margemContribuicaoPercent}%</p>
        </div>
        <div className={cn(
          "p-4 rounded-xl border-2",
          statusEquilibrio === 'acima' ? "bg-success/10 border-success/50" :
          statusEquilibrio === 'empate' ? "bg-warning/10 border-warning/50" :
          "bg-destructive/10 border-destructive/50"
        )}>
          <p className="text-xs text-muted-foreground">Status da Fábrica</p>
          <p className={cn("text-xl font-bold mt-1",
            statusEquilibrio === 'acima' ? "text-success" :
            statusEquilibrio === 'empate' ? "text-warning" : "text-destructive"
          )}>
            {statusEquilibrio === 'acima' ? '🟢 ACIMA' : statusEquilibrio === 'empate' ? '🟡 EMPATE' : '🔴 ABAIXO'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Fábrica operando {percentualAcima}% {statusEquilibrio === 'acima' ? 'acima' : 'abaixo'} do ponto de equilíbrio
          </p>
        </div>
      </div>

      <ModuleCard title="Faturamento x Ponto de Equilíbrio" variant="cif">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={receitaCusto.map(r => ({ mes: r.mes, faturamento: r.receita, equilibrio: pontoEquilibrio }))}>
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

      {/* Gauge visual simples */}
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

  // === RENTABILIDADE & PRICING ===
  const renderRentabilidade = () => (
    <div className="space-y-6">
      <div className="p-3 rounded-lg bg-cif/10 border border-cif/30">
        <p className="text-sm text-muted-foreground"><strong className="text-cif">Rentabilidade & Pricing</strong> — Margem por SKU, simulação de preço e impacto no EBITDA.</p>
      </div>
      <div className="rounded-xl border border-border/30 bg-card/80 overflow-hidden" style={{ height: '400px' }}>
        <ScrollArea className="h-full">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border/50 bg-secondary/30 sticky top-0 z-10">
              <th className="text-left py-3 px-4 text-muted-foreground font-medium">SKU / Produto</th>
              <th className="text-right py-3 px-4 text-muted-foreground font-medium">Preço Venda</th>
              <th className="text-right py-3 px-4 text-muted-foreground font-medium">Custo</th>
              <th className="text-center py-3 px-4 text-muted-foreground font-medium">Margem %</th>
              <th className="text-center py-3 px-4 text-muted-foreground font-medium">Vol. Mês</th>
              <th className="text-right py-3 px-4 text-muted-foreground font-medium">Receita Total</th>
            </tr></thead>
            <tbody>
              {rentabilidadeSKU.map((s, i) => (
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
      <ModuleCard title="Margem por Produto" variant="cif">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rentabilidadeSKU}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="sku" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(value: number) => [`${value}%`, 'Margem']} />
              <Bar dataKey="margem" radius={[4, 4, 0, 0]}>
                {rentabilidadeSKU.map((s, i) => (
                  <Cell key={i} fill={s.margem >= 35 ? CHART_COLORS.verde : s.margem >= 25 ? CHART_COLORS.amarelo : CHART_COLORS.vermelho} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ModuleCard>
    </div>
  );

  // === AUDITORIA & COMPLIANCE ===
  const renderAuditoria = () => (
    <div className="space-y-6">
      <div className="p-3 rounded-lg bg-cif/10 border border-cif/30">
        <p className="text-sm text-muted-foreground"><strong className="text-cif">Auditoria & Compliance</strong> — NF-e, conciliação, anomalias e alertas fiscais. Logs imutáveis.</p>
      </div>
      <div className="rounded-xl border border-border/30 bg-card/80 overflow-hidden" style={{ height: '400px' }}>
        <ScrollArea className="h-full">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border/50 bg-secondary/30 sticky top-0 z-10">
              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Data</th>
              <th className="text-center py-3 px-4 text-muted-foreground font-medium">Tipo</th>
              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Descrição</th>
              <th className="text-center py-3 px-4 text-muted-foreground font-medium">Status</th>
            </tr></thead>
            <tbody>
              {auditoriaLogs.map((log, i) => (
                <tr key={i} className="border-b border-border/30 hover:bg-secondary/30">
                  <td className="py-3 px-4 text-muted-foreground">{new Date(log.data).toLocaleDateString('pt-BR')}</td>
                  <td className="py-3 px-4 text-center"><Badge variant="outline">{log.tipo}</Badge></td>
                  <td className="py-3 px-4 text-foreground">{log.descricao}</td>
                  <td className="py-3 px-4 text-center">
                    <Badge className={cn(
                      log.status === 'ok' ? 'bg-success/20 text-success' :
                      log.status === 'alerta' ? 'bg-warning/20 text-warning' :
                      'bg-destructive/20 text-destructive'
                    )}>
                      {log.status === 'ok' ? 'OK' : log.status === 'alerta' ? 'Alerta' : 'Crítico'}
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

  // === ANALYTICS ===
  const renderAnalytics = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ModuleCard title="Resultado por Período" variant="cif">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={fluxoCaixaMensal.map(f => ({ mes: f.mes, resultado: f.saldo }))}>
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
              <LineChart data={receitaCusto}>
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

        <ModuleCard title="Pareto de Custos" variant="cif">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={custosPorCategoria} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="categoria" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} width={100} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Valor']} />
                <Bar dataKey="valor" radius={[0, 4, 4, 0]}>
                  {custosPorCategoria.map((c, i) => <Cell key={i} fill={c.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ModuleCard>

        <ModuleCard title="Metas x Realizado" variant="cif">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { item: 'Faturamento', realizado: 185, meta: 200 },
                { item: 'EBITDA', realizado: 40, meta: 50 },
                { item: 'Margem', realizado: 21.6, meta: 25 },
                { item: 'Custos', realizado: 145, meta: 140 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="item" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Legend />
                <Bar dataKey="realizado" fill={CHART_COLORS.verde} name="Realizado" radius={[4, 4, 0, 0]} />
                <Bar dataKey="meta" fill={CHART_COLORS.azulMarinho} name="Meta" radius={[4, 4, 0, 0]} />
              </BarChart>
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

      {/* HOME */}
      <div className={cn("mb-2 pb-2 border-b border-border/30", isCollapsed && "pb-1 mb-1")}>
        <button
          onClick={() => { onGoHome?.(); }}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-primary hover:bg-primary/10 transition-all font-medium',
            isCollapsed && 'justify-center px-2'
          )}
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
              activeTab === item.id
                ? 'bg-cif/20 text-cif font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50',
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
      {/* Mobile Header */}
      {isMobile && (
        <div className="fixed top-12 left-0 right-0 z-40 bg-background/95 backdrop-blur border-b border-border/50 px-4 py-3">
          <div className="flex items-center justify-between">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-4 overflow-y-auto">
                <SheetClose className="absolute right-4 top-4">
                  <X className="h-5 w-5" />
                </SheetClose>
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

      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className={cn(
          'min-h-[calc(100vh-4rem)] border-r border-border/50 bg-card/30 p-4 flex-shrink-0 transition-all duration-300 relative',
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

      {/* Content */}
      <main className={cn(
        'flex-1 space-y-6 overflow-x-hidden',
        isMobile ? 'pt-28 px-3 pb-4' : 'p-4 lg:p-6'
      )}>
        {!isMobile && (
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cif/20 flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-cif" />
                </div>
                {menuItems.find(m => m.id === activeTab)?.label || 'Dashboard'}
              </h2>
              <p className="text-muted-foreground mt-1 ml-13">CIF CONTROL – Central de Inteligência Financeira</p>
            </div>
          </div>
        )}

        {renderContent()}
      </main>
    </div>
  );
}
