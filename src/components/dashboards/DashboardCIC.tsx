import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, ComposedChart, Legend,
} from 'recharts';
import { CICEstoqueMateriais } from '@/components/cic/CICEstoqueMateriais';
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
  Search, Plus, Edit, Clock, TrendingUp,
  CheckCircle2, FileText, ChevronLeft, ChevronRight, Menu, X, RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { fetchMateriais, type Material } from '@/services/materiaisService';

const CHART_COLORS = {
  azulMarinho: 'hsl(215, 75%, 48%)',
  verde: 'hsl(145, 70%, 42%)',
  amarelo: 'hsl(45, 95%, 50%)',
  vermelho: 'hsl(0, 72%, 51%)',
  laranja: 'hsl(30, 90%, 50%)',
  azulClaro: 'hsl(200, 75%, 50%)',
};

type CICTab = 'dashboard' | 'materiais' | 'estoques' | 'compras' | 'fornecedores' | 'mrp' | 'requisicao' | 'ia' | 'analytics';

const menuItems: { id: CICTab; label: string; icon: typeof BarChart2 }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
  { id: 'materiais', label: 'Gestão de Materiais', icon: Package },
  { id: 'estoques', label: 'Estoque de Materiais', icon: Warehouse },
  { id: 'compras', label: 'Compras', icon: ShoppingCart },
  { id: 'fornecedores', label: 'Fornecedores', icon: Users },
  { id: 'mrp', label: 'Necessidades (MRP)', icon: ClipboardList },
  { id: 'ia', label: 'Inteligência IA', icon: Brain },
  { id: 'analytics', label: 'Analytics', icon: BarChart2 },
];

interface DashboardCICProps {
  activeSubPage?: string;
  onGoHome?: () => void;
}

