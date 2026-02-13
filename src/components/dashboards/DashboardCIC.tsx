import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, ComposedChart, Legend,
} from 'recharts';
import { CICEstoqueOperacional } from '@/components/cic/CICEstoqueOperacional';
import { executiveKPIs } from '@/data/cigData';
import { KPICard } from '@/components/ui/KPICard';
import { ModuleCard } from '@/components/ui/ModuleCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Package, AlertTriangle, ShoppingCart, BarChart2,
  Warehouse, Users, Brain, Activity, Home, Zap,
  ArrowUpCircle, ClipboardList, DollarSign,
  Search, Filter, Plus, Edit, Clock, TrendingUp,
  CheckCircle2, FileText, ChevronLeft, ChevronRight, Menu, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';

// Cores da paleta obrigatória
const CHART_COLORS = {
  azulMarinho: 'hsl(215, 75%, 48%)',
  verde: 'hsl(145, 70%, 42%)',
  amarelo: 'hsl(45, 95%, 50%)',
  vermelho: 'hsl(0, 72%, 51%)',
  laranja: 'hsl(30, 90%, 50%)',
  azulClaro: 'hsl(200, 75%, 50%)',
};

// Dados mockados do CIC
const consumoPeriodo = [
  { mes: 'Jan', consumo: 145000, planejado: 150000 },
  { mes: 'Fev', consumo: 152000, planejado: 150000 },
  { mes: 'Mar', consumo: 148000, planejado: 155000 },
  { mes: 'Abr', consumo: 160000, planejado: 158000 },
  { mes: 'Mai', consumo: 156780, planejado: 160000 },
  { mes: 'Jun', consumo: 165000, planejado: 162000 },
];

const comprasStatus = [
  { status: 'Realizadas', valor: 425000, color: CHART_COLORS.verde },
  { status: 'Pendentes', valor: 185000, color: CHART_COLORS.amarelo },
  { status: 'Em Trânsito', valor: 95000, color: CHART_COLORS.azulMarinho },
  { status: 'Atrasadas', valor: 45000, color: CHART_COLORS.vermelho },
];

const fornecedoresTop = [
  { nome: 'Madeireira São Paulo', valor: 125000, entregas: 98, leadTime: 5, otif: 96 },
  { nome: 'Têxtil Guarulhos', valor: 98000, entregas: 95, leadTime: 7, otif: 92 },
  { nome: 'Espumas Brasil', valor: 87000, entregas: 92, leadTime: 4, otif: 88 },
  { nome: 'Metalúrgica ABC', valor: 65000, entregas: 88, leadTime: 10, otif: 85 },
  { nome: 'Ferragens Nacional', valor: 45000, entregas: 94, leadTime: 6, otif: 91 },
  { nome: 'Colas Industrial', valor: 32000, entregas: 90, leadTime: 3, otif: 93 },
  { nome: 'Embalagens PR', valor: 28000, entregas: 96, leadTime: 4, otif: 95 },
];

const materiais = [
  { id: '1', codigo: 'MAT-001', nome: 'Espuma D28', categoria: 'Espuma', estoque: 450, minimo: 500, maximo: 2000, seguranca: 600, unidade: 'kg', ultimaEntrada: '2025-01-28', fornecedor: 'Espumas Brasil', custo: 12.50 },
  { id: '2', codigo: 'MAT-002', nome: 'Tecido Suede', categoria: 'Tecido', estoque: 280, minimo: 400, maximo: 1500, seguranca: 500, unidade: 'm²', ultimaEntrada: '2025-01-25', fornecedor: 'Têxtil Guarulhos', custo: 28.00 },
  { id: '3', codigo: 'MAT-003', nome: 'Madeira Pinus', categoria: 'Madeira', estoque: 1200, minimo: 1000, maximo: 3000, seguranca: 1200, unidade: 'un', ultimaEntrada: '2025-02-01', fornecedor: 'Madeireira São Paulo', custo: 8.50 },
  { id: '4', codigo: 'MAT-004', nome: 'Percinta', categoria: 'Acessório', estoque: 150, minimo: 200, maximo: 800, seguranca: 250, unidade: 'm', ultimaEntrada: '2025-01-20', fornecedor: 'Ferragens Nacional', custo: 3.20 },
  { id: '5', codigo: 'MAT-005', nome: 'Cola PVA', categoria: 'Químico', estoque: 85, minimo: 100, maximo: 400, seguranca: 120, unidade: 'L', ultimaEntrada: '2025-01-30', fornecedor: 'Colas Industrial', custo: 15.00 },
  { id: '6', codigo: 'MAT-006', nome: 'Parafuso M6', categoria: 'Fixação', estoque: 5000, minimo: 3000, maximo: 10000, seguranca: 4000, unidade: 'un', ultimaEntrada: '2025-02-02', fornecedor: 'Ferragens Nacional', custo: 0.12 },
  { id: '7', codigo: 'MAT-007', nome: 'TNT', categoria: 'Tecido', estoque: 600, minimo: 500, maximo: 2000, seguranca: 700, unidade: 'm²', ultimaEntrada: '2025-01-27', fornecedor: 'Têxtil Guarulhos', custo: 4.50 },
  { id: '8', codigo: 'MAT-008', nome: 'Mola Bonnel', categoria: 'Metal', estoque: 320, minimo: 300, maximo: 1000, seguranca: 400, unidade: 'un', ultimaEntrada: '2025-01-22', fornecedor: 'Metalúrgica ABC', custo: 22.00 },
];

const mrpNecessidades = [
  { material: 'Espuma D28', necessidade: 800, estoque: 450, deficit: 350, sugestao: 'Comprar 400 kg', urgencia: 'alta' },
  { material: 'Tecido Suede', necessidade: 600, estoque: 280, deficit: 320, sugestao: 'Comprar 350 m²', urgencia: 'alta' },
  { material: 'Percinta', necessidade: 300, estoque: 150, deficit: 150, sugestao: 'Comprar 200 m', urgencia: 'media' },
  { material: 'Cola PVA', necessidade: 120, estoque: 85, deficit: 35, sugestao: 'Comprar 50 L', urgencia: 'media' },
  { material: 'Madeira Pinus', necessidade: 900, estoque: 1200, deficit: 0, sugestao: 'Estoque suficiente', urgencia: 'baixa' },
];

const requisicoes = [
  { id: 'REQ-001', material: 'Espuma D28', quantidade: 400, solicitante: 'CIP - Produção', data: '2025-02-03', status: 'aprovada' },
  { id: 'REQ-002', material: 'Tecido Suede', quantidade: 350, solicitante: 'CIP - Produção', data: '2025-02-03', status: 'pendente' },
  { id: 'REQ-003', material: 'Percinta', quantidade: 200, solicitante: 'CIP - Produção', data: '2025-02-02', status: 'aprovada' },
  { id: 'REQ-004', material: 'Cola PVA', quantidade: 50, solicitante: 'CIP - Produção', data: '2025-02-01', status: 'em_compra' },
];

const evolucaoCCC = [
  { mes: 'Jan', pme: 32, pmp: 28, ccc: 4 },
  { mes: 'Fev', pme: 30, pmp: 30, ccc: 0 },
  { mes: 'Mar', pme: 35, pmp: 27, ccc: 8 },
  { mes: 'Abr', pme: 28, pmp: 25, ccc: 3 },
  { mes: 'Mai', pme: 31, pmp: 29, ccc: 2 },
  { mes: 'Jun', pme: 33, pmp: 26, ccc: 7 },
];

const comprasPorPeriodo = [
  { mes: 'Jan', valor: 120000 },
  { mes: 'Fev', valor: 135000 },
  { mes: 'Mar', valor: 128000 },
  { mes: 'Abr', valor: 142000 },
  { mes: 'Mai', valor: 138000 },
  { mes: 'Jun', valor: 155000 },
];

const estoqueHistorico = [
  { mes: 'Jan', valor: 820000 },
  { mes: 'Fev', valor: 845000 },
  { mes: 'Mar', valor: 860000 },
  { mes: 'Abr', valor: 875000 },
  { mes: 'Mai', valor: 880000 },
  { mes: 'Jun', valor: 892450 },
];

// KPIs calculados
const pme = 31;
const pmp = 27;
const ccc = pme - pmp;
const totalSavings = 45000;
const otifMedio = Math.round(fornecedoresTop.reduce((a, f) => a + f.otif, 0) / fornecedoresTop.length);

type CICTab = 'dashboard' | 'consumo' | 'estoques' | 'compras' | 'fornecedores' | 'mrp' | 'requisicao' | 'ia' | 'analytics';