export function DashboardCIC({ activeSubPage = 'dashboard', onGoHome }: DashboardCICProps) {
  const [activeTab, setActiveTab] = useState<CICTab>(activeSubPage as CICTab);
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchMat, setSearchMat] = useState('');
  const [searchForn, setSearchForn] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isMobile = useIsMobile();

  const loadData = async () => {
    setLoading(true);
    const [matsData, fornData] = await Promise.all([
      fetchMateriais(),
      supabase.from('fornecedores').select('*').eq('ativo', true).order('nome'),
    ]);
    setMateriais(matsData);
    setFornecedores(fornData.data || []);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const materiaisCriticos = materiais.filter(m => m.status === 'critico');
  const materiaisAtencao = materiais.filter(m => m.status === 'atencao');
  const valorEstoqueTotal = materiais.reduce((s, m) => s + (m.valor_estoque || 0), 0);
  const totalPropostaCompra = materiais.reduce((s, m) => s + (m.proposta_compra || 0) * m.valor_unitario, 0);

  const handleTabChange = (tabId: CICTab) => {
    setActiveTab(tabId);
    setSidebarOpen(false);
  };

  const filteredMateriais = materiais.filter(m =>
    m.nome.toLowerCase().includes(searchMat.toLowerCase()) ||
    m.codigo.toLowerCase().includes(searchMat.toLowerCase())
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return renderDashboard();
      case 'materiais': return renderMateriais();
      case 'estoques': return <CICEstoqueOperacional />;
      case 'compras': return renderCompras();
      case 'fornecedores': return renderFornecedores();
      case 'mrp': return renderMRP();
      case 'ia': return renderIA();
      case 'analytics': return renderAnalytics();
      default: return renderDashboard();
    }
  };

  // === DASHBOARD ===
  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <KPICard title="Valor Estoque" value={`R$ ${(valorEstoqueTotal / 1000).toFixed(0)}k`} subtitle="Total valorizado" icon={<Warehouse className="h-5 w-5" />} variant="cic" />
        <KPICard title="Materiais Ativos" value={materiais.length} subtitle="Cadastrados" icon={<Package className="h-5 w-5" />} variant="cic" />
        <KPICard title="Proposta Compra" value={`R$ ${(totalPropostaCompra / 1000).toFixed(0)}k`} subtitle="Valor estimado" icon={<ShoppingCart className="h-5 w-5" />} variant="cic" />
        <KPICard title="Mat. Críticos" value={materiaisCriticos.length} subtitle="Abaixo ponto pedido" icon={<AlertTriangle className="h-5 w-5" />} variant="cic" trend={materiaisCriticos.length > 0 ? 'down' : 'up'} trendValue={materiaisCriticos.length > 0 ? 'Atenção' : 'OK'} />
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
        <ModuleCard title="Estoque por Categoria" variant="cic">
          <div className="h-64 flex items-center">
            {(() => {
              const cats = new Map<string, number>();
              materiais.forEach(m => cats.set(m.categoria, (cats.get(m.categoria) || 0) + (m.valor_estoque || 0)));
              const colors = [CHART_COLORS.azulMarinho, CHART_COLORS.verde, CHART_COLORS.amarelo, CHART_COLORS.laranja, CHART_COLORS.vermelho, CHART_COLORS.azulClaro];
              const pieData = Array.from(cats.entries()).map(([cat, val], i) => ({ name: cat, value: val, color: colors[i % colors.length] }));
              return (
                <>
                  <div className="w-1/2 h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                        {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie><Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(v: number) => [`R$ ${v.toLocaleString('pt-BR')}`, '']} /></PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-1/2 space-y-2">
                    {pieData.map((item, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} /><span className="text-xs text-muted-foreground">{item.name}</span></div>
                        <span className="text-xs font-semibold">R$ {(item.value / 1000).toFixed(0)}k</span>
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}
          </div>
        </ModuleCard>

        <ModuleCard title="Top Materiais por Valor" variant="cic">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[...materiais].sort((a, b) => (b.valor_estoque || 0) - (a.valor_estoque || 0)).slice(0, 6).map(m => ({ nome: m.nome.substring(0, 12), valor: m.valor_estoque || 0 }))} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="nome" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} width={100} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(v: number) => [`R$ ${v.toLocaleString('pt-BR')}`, 'Valor']} />
                <Bar dataKey="valor" fill={CHART_COLORS.laranja} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ModuleCard>
      </div>
    </div>
  );

  // === GESTÃO DE MATERIAIS (Alcance, Ponto de Pedido) ===
  const renderMateriais = () => (
    <div className="space-y-4">
      <div className="p-3 rounded-lg bg-cic/10 border border-cic/30">
        <p className="text-sm text-muted-foreground"><strong className="text-cic">Gestão de Materiais</strong> — Alcance, Ponto de Pedido, Proposta de Compra. Dados reais do banco.</p>
      </div>
      <div className="flex gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar material..." value={searchMat} onChange={(e) => setSearchMat(e.target.value)} className="pl-10" />
        </div>
      </div>
      <div className="rounded-xl border border-border/30 bg-card/80 overflow-hidden">
        <ScrollArea className="max-h-[600px]">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border/50 bg-secondary/30 sticky top-0 z-10">
              <th className="text-left py-3 px-3 text-muted-foreground font-medium text-xs">Código</th>
              <th className="text-left py-3 px-3 text-muted-foreground font-medium text-xs">Material</th>
              <th className="text-center py-3 px-2 text-muted-foreground font-medium text-xs">Estoque</th>
              <th className="text-center py-3 px-2 text-muted-foreground font-medium text-xs">Alcance</th>
              <th className="text-center py-3 px-2 text-muted-foreground font-medium text-xs">Pto Pedido</th>
              <th className="text-center py-3 px-2 text-muted-foreground font-medium text-xs">Lote Econ.</th>
              <th className="text-center py-3 px-2 text-muted-foreground font-medium text-xs">Consumo/dia</th>
              <th className="text-center py-3 px-2 text-muted-foreground font-medium text-xs">Proposta</th>
              <th className="text-center py-3 px-2 text-muted-foreground font-medium text-xs">Alc. Proj.</th>
              <th className="text-right py-3 px-2 text-muted-foreground font-medium text-xs">Val Unit</th>
              <th className="text-right py-3 px-2 text-muted-foreground font-medium text-xs">R$ Estoque</th>
              <th className="text-right py-3 px-2 text-muted-foreground font-medium text-xs">R$ Compra</th>
              <th className="text-center py-3 px-2 text-muted-foreground font-medium text-xs">Status</th>
            </tr></thead>
            <tbody>
              {filteredMateriais.map(m => (
                <tr key={m.id} className={cn("border-b border-border/30 hover:bg-secondary/30", m.status === 'critico' && "bg-destructive/5")}>
                  <td className="py-2 px-3 font-mono text-foreground text-xs">{m.codigo}</td>
                  <td className="py-2 px-3 font-medium text-foreground text-xs">{m.nome}</td>
                  <td className="py-2 px-2 text-center font-semibold text-xs">{m.estoque_atual} {m.unidade}</td>
                  <td className="py-2 px-2 text-center text-xs">
                    <span className={cn("font-bold",
                      (m.alcance_estoque || 0) < 1 ? "text-destructive" :
                      (m.alcance_estoque || 0) < 3 ? "text-warning" : "text-success"
                    )}>
                      {(m.alcance_estoque || 0).toFixed(1)}d
                    </span>
                  </td>
                  <td className="py-2 px-2 text-center text-muted-foreground text-xs">{m.ponto_pedido}</td>
                  <td className="py-2 px-2 text-center text-muted-foreground text-xs">{m.lote_economico}</td>
                  <td className="py-2 px-2 text-center text-muted-foreground text-xs">{m.consumo_medio_diario}</td>
                  <td className="py-2 px-2 text-center text-xs">
                    {(m.proposta_compra || 0) > 0 ? (
                      <span className="font-bold text-warning">{m.proposta_compra} {m.unidade}</span>
                    ) : '—'}
                  </td>
                  <td className="py-2 px-2 text-center text-xs">
                    <span className={cn("font-semibold",
                      (m.alcance_projetado || 0) >= 5 ? "text-success" : "text-warning"
                    )}>
                      {(m.alcance_projetado || 0).toFixed(1)}d
                    </span>
                  </td>
                  <td className="py-2 px-2 text-right text-muted-foreground text-xs">R$ {m.valor_unitario.toFixed(2)}</td>
                  <td className="py-2 px-2 text-right font-semibold text-xs">R$ {((m.valor_estoque || 0) / 1000).toFixed(1)}k</td>
                  <td className="py-2 px-2 text-right text-xs">
                    {(m.proposta_compra || 0) > 0 ? (
                      <span className="text-warning font-semibold">R$ {(((m.proposta_compra || 0) * m.valor_unitario) / 1000).toFixed(1)}k</span>
                    ) : '—'}
                  </td>
                  <td className="py-2 px-2 text-center">
                    <Badge className={cn("text-[10px]",
                      m.status === 'critico' ? 'bg-destructive/20 text-destructive' :
                      m.status === 'atencao' ? 'bg-warning/20 text-warning' :
                      'bg-success/20 text-success'
                    )}>
                      {m.status === 'critico' ? '🔴 Crítico' : m.status === 'atencao' ? '🟡 Atenção' : '🟢 OK'}
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

  // === COMPRAS ===
  const renderCompras = () => {
    const comprasPendentes = materiais.filter(m => (m.proposta_compra || 0) > 0);
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPICard title="Propostas Ativas" value={comprasPendentes.length} subtitle="Materiais" icon={<ShoppingCart className="h-5 w-5" />} variant="cic" />
          <KPICard title="Valor Propostas" value={`R$ ${(totalPropostaCompra / 1000).toFixed(0)}k`} subtitle="Total estimado" icon={<DollarSign className="h-5 w-5" />} variant="cic" />
          <KPICard title="Fornecedores" value={fornecedores.length} subtitle="Ativos" icon={<Users className="h-5 w-5" />} variant="cic" />
          <KPICard title="Lead Time Méd." value={`${materiais.length > 0 ? Math.round(materiais.reduce((s, m) => s + m.lead_time_dias, 0) / materiais.length) : 0}d`} subtitle="Dias" icon={<Clock className="h-5 w-5" />} variant="cic" />
        </div>
        <ModuleCard title="Propostas de Compra Pendentes" variant="cic">
          <ScrollArea className="max-h-[400px]">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border/50 bg-secondary/30 sticky top-0 z-10">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Material</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">Estoque Atual</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">Ponto Pedido</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">Qtd Proposta</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">Valor Estimado</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Fornecedor</th>
              </tr></thead>
              <tbody>
                {comprasPendentes.length === 0 ? (
                  <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">Nenhuma proposta de compra pendente.</td></tr>
                ) : comprasPendentes.map(m => (
                  <tr key={m.id} className="border-b border-border/30 hover:bg-secondary/30">
                    <td className="py-3 px-4 font-medium text-foreground">{m.nome}</td>
                    <td className="py-3 px-4 text-center">{m.estoque_atual} {m.unidade}</td>
                    <td className="py-3 px-4 text-center text-muted-foreground">{m.ponto_pedido}</td>
                    <td className="py-3 px-4 text-center font-bold text-warning">{m.proposta_compra} {m.unidade}</td>
                    <td className="py-3 px-4 text-right font-semibold text-cic">R$ {((m.proposta_compra || 0) * m.valor_unitario).toLocaleString('pt-BR')}</td>
                    <td className="py-3 px-4 text-muted-foreground">{m.fornecedor_nome || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollArea>
        </ModuleCard>
      </div>
    );
  };

  // === FORNECEDORES ===
  const renderFornecedores = () => (
    <div className="space-y-6">
      <div className="flex gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar fornecedor..." value={searchForn} onChange={(e) => setSearchForn(e.target.value)} className="pl-10" />
        </div>
      </div>
      <div className="rounded-xl border border-border/30 bg-card/80 overflow-hidden">
        <ScrollArea className="max-h-[500px]">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border/50 bg-secondary/30 sticky top-0 z-10">
              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Fornecedor</th>
              <th className="text-left py-3 px-4 text-muted-foreground font-medium">CNPJ</th>
              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Contato</th>
              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Email</th>
              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Telefone</th>
            </tr></thead>
            <tbody>
              {fornecedores.filter(f => f.nome.toLowerCase().includes(searchForn.toLowerCase())).map(f => (
                <tr key={f.id} className="border-b border-border/30 hover:bg-secondary/30">
                  <td className="py-3 px-4 font-medium text-foreground">{f.nome}</td>
                  <td className="py-3 px-4 text-muted-foreground">{f.cnpj || '—'}</td>
                  <td className="py-3 px-4 text-muted-foreground">{f.contato || '—'}</td>
                  <td className="py-3 px-4 text-muted-foreground">{f.email || '—'}</td>
                  <td className="py-3 px-4 text-muted-foreground">{f.telefone || '—'}</td>
                </tr>
              ))}
              {fornecedores.length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">Nenhum fornecedor cadastrado.</td></tr>
              )}
            </tbody>
          </table>
        </ScrollArea>
      </div>
    </div>
  );

  // === MRP ===
  const renderMRP = () => {
    const necessidades = materiais.filter(m => (m.proposta_compra || 0) > 0 || m.status === 'critico');
    return (
      <div className="space-y-6">
        <div className="p-3 rounded-lg bg-warning/10 border border-warning/30">
          <div className="flex items-start gap-3">
            <ClipboardList className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <strong className="text-warning">Necessidades (MRP)</strong>
              <p className="text-muted-foreground mt-1">Cálculo automático: materiais abaixo do ponto de pedido ou com alcance crítico.</p>
            </div>
          </div>
        </div>
        <ScrollArea className="max-h-[500px]">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border/50 bg-secondary/30 sticky top-0 z-10">
              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Material</th>
              <th className="text-center py-3 px-4 text-muted-foreground font-medium">Estoque</th>
              <th className="text-center py-3 px-4 text-muted-foreground font-medium">Ponto Pedido</th>
              <th className="text-center py-3 px-4 text-muted-foreground font-medium">Déficit</th>
              <th className="text-center py-3 px-4 text-muted-foreground font-medium">Proposta</th>
              <th className="text-center py-3 px-4 text-muted-foreground font-medium">Urgência</th>
            </tr></thead>
            <tbody>
              {necessidades.map(m => {
                const deficit = Math.max(0, m.ponto_pedido - m.estoque_atual);
                return (
                  <tr key={m.id} className="border-b border-border/30 hover:bg-secondary/30">
                    <td className="py-3 px-4 font-medium text-foreground">{m.nome}</td>
                    <td className="py-3 px-4 text-center">{m.estoque_atual} {m.unidade}</td>
                    <td className="py-3 px-4 text-center text-muted-foreground">{m.ponto_pedido}</td>
                    <td className="py-3 px-4 text-center font-semibold text-destructive">{deficit > 0 ? deficit : '—'}</td>
                    <td className="py-3 px-4 text-center font-bold text-warning">{m.proposta_compra || '—'} {(m.proposta_compra || 0) > 0 ? m.unidade : ''}</td>
                    <td className="py-3 px-4 text-center">
                      <Badge className={cn(m.status === 'critico' ? 'bg-destructive/20 text-destructive' : 'bg-warning/20 text-warning')}>
                        {m.status === 'critico' ? 'Alta' : 'Média'}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
              {necessidades.length === 0 && (
                <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">Todos os materiais dentro dos parâmetros. Nenhuma necessidade.</td></tr>
              )}
            </tbody>
          </table>
        </ScrollArea>
      </div>
    );
  };

  // === IA ===
  const renderIA = () => (
    <div className="space-y-6">
      <div className="p-3 rounded-lg bg-cic/10 border border-cic/30">
        <p className="text-sm text-muted-foreground"><strong className="text-cic">IA Executiva</strong> — Alertas críticos baseados em dados reais de estoque e produção.</p>
      </div>
      {materiaisCriticos.length > 0 ? (
        <div className="space-y-4">
          {materiaisCriticos.map(m => (
            <div key={m.id} className="p-4 rounded-xl border-2 border-destructive/50 bg-destructive/10">
              <div className="flex items-center gap-3">
                <Zap className="h-6 w-6 text-destructive" />
                <div>
                  <p className="font-bold text-destructive">⚠ {m.nome} — Alcance: {(m.alcance_estoque || 0).toFixed(1)} dias</p>
                  <p className="text-sm text-muted-foreground">
                    Estoque: {m.estoque_atual} {m.unidade} | Ponto de Pedido: {m.ponto_pedido} | 
                    Proposta: {m.proposta_compra || 0} {m.unidade} | Lead Time: {m.lead_time_dias}d
                  </p>
                </div>
              </div>
            </div>
          ))}
          {materiaisAtencao.length > 0 && (
            <div className="p-4 rounded-xl border border-warning/50 bg-warning/10">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <p className="text-sm text-muted-foreground">{materiaisAtencao.length} materiais em zona de atenção (estoque abaixo da segurança)</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-success opacity-50" />
          <p className="text-lg font-medium text-success">Operação Normal</p>
          <p className="text-sm mt-1">Todos os materiais dentro dos parâmetros. IA em modo silencioso.</p>
        </div>
      )}
    </div>
  );

  // === ANALYTICS ===
  const renderAnalytics = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ModuleCard title="Alcance por Material (dias)" variant="cic">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={materiais.map(m => ({ nome: m.nome.substring(0, 12), alcance: m.alcance_estoque || 0 }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="nome" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }} angle={-30} textAnchor="end" height={50} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(v: number) => [`${v.toFixed(1)} dias`, 'Alcance']} />
                <Bar dataKey="alcance" radius={[4, 4, 0, 0]}>
                  {materiais.map((m, i) => (
                    <Cell key={i} fill={(m.alcance_estoque || 0) < 1 ? CHART_COLORS.vermelho : (m.alcance_estoque || 0) < 3 ? CHART_COLORS.amarelo : CHART_COLORS.verde} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ModuleCard>
        <ModuleCard title="Valor em Estoque por Material" variant="cic">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[...materiais].sort((a, b) => (b.valor_estoque || 0) - (a.valor_estoque || 0)).slice(0, 8).map(m => ({ nome: m.nome.substring(0, 10), valor: m.valor_estoque || 0 }))} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="nome" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} width={90} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(v: number) => [`R$ ${v.toLocaleString('pt-BR')}`, 'Valor']} />
                <Bar dataKey="valor" fill={CHART_COLORS.azulMarinho} radius={[0, 4, 4, 0]} />
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
            <h3 className="text-cic font-display text-lg font-bold">CIC CONTROL</h3>
            <p className="text-xs text-muted-foreground">Inteligência de Compras</p>
          </>
        ) : (
          <div className="w-8 h-8 rounded-lg bg-cic/20 flex items-center justify-center mx-auto">
            <Package className="h-4 w-4 text-cic" />
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
              activeTab === item.id ? 'bg-cic/20 text-cic font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50',
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
    <div className="flex animate-fade-in h-full overflow-hidden">
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
              <div className="w-2 h-2 rounded-full bg-cic animate-pulse" />
              <span className="text-sm font-semibold text-cic">CIC CONTROL</span>
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
            className="absolute -right-4 top-6 w-8 h-8 bg-cic border-2 border-cic/50 rounded-full flex items-center justify-center hover:bg-cic/80 hover:scale-110 transition-all z-10 shadow-lg shadow-cic/30 text-white"
          >
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
          <SidebarContent isCollapsed={sidebarCollapsed} />
        </aside>
      )}

      <main className={cn(
        'flex-1 overflow-y-auto',
        isMobile ? 'pt-28 px-3 pb-4' : 'p-4 lg:p-6'
      )}>
        {!isMobile && (
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cic/20 flex items-center justify-center">
                  <Warehouse className="h-5 w-5 text-cic" />
                </div>
                {menuItems.find(m => m.id === activeTab)?.label || 'Dashboard'}
              </h2>
              <p className="text-muted-foreground mt-1 ml-13">CIC CONTROL – Central de Inteligência de Compras</p>
            </div>
            <Button variant="ghost" size="sm" onClick={loadData}><RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />Atualizar</Button>
          </div>
        )}
        {renderContent()}
      </main>
    </div>
  );
}