const menuItems: { id: CICTab; label: string; icon: typeof BarChart2 }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
  { id: 'consumo', label: 'Consumo de Materiais', icon: Activity },
  { id: 'estoques', label: 'Estoques – Entrada', icon: Warehouse },
  { id: 'compras', label: 'Compras', icon: ShoppingCart },
  { id: 'fornecedores', label: 'Fornecedores', icon: Users },
  { id: 'mrp', label: 'Necessidades (MRP)', icon: ClipboardList },
  { id: 'requisicao', label: 'Requisição', icon: FileText },
  { id: 'ia', label: 'Inteligência IA', icon: Brain },
  { id: 'analytics', label: 'Analytics', icon: BarChart2 },
];

interface DashboardCICProps {
  activeSubPage?: string;
  onGoHome?: () => void;
}

export function DashboardCIC({ activeSubPage = 'dashboard', onGoHome }: DashboardCICProps) {
  const [activeTab, setActiveTab] = useState<CICTab>(activeSubPage as CICTab);
  const [searchMat, setSearchMat] = useState('');
  const [searchForn, setSearchForn] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isMobile = useIsMobile();

  const materiaisCriticos = materiais.filter(m => m.estoque < m.minimo);
  const hasCriticalIssue = materiaisCriticos.length > 3 || ccc > 5;

  const filteredMateriais = materiais.filter(m =>
    m.nome.toLowerCase().includes(searchMat.toLowerCase()) ||
    m.codigo.toLowerCase().includes(searchMat.toLowerCase())
  );

  const handleTabChange = (tabId: CICTab) => {
    setActiveTab(tabId);
    setSidebarOpen(false);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return renderDashboard();
      case 'estoques': return <CICEstoqueOperacional />;
      case 'consumo': return renderConsumo();
      case 'estoques': return renderEstoques();
      case 'compras': return renderCompras();
      case 'fornecedores': return renderFornecedores();
      case 'mrp': return renderMRP();
      case 'requisicao': return renderRequisicao();
      case 'ia': return renderIA();
      case 'analytics': return renderAnalytics();
      default: return renderDashboard();
    }
  };

  // === DASHBOARD ===
  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <KPICard title="Total Compras" value={`R$ ${(comprasPorPeriodo[5].valor / 1000).toFixed(0)}k`} subtitle="Este mês" icon={<ShoppingCart className="h-5 w-5" />} variant="cic" trend="up" trendValue="+12%" />
        <KPICard title="Valor Estoque" value={`R$ ${(executiveKPIs.cic.estoqueTotal / 1000).toFixed(0)}k`} subtitle="Total valorizado" icon={<Warehouse className="h-5 w-5" />} variant="cic" />
        <KPICard title="Consumo Período" value={`R$ ${(executiveKPIs.cic.consumoMensal / 1000).toFixed(0)}k`} subtitle="Este mês" icon={<Activity className="h-5 w-5" />} variant="cic" />
        <KPICard title="PMP" value={`${pmp}d`} subtitle="Prazo Méd. Pagamento" icon={<Clock className="h-5 w-5" />} variant="cic" />
        <KPICard title="PME" value={`${pme}d`} subtitle="Prazo Méd. Estoque" icon={<Package className="h-5 w-5" />} variant="cic" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <KPICard title="CCC" value={`${ccc}d`} subtitle="Ciclo Conv. Caixa" icon={<TrendingUp className="h-5 w-5" />} variant="cic" trend={ccc > 5 ? 'down' : 'up'} trendValue={ccc > 5 ? 'Atenção' : 'OK'} />
        <KPICard title="Total Savings" value={`R$ ${(totalSavings / 1000).toFixed(0)}k`} subtitle="Economia acumulada" icon={<DollarSign className="h-5 w-5" />} variant="cic" trend="up" trendValue="+8%" />
        <KPICard title="OTIF Médio" value={`${otifMedio}%`} subtitle="Fornecedores" icon={<CheckCircle2 className="h-5 w-5" />} variant="cic" trend={otifMedio >= 90 ? 'up' : 'down'} trendValue={otifMedio >= 90 ? 'Bom' : 'Atenção'} />
        <KPICard title="Mat. Críticos" value={materiaisCriticos.length} subtitle="Abaixo do mínimo" icon={<AlertTriangle className="h-5 w-5" />} variant="cic" trend="down" trendValue="Atenção" />
        <div className={cn(
          "p-3 rounded-xl border flex flex-col justify-center items-center",
          materiaisCriticos.length > 3 ? "bg-destructive/10 border-destructive/30" :
          materiaisCriticos.length > 0 ? "bg-warning/10 border-warning/30" :
          "bg-success/10 border-success/30"
        )}>
          <span className="text-[10px] text-muted-foreground uppercase">Status Geral</span>
          <span className={cn("text-lg font-bold mt-1",
            materiaisCriticos.length > 3 ? "text-destructive" :
            materiaisCriticos.length > 0 ? "text-warning" : "text-success"
          )}>
            {materiaisCriticos.length > 3 ? 'CRÍTICO' : materiaisCriticos.length > 0 ? 'ATENÇÃO' : 'NORMAL'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ModuleCard title="Evolução CCC (PME x PMP)" variant="cic">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={evolucaoCCC}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="mes" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Legend />
                <Bar dataKey="pme" fill={CHART_COLORS.azulMarinho} name="PME (dias)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pmp" fill={CHART_COLORS.verde} name="PMP (dias)" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="ccc" stroke={CHART_COLORS.vermelho} strokeWidth={2} name="CCC (dias)" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </ModuleCard>

        <ModuleCard title="Compras por Período" variant="cic">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comprasPorPeriodo}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="mes" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Valor']} />
                <Bar dataKey="valor" fill={CHART_COLORS.azulMarinho} name="Compras" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ModuleCard>

        <ModuleCard title="Consumo por Período" variant="cic">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={consumoPeriodo}>
                <defs>
                  <linearGradient id="colorConsumoCIC" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.azulMarinho} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={CHART_COLORS.azulMarinho} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="mes" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, '']} />
                <Area type="monotone" dataKey="consumo" stroke={CHART_COLORS.azulMarinho} strokeWidth={2} fill="url(#colorConsumoCIC)" name="Consumo Real" />
                <Line type="monotone" dataKey="planejado" stroke={CHART_COLORS.amarelo} strokeDasharray="5 5" strokeWidth={1.5} dot={false} name="Planejado" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ModuleCard>

        <ModuleCard title="Estoque ao Longo do Tempo" variant="cic">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={estoqueHistorico}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="mes" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Valor']} />
                <Line type="monotone" dataKey="valor" stroke={CHART_COLORS.verde} strokeWidth={2} dot={{ fill: CHART_COLORS.verde, r: 4 }} name="Estoque" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ModuleCard>

        <ModuleCard title="Top Materiais por Custo" variant="cic">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={materiais.sort((a, b) => (b.estoque * b.custo) - (a.estoque * a.custo)).slice(0, 5).map(m => ({ nome: m.nome.substring(0, 12), valor: m.estoque * m.custo }))} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="nome" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} width={100} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Valor']} />
                <Bar dataKey="valor" fill={CHART_COLORS.laranja} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ModuleCard>

        <ModuleCard title="Compras por Fornecedor" variant="cic">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fornecedoresTop.slice(0, 5).map(f => ({ nome: f.nome.substring(0, 12), valor: f.valor }))} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="nome" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} width={100} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Valor']} />
                <Bar dataKey="valor" fill={CHART_COLORS.azulClaro} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ModuleCard>
      </div>
    </div>
  );

  // === CONSUMO ===
  const renderConsumo = () => (
    <div className="space-y-6">
      <div className="p-3 rounded-lg bg-cic/10 border border-cic/30">
        <p className="text-sm text-muted-foreground"><strong className="text-cic">Consumo de Materiais</strong> — Dados lidos automaticamente dos setores operacionais.</p>
      </div>
      <ModuleCard title="Consumo por Período" variant="cic">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={consumoPeriodo}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="mes" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
              <Legend />
              <Bar dataKey="consumo" fill={CHART_COLORS.azulMarinho} name="Consumo Real" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="planejado" stroke={CHART_COLORS.amarelo} strokeDasharray="5 5" name="Planejado" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </ModuleCard>
      <ModuleCard title="Consumo por Material" variant="cic">
        <div className="rounded-xl border border-border/30 overflow-hidden" style={{ height: '400px' }}>
          <ScrollArea className="h-full">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border/50 bg-secondary/30 sticky top-0 z-10">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Material</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">Categoria</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">Estoque</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">Custo Unit.</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">Valor Total</th>
              </tr></thead>
              <tbody>
                {materiais.map(m => (
                  <tr key={m.id} className="border-b border-border/30 hover:bg-secondary/30">
                    <td className="py-3 px-4 font-medium text-foreground">{m.nome}</td>
                    <td className="py-3 px-4 text-center"><Badge variant="outline">{m.categoria}</Badge></td>
                    <td className="py-3 px-4 text-right">{m.estoque} {m.unidade}</td>
                    <td className="py-3 px-4 text-right text-muted-foreground">R$ {m.custo.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-semibold">R$ {(m.estoque * m.custo).toLocaleString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollArea>
        </div>
      </ModuleCard>
    </div>
  );

  // === ESTOQUES ===
  const renderEstoques = () => (
    <div className="space-y-6">
      <div className="p-3 rounded-lg bg-success/10 border border-success/30">
        <div className="flex items-start gap-3">
          <ArrowUpCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <strong className="text-success">Entrada em Estoque (CIC)</strong>
            <p className="text-muted-foreground mt-1">Materiais entram em estoque <strong>após conferência física</strong>. Rastreabilidade total: data, origem e fornecedor.</p>
          </div>
        </div>
      </div>
      <div className="flex gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar material..." value={searchMat} onChange={(e) => setSearchMat(e.target.value)} className="pl-10" />
        </div>
        <Button variant="outline" size="icon"><Filter className="h-4 w-4" /></Button>
      </div>
      <div className="rounded-xl border border-border/30 bg-card/80 overflow-hidden" style={{ height: '500px' }}>
        <ScrollArea className="h-full">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border/50 bg-secondary/30 sticky top-0 z-10">
              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Código</th>
              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Material</th>
              <th className="text-center py-3 px-4 text-muted-foreground font-medium">Estoque</th>
              <th className="text-center py-3 px-4 text-muted-foreground font-medium">Mín.</th>
              <th className="text-center py-3 px-4 text-muted-foreground font-medium">Máx.</th>
              <th className="text-center py-3 px-4 text-muted-foreground font-medium">Segurança</th>
              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Fornecedor</th>
              <th className="text-center py-3 px-4 text-muted-foreground font-medium">Última Entrada</th>
              <th className="text-center py-3 px-4 text-muted-foreground font-medium">Status</th>
            </tr></thead>
            <tbody>
              {filteredMateriais.map(m => {
                const status = m.estoque < m.minimo ? 'critico' : m.estoque < m.seguranca ? 'atencao' : 'normal';
                return (
                  <tr key={m.id} className="border-b border-border/30 hover:bg-secondary/30">
                    <td className="py-3 px-4 font-mono text-foreground">{m.codigo}</td>
                    <td className="py-3 px-4 font-medium text-foreground">{m.nome}</td>
                    <td className="py-3 px-4 text-center font-semibold">{m.estoque} {m.unidade}</td>
                    <td className="py-3 px-4 text-center text-muted-foreground">{m.minimo}</td>
                    <td className="py-3 px-4 text-center text-muted-foreground">{m.maximo}</td>
                    <td className="py-3 px-4 text-center text-muted-foreground">{m.seguranca}</td>
                    <td className="py-3 px-4 text-muted-foreground">{m.fornecedor}</td>
                    <td className="py-3 px-4 text-center text-muted-foreground">{new Date(m.ultimaEntrada).toLocaleDateString('pt-BR')}</td>
                    <td className="py-3 px-4 text-center">
                      <Badge className={cn(
                        status === 'critico' ? 'bg-destructive/20 text-destructive' :
                        status === 'atencao' ? 'bg-warning/20 text-warning' :
                        'bg-success/20 text-success'
                      )}>
                        {status === 'critico' ? 'Crítico' : status === 'atencao' ? 'Atenção' : 'Normal'}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </ScrollArea>
      </div>
    </div>
  );

  // === COMPRAS ===
  const renderCompras = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {comprasStatus.map(c => (
          <div key={c.status} className="p-3 rounded-xl bg-card border border-border/30">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
              <span className="text-xs text-muted-foreground">{c.status}</span>
            </div>
            <p className="text-xl font-bold text-foreground">R$ {(c.valor / 1000).toFixed(0)}k</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ModuleCard title="Compras por Status" variant="cic">
          <div className="h-64 flex items-center">
            <div className="w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart><Pie data={comprasStatus} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="valor">
                  {comprasStatus.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie><Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, '']} /></PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 space-y-2">
              {comprasStatus.map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} /><span className="text-xs text-muted-foreground">{item.status}</span></div>
                  <span className="text-xs font-semibold">R$ {(item.valor / 1000).toFixed(0)}k</span>
                </div>
              ))}
            </div>
          </div>
        </ModuleCard>
        <ModuleCard title="Compras por Período" variant="cic">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comprasPorPeriodo}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="mes" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, '']} />
                <Bar dataKey="valor" fill={CHART_COLORS.azulMarinho} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ModuleCard>
      </div>
    </div>
  );

  // === FORNECEDORES ===
  const renderFornecedores = () => (
    <div className="space-y-6">
      <div className="flex gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar fornecedor..." value={searchForn} onChange={(e) => setSearchForn(e.target.value)} className="pl-10" />
        </div>
        <Button size="sm" className="bg-cic hover:bg-cic/90 gap-2"><Plus className="h-4 w-4" />Novo</Button>
      </div>
      <div className="rounded-xl border border-border/30 bg-card/80 overflow-hidden" style={{ height: '450px' }}>
        <ScrollArea className="h-full">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border/50 bg-secondary/30 sticky top-0 z-10">
              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Fornecedor</th>
              <th className="text-right py-3 px-4 text-muted-foreground font-medium">Volume (R$)</th>
              <th className="text-center py-3 px-4 text-muted-foreground font-medium">Lead Time</th>
              <th className="text-center py-3 px-4 text-muted-foreground font-medium">Pontualidade</th>
              <th className="text-center py-3 px-4 text-muted-foreground font-medium">OTIF</th>
              <th className="text-center py-3 px-4 text-muted-foreground font-medium">Ranking</th>
              <th className="text-center py-3 px-4 text-muted-foreground font-medium">Ações</th>
            </tr></thead>
            <tbody>
              {fornecedoresTop.filter(f => f.nome.toLowerCase().includes(searchForn.toLowerCase())).map((f, i) => (
                <tr key={i} className="border-b border-border/30 hover:bg-secondary/30">
                  <td className="py-3 px-4 font-medium text-foreground">{f.nome}</td>
                  <td className="py-3 px-4 text-right font-semibold text-cic">R$ {(f.valor / 1000).toFixed(0)}k</td>
                  <td className="py-3 px-4 text-center">{f.leadTime} dias</td>
                  <td className="py-3 px-4 text-center">{f.entregas}%</td>
                  <td className="py-3 px-4 text-center">
                    <Badge className={cn(f.otif >= 90 ? 'bg-success/20 text-success' : f.otif >= 85 ? 'bg-warning/20 text-warning' : 'bg-destructive/20 text-destructive')}>
                      {f.otif}%
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Badge className={cn(f.entregas >= 95 ? 'bg-success/20 text-success' : f.entregas >= 90 ? 'bg-warning/20 text-warning' : 'bg-destructive/20 text-destructive')}>
                      {f.entregas >= 95 ? 'A' : f.entregas >= 90 ? 'B' : 'C'}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-4 w-4" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollArea>
      </div>
    </div>
  );

  // === MRP ===
  const renderMRP = () => (
    <div className="space-y-6">
      <div className="p-3 rounded-lg bg-warning/10 border border-warning/30">
        <div className="flex items-start gap-3">
          <ClipboardList className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <strong className="text-warning">Necessidades (MRP)</strong>
            <p className="text-muted-foreground mt-1">Cálculo automático baseado em consumo histórico, estoque atual e produção planejada (CIP). Ajuste manual permitido.</p>
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-border/30 bg-card/80 overflow-hidden" style={{ height: '400px' }}>
        <ScrollArea className="h-full">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border/50 bg-secondary/30 sticky top-0 z-10">
              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Material</th>
              <th className="text-right py-3 px-4 text-muted-foreground font-medium">Necessidade</th>
              <th className="text-right py-3 px-4 text-muted-foreground font-medium">Estoque</th>
              <th className="text-right py-3 px-4 text-muted-foreground font-medium">Déficit</th>
              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Sugestão</th>
              <th className="text-center py-3 px-4 text-muted-foreground font-medium">Urgência</th>
              <th className="text-center py-3 px-4 text-muted-foreground font-medium">Ação</th>
            </tr></thead>
            <tbody>
              {mrpNecessidades.map((n, i) => (
                <tr key={i} className="border-b border-border/30 hover:bg-secondary/30">
                  <td className="py-3 px-4 font-medium text-foreground">{n.material}</td>
                  <td className="py-3 px-4 text-right">{n.necessidade}</td>
                  <td className="py-3 px-4 text-right">{n.estoque}</td>
                  <td className="py-3 px-4 text-right font-semibold text-destructive">{n.deficit > 0 ? n.deficit : '—'}</td>
                  <td className="py-3 px-4 text-muted-foreground">{n.sugestao}</td>
                  <td className="py-3 px-4 text-center">
                    <Badge className={cn(n.urgencia === 'alta' ? 'bg-destructive/20 text-destructive' : n.urgencia === 'media' ? 'bg-warning/20 text-warning' : 'bg-success/20 text-success')}>
                      {n.urgencia === 'alta' ? 'Alta' : n.urgencia === 'media' ? 'Média' : 'Baixa'}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {n.deficit > 0 && <Button size="sm" variant="outline" className="text-xs gap-1"><FileText className="h-3 w-3" />Requisitar</Button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollArea>
      </div>
    </div>
  );

  // === REQUISIÇÃO ===
  const renderRequisicao = () => (
    <div className="space-y-6">
      <div className="p-3 rounded-lg bg-cic/10 border border-cic/30">
        <p className="text-sm text-muted-foreground"><strong className="text-cic">Requisições</strong> — Vinculadas ao MRP com aprovação simples e histórico rastreável.</p>
      </div>
      <div className="rounded-xl border border-border/30 bg-card/80 overflow-hidden" style={{ height: '400px' }}>
        <ScrollArea className="h-full">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border/50 bg-secondary/30 sticky top-0 z-10">
              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Código</th>
              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Material</th>
              <th className="text-right py-3 px-4 text-muted-foreground font-medium">Quantidade</th>
              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Solicitante</th>
              <th className="text-center py-3 px-4 text-muted-foreground font-medium">Data</th>
              <th className="text-center py-3 px-4 text-muted-foreground font-medium">Status</th>
            </tr></thead>
            <tbody>
              {requisicoes.map(r => (
                <tr key={r.id} className="border-b border-border/30 hover:bg-secondary/30">
                  <td className="py-3 px-4 font-mono font-medium text-foreground">{r.id}</td>
                  <td className="py-3 px-4 text-foreground">{r.material}</td>
                  <td className="py-3 px-4 text-right font-semibold">{r.quantidade}</td>
                  <td className="py-3 px-4 text-muted-foreground">{r.solicitante}</td>
                  <td className="py-3 px-4 text-center text-muted-foreground">{new Date(r.data).toLocaleDateString('pt-BR')}</td>
                  <td className="py-3 px-4 text-center">
                    <Badge className={cn(
                      r.status === 'aprovada' ? 'bg-success/20 text-success' :
                      r.status === 'pendente' ? 'bg-warning/20 text-warning' :
                      'bg-cic/20 text-cic'
                    )}>
                      {r.status === 'aprovada' ? 'Aprovada' : r.status === 'pendente' ? 'Pendente' : 'Em Compra'}
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

  // === IA ===
  const renderIA = () => (
    <div className="space-y-6">
      <div className="p-3 rounded-lg bg-cic/10 border border-cic/30">
        <p className="text-sm text-muted-foreground"><strong className="text-cic">IA Executiva</strong> — Só se manifesta quando há problema crítico. Sem sugestão operacional.</p>
      </div>
      {hasCriticalIssue ? (
        <div className="space-y-4">
          {materiaisCriticos.length > 3 && (
            <div className="p-4 rounded-xl border-2 border-destructive/50 bg-destructive/10 animate-pulse">
              <div className="flex items-center gap-3">
                <Zap className="h-6 w-6 text-destructive" />
                <div>
                  <p className="font-bold text-destructive">⚠ Risco de Ruptura</p>
                  <p className="text-sm text-muted-foreground">{materiaisCriticos.length} materiais abaixo do mínimo. Impacto: Capacidade produtiva e prazo de entrega.</p>
                </div>
              </div>
            </div>
          )}
          {ccc > 5 && (
            <div className="p-4 rounded-xl border-2 border-warning/50 bg-warning/10">
              <div className="flex items-center gap-3">
                <Zap className="h-6 w-6 text-warning" />
                <div>
                  <p className="font-bold text-warning">⚠ CCC Elevado</p>
                  <p className="text-sm text-muted-foreground">Ciclo de Conversão de Caixa em {ccc} dias. Impacto: Fluxo financeiro e capital de giro.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-success opacity-50" />
          <p className="text-lg font-medium text-success">Operação Normal</p>
          <p className="text-sm mt-1">Nenhum alerta crítico detectado. IA em modo silencioso.</p>
        </div>
      )}
    </div>
  );

  // === ANALYTICS ===
  const renderAnalytics = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ModuleCard title="Giro de Estoque" variant="cic">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={materiais.map(m => ({ nome: m.nome.substring(0, 10), giro: +(Math.random() * 8 + 2).toFixed(1) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="nome" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Bar dataKey="giro" fill={CHART_COLORS.azulMarinho} name="Giro" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ModuleCard>
        <ModuleCard title="Evolução CCC (PME x PMP)" variant="cic">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evolucaoCCC}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="mes" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Legend />
                <Line type="monotone" dataKey="pme" stroke={CHART_COLORS.azulMarinho} strokeWidth={2} name="PME" />
                <Line type="monotone" dataKey="pmp" stroke={CHART_COLORS.verde} strokeWidth={2} name="PMP" />
                <Line type="monotone" dataKey="ccc" stroke={CHART_COLORS.vermelho} strokeWidth={2} name="CCC" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ModuleCard>
        <ModuleCard title="Savings Acumulado" variant="cic">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[
                { mes: 'Jan', savings: 5000 }, { mes: 'Fev', savings: 12000 }, { mes: 'Mar', savings: 20000 },
                { mes: 'Abr', savings: 28000 }, { mes: 'Mai', savings: 36000 }, { mes: 'Jun', savings: 45000 },
              ]}>
                <defs>
                  <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.verde} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={CHART_COLORS.verde} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="mes" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Savings']} />
                <Area type="monotone" dataKey="savings" stroke={CHART_COLORS.verde} strokeWidth={2} fill="url(#colorSavings)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ModuleCard>
        <ModuleCard title="OTIF por Fornecedor" variant="cic">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fornecedoresTop.map(f => ({ nome: f.nome.substring(0, 10), otif: f.otif }))} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" domain={[70, 100]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <YAxis type="category" dataKey="nome" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} width={90} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(value: number) => [`${value}%`, 'OTIF']} />
                <Bar dataKey="otif" radius={[0, 4, 4, 0]}>
                  {fornecedoresTop.map((f, i) => (
                    <Cell key={i} fill={f.otif >= 90 ? CHART_COLORS.verde : f.otif >= 85 ? CHART_COLORS.amarelo : CHART_COLORS.vermelho} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ModuleCard>
      </div>
    </div>
  );

  // === SIDEBAR CONTENT ===
  const SidebarContent = ({ isCollapsed = false }: { isCollapsed?: boolean }) => (
    <>
      <div className={cn("mb-6", isCollapsed && "text-center")}>
        {!isCollapsed ? (
          <>
            <h3 className="text-cic font-display text-lg font-bold">CIC CONTROL</h3>
            <p className="text-xs text-muted-foreground">Inteligência de Compras</p>
          </>
        ) : (
          <div className="w-8 h-8 rounded-lg bg-cic/20 flex items-center justify-center mx-auto">
            <Package className="h-4 w-4 text-cic" />
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
                ? 'bg-cic/20 text-cic font-medium'
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
              <div className="w-2 h-2 rounded-full bg-cic animate-pulse" />
              <span className="text-sm font-semibold text-cic">CIC CONTROL</span>
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
        {/* Header */}
        {!isMobile && (
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cic/20 flex items-center justify-center">
                  <Warehouse className="h-5 w-5 text-cic" />
                </div>
                {menuItems.find(m => m.id === activeTab)?.label || 'Dashboard'}
              </h2>
              <p className="text-muted-foreground mt-1 ml-13">CIC CONTROL – Central de Inteligência de Compras</p>
            </div>
          </div>
        )}

        {renderContent()}
      </main>
    </div>
  );
}
