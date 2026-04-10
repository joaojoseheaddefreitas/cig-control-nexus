import { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { CICEstoqueMateriais } from '@/components/cic/CICEstoqueMateriais';
import { CICFornecedores } from '@/components/cic/CICFornecedores';
import { CICCompras } from '@/components/cic/CICCompras';
import { CICMRP } from '@/components/cic/CICMRP';
import { CIIA } from '@/components/cic/CIIA';
import { CICAnalytics } from '@/components/cic/CICAnalytics';
import { KPICard } from '@/components/ui/KPICard';
import { ModuleCard } from '@/components/ui/ModuleCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Package, AlertTriangle, ShoppingCart, BarChart2,
  Warehouse, Users, Brain, Activity, Home, Zap,
  ArrowUpCircle, ClipboardList, DollarSign,
  Search, Plus, Edit, Clock, TrendingUp,
  CheckCircle2, FileText, ChevronLeft, ChevronRight, Menu, X, RefreshCw,
  Download, Truck, AlertCircle, Ban, Timer, CircleDollarSign,
  Shield, OctagonAlert,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { fetchMateriais, type Material } from '@/services/materiaisService';
import { fetchPedidosCompra, type PedidoCompra } from '@/services/pedidoCompraService';

const CHART_COLORS = {
  azulMarinho: 'hsl(215, 75%, 48%)',
  verde: 'hsl(145, 70%, 42%)',
  amarelo: 'hsl(45, 95%, 50%)',
  vermelho: 'hsl(0, 72%, 51%)',
  laranja: 'hsl(30, 90%, 50%)',
  azulClaro: 'hsl(200, 75%, 50%)',
  roxo: 'hsl(270, 60%, 55%)',
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
  const [pedidosCompra, setPedidosCompra] = useState<PedidoCompra[]>([]);
  const [contasPagar, setContasPagar] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchMat, setSearchMat] = useState('');
  const [searchForn, setSearchForn] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [drilldownOpen, setDrilldownOpen] = useState(false);
  const [drilldownTitle, setDrilldownTitle] = useState('');
  const [drilldownData, setDrilldownData] = useState<any[]>([]);
  const isMobile = useIsMobile();

  // Filters
  const [filterFornecedor, setFilterFornecedor] = useState('todos');
  const [filterCategoria, setFilterCategoria] = useState('todos');
  const [filterStatusPC, setFilterStatusPC] = useState('todos');

  const loadData = async () => {
    setLoading(true);
    const [matsData, fornData, pcData, cpData] = await Promise.all([
      fetchMateriais(),
      supabase.from('fornecedores').select('*').eq('ativo', true).order('nome'),
      fetchPedidosCompra(),
      supabase.from('contas_pagar').select('*').order('data_vencimento'),
    ]);
    setMateriais(matsData);
    setFornecedores(fornData.data || []);
    setPedidosCompra(pcData);
    setContasPagar(cpData.data || []);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  // Derived data
  const materiaisCriticos = materiais.filter(m => m.status === 'critico');
  const materiaisAtencao = materiais.filter(m => m.status === 'atencao');
  const valorEstoqueTotal = materiais.reduce((s, m) => s + (m.valor_estoque || 0), 0);
  const totalPropostaCompra = materiais.reduce((s, m) => s + (m.proposta_compra || 0) * m.valor_unitario, 0);

  // Filter pedidos compra
  const filteredPC = useMemo(() => {
    let pcs = pedidosCompra;
    if (filterFornecedor !== 'todos') pcs = pcs.filter(p => p.fornecedor_nome === filterFornecedor);
    if (filterCategoria !== 'todos') {
      const matIds = materiais.filter(m => m.categoria === filterCategoria).map(m => m.id);
      pcs = pcs.filter(p => p.material_id && matIds.includes(p.material_id));
    }
    if (filterStatusPC !== 'todos') pcs = pcs.filter(p => p.status === filterStatusPC);
    return pcs;
  }, [pedidosCompra, filterFornecedor, filterCategoria, filterStatusPC, materiais]);

  // Risco de parada calculation
  const materiaisComRisco = useMemo(() => {
    return materiais.map(m => {
      const pcAbertos = pedidosCompra
        .filter(p => p.material_id === m.id && !['recebido', 'cancelado'].includes(p.status))
        .reduce((s, p) => s + p.quantidade, 0);
      const necessidade = m.consumo_medio_diario * m.lead_time_dias;
      const cobertura = m.estoque_atual + pcAbertos;
      const emRisco = cobertura < necessidade && m.consumo_medio_diario > 0;
      const coberturaPercent = necessidade > 0 ? (cobertura / necessidade) * 100 : 999;
      const risco = emRisco ? 'risco' : coberturaPercent < 150 ? 'atencao' : 'seguro';
      return { ...m, pcAbertos, necessidade, coberturaTotal: cobertura, risco, coberturaPercent };
    }).filter(m => m.consumo_medio_diario > 0);
  }, [materiais, pedidosCompra]);

  const qtdRisco = materiaisComRisco.filter(m => m.risco === 'risco').length;

  // Purchase order stats
  const hoje = new Date().toISOString().split('T')[0];
  const comprasAtivas = filteredPC.filter(p => !['recebido', 'cancelado'].includes(p.status));
  const pedidosAtrasados = filteredPC.filter(p => p.data_previsao && p.data_previsao < hoje && !['recebido', 'cancelado'].includes(p.status));
  const valorEmCompras = comprasAtivas.reduce((s, p) => s + p.valor_total, 0);
  const pedidosPendentes = filteredPC.filter(p => p.status === 'emitido');
  const recebidosHoje = filteredPC.filter(p => p.data_recebimento === hoje);
  
  // Financial
  const valorAPagar = contasPagar.filter(c => c.status === 'pendente').reduce((s, c) => s + Number(c.valor), 0);
  const pagamentosVencidos = contasPagar.filter(c => c.status === 'pendente' && c.data_vencimento < hoje);
  const pagamentosRealizados = contasPagar.filter(c => c.status === 'pago');
  const valorPago = pagamentosRealizados.reduce((s, c) => s + Number(c.valor), 0);
  const valorVencido = pagamentosVencidos.reduce((s, c) => s + Number(c.valor), 0);

  const categorias = [...new Set(materiais.map(m => m.categoria))];
  const fornecedorNames = [...new Set(pedidosCompra.map(p => p.fornecedor_nome).filter(Boolean))];

  const openDrilldown = (title: string, data: any[]) => {
    setDrilldownTitle(title);
    setDrilldownData(data);
    setDrilldownOpen(true);
  };

  const fmtCurrency = (v: number) => v >= 999500 ? `R$ ${(v / 1000000).toFixed(2)}M` : v >= 1000 ? `R$ ${(v / 1000).toFixed(0)}k` : `R$ ${v.toFixed(0)}`;

  const handleTabChange = (tabId: CICTab) => {
    setActiveTab(tabId);
    setSidebarOpen(false);
  };

  const filteredMateriais = materiais.filter(m =>
    m.nome.toLowerCase().includes(searchMat.toLowerCase()) ||
    m.codigo.toLowerCase().includes(searchMat.toLowerCase())
  );

  const handleExportCSV = () => {
    const headers = ['Material', 'Estoque', 'Alcance (dias)', 'Status', 'Proposta Compra', 'Valor Estoque'];
    const rows = materiais.map(m => [
      m.nome, m.estoque_atual, (m.alcance_estoque || 0).toFixed(1), m.status || '', m.proposta_compra || 0, (m.valor_estoque || 0).toFixed(2)
    ]);
    const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `dashboard_cic_${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return renderDashboard();
      case 'materiais': return renderMateriais();
      case 'estoques': return <CICEstoqueMateriais />;
      case 'compras': return <CICCompras />;
      case 'fornecedores': return <CICFornecedores />;
      case 'mrp': return <CICMRP />;
      case 'ia': return <CIIA />;
      case 'analytics': return <CICAnalytics />;
      default: return renderDashboard();
    }
  };

  // === SUPERDASHBOARD ===
  const renderDashboard = () => {
    // Pipeline data
    const pipelineStatuses = ['emitido', 'aprovado', 'em_producao', 'em_transporte', 'recebido', 'atrasado'];
    const pipelineLabels: Record<string, string> = {
      emitido: 'Emitido', aprovado: 'Aprovado', em_producao: 'Em Produção',
      em_transporte: 'Em Transporte', recebido: 'Recebido', atrasado: 'Atrasado'
    };
    const pipelineColors: Record<string, string> = {
      emitido: CHART_COLORS.azulClaro, aprovado: CHART_COLORS.azulMarinho,
      em_producao: CHART_COLORS.amarelo, em_transporte: CHART_COLORS.laranja,
      recebido: CHART_COLORS.verde, atrasado: CHART_COLORS.vermelho,
    };

    // Mark overdue as atrasado for pipeline
    const pcWithOverdue = filteredPC.map(p => {
      if (p.data_previsao && p.data_previsao < hoje && !['recebido', 'cancelado'].includes(p.status)) {
        return { ...p, pipelineStatus: 'atrasado' };
      }
      return { ...p, pipelineStatus: p.status };
    });

    const pipelineData = pipelineStatuses.map(s => ({
      name: pipelineLabels[s] || s,
      value: pcWithOverdue.filter(p => p.pipelineStatus === s).length,
      fill: pipelineColors[s] || CHART_COLORS.azulClaro,
    }));

    // Atrasos por fornecedor
    const atrasosPorFornecedor = new Map<string, number>();
    pedidosAtrasados.forEach(p => {
      const nome = p.fornecedor_nome || 'Sem Fornecedor';
      atrasosPorFornecedor.set(nome, (atrasosPorFornecedor.get(nome) || 0) + 1);
    });
    const atrasosData = Array.from(atrasosPorFornecedor.entries())
      .map(([nome, qtd]) => ({ nome: nome.substring(0, 18), qtd }))
      .sort((a, b) => b.qtd - a.qtd).slice(0, 8);

    // Financial chart
    const financeiroData = [
      { name: 'A Pagar', valor: valorAPagar, fill: CHART_COLORS.amarelo },
      { name: 'Pagos', valor: valorPago, fill: CHART_COLORS.verde },
      { name: 'Vencidos', valor: valorVencido, fill: CHART_COLORS.vermelho },
    ];

    // Performance fornecedores (OTIF)
    const fornPerf = new Map<string, { total: number; onTime: number; inFull: number; leadTimes: number[] }>();
    pedidosCompra.filter(p => p.status === 'recebido').forEach(p => {
      const nome = p.fornecedor_nome || 'Sem Nome';
      const current = fornPerf.get(nome) || { total: 0, onTime: 0, inFull: 0, leadTimes: [] };
      current.total++;
      if (p.on_time) current.onTime++;
      if (p.in_full) current.inFull++;
      if (p.data_emissao && p.data_recebimento) {
        const diff = Math.round((new Date(p.data_recebimento).getTime() - new Date(p.data_emissao).getTime()) / 86400000);
        if (diff > 0) current.leadTimes.push(diff);
      }
      fornPerf.set(nome, current);
    });
    const perfData = Array.from(fornPerf.entries())
      .map(([nome, d]) => ({
        nome: nome.substring(0, 15),
        otif: d.total > 0 ? Math.round(((d.onTime + d.inFull) / (d.total * 2)) * 100) : 0,
        leadTime: d.leadTimes.length > 0 ? Math.round(d.leadTimes.reduce((s, v) => s + v, 0) / d.leadTimes.length) : 0,
      }))
      .sort((a, b) => b.otif - a.otif).slice(0, 8);

    // Estoque por categoria (existing)
    const cats = new Map<string, number>();
    materiais.forEach(m => cats.set(m.categoria, (cats.get(m.categoria) || 0) + (m.valor_estoque || 0)));
    const pieColors = [CHART_COLORS.azulMarinho, CHART_COLORS.verde, CHART_COLORS.amarelo, CHART_COLORS.laranja, CHART_COLORS.vermelho, CHART_COLORS.azulClaro];
    const pieData = Array.from(cats.entries()).map(([cat, val], i) => ({ name: cat, value: val, color: pieColors[i % pieColors.length] }));

    // Materiais sorted by coverage for risk list
    const riscoSorted = [...materiaisComRisco].sort((a, b) => a.coberturaPercent - b.coberturaPercent);

    return (
      <div className="space-y-5">
        {/* FILTROS */}
        <div className="flex flex-wrap gap-2 items-center p-3 rounded-xl bg-secondary/30 border border-border/30">
          <span className="text-xs font-semibold text-muted-foreground mr-1">Filtros:</span>
          <Select value={filterFornecedor} onValueChange={setFilterFornecedor}>
            <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="Fornecedor" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos Fornecedores</SelectItem>
              {fornecedorNames.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterCategoria} onValueChange={setFilterCategoria}>
            <SelectTrigger className="h-8 w-32 text-xs"><SelectValue placeholder="Categoria" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas Categorias</SelectItem>
              {categorias.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatusPC} onValueChange={setFilterStatusPC}>
            <SelectTrigger className="h-8 w-32 text-xs"><SelectValue placeholder="Status PC" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos Status</SelectItem>
              <SelectItem value="emitido">Emitido</SelectItem>
              <SelectItem value="aprovado">Aprovado</SelectItem>
              <SelectItem value="em_producao">Em Produção</SelectItem>
              <SelectItem value="em_transporte">Em Transporte</SelectItem>
              <SelectItem value="recebido">Recebido</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="h-8 text-xs ml-auto gap-1" onClick={handleExportCSV}>
            <Download className="h-3.5 w-3.5" /> Exportar CSV
          </Button>
        </div>

        {/* LINHA 1 — KPIs Compras + Risco */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
          <div className="cursor-pointer" onClick={() => openDrilldown('Compras Ativas', comprasAtivas.map(p => ({ Pedido: p.id.slice(0,8), Material: p.material_nome, Fornecedor: p.fornecedor_nome, Valor: `R$ ${p.valor_total.toFixed(2)}`, Status: p.status })))}>
            <KPICard title="Compras Ativas" value={comprasAtivas.length} subtitle="Em andamento" icon={<ShoppingCart className="h-4 w-4" />} variant="cic" />
          </div>
          <div className="cursor-pointer" onClick={() => openDrilldown('Pedidos Atrasados', pedidosAtrasados.map(p => ({ Material: p.material_nome, Fornecedor: p.fornecedor_nome, Previsão: p.data_previsao, Valor: `R$ ${p.valor_total.toFixed(2)}` })))}>
            <KPICard title="Ped. Atrasados" value={pedidosAtrasados.length} subtitle="Fora do prazo" icon={<AlertCircle className="h-4 w-4" />} variant="cic" trend={pedidosAtrasados.length > 0 ? 'down' : 'up'} trendValue={pedidosAtrasados.length > 0 ? 'Atenção' : 'OK'} />
          </div>
          <div className="cursor-pointer" onClick={() => openDrilldown('Valor em Compras', comprasAtivas.map(p => ({ Material: p.material_nome, Valor: `R$ ${p.valor_total.toFixed(2)}`, Status: p.status })))}>
            <KPICard title="Valor Compras" value={fmtCurrency(valorEmCompras)} subtitle="Total ativo" icon={<DollarSign className="h-4 w-4" />} variant="cic" />
          </div>
          <div className="cursor-pointer" onClick={() => openDrilldown('Pedidos Pendentes', pedidosPendentes.map(p => ({ Material: p.material_nome, Fornecedor: p.fornecedor_nome, Valor: `R$ ${p.valor_total.toFixed(2)}` })))}>
            <KPICard title="Ped. Pendentes" value={pedidosPendentes.length} subtitle="Aguardando" icon={<Timer className="h-4 w-4" />} variant="cic" />
          </div>
          <KPICard title="Recebidos Hoje" value={recebidosHoje.length} subtitle={hoje} icon={<Truck className="h-4 w-4" />} variant="cic" />
          <div className="cursor-pointer" onClick={() => openDrilldown('Valor a Pagar', contasPagar.filter(c => c.status === 'pendente').map(c => ({ Descrição: c.descricao, Vencimento: c.data_vencimento, Valor: `R$ ${Number(c.valor).toFixed(2)}` })))}>
            <KPICard title="Valor a Pagar" value={fmtCurrency(valorAPagar)} subtitle="Pendente" icon={<CircleDollarSign className="h-4 w-4" />} variant="cic" />
          </div>
          <div className="cursor-pointer" onClick={() => openDrilldown('Pagamentos Vencidos', pagamentosVencidos.map(c => ({ Descrição: c.descricao, Vencimento: c.data_vencimento, Valor: `R$ ${Number(c.valor).toFixed(2)}` })))}>
            <KPICard title="Pgtos Vencidos" value={pagamentosVencidos.length} subtitle={fmtCurrency(valorVencido)} icon={<Ban className="h-4 w-4" />} variant="cic" trend={pagamentosVencidos.length > 0 ? 'down' : 'up'} trendValue={pagamentosVencidos.length > 0 ? 'Alerta' : 'OK'} />
          </div>
          {/* RISCO DE PARADA */}
          <div
            className={cn(
              "p-2 rounded-xl border-2 flex flex-col justify-center items-center cursor-pointer transition-all",
              qtdRisco > 0 ? "bg-destructive/10 border-destructive/50 animate-pulse" :
              materiaisComRisco.filter(m => m.risco === 'atencao').length > 0 ? "bg-warning/10 border-warning/40" :
              "bg-success/10 border-success/30"
            )}
            onClick={() => openDrilldown('Risco de Parada', riscoSorted.filter(m => m.risco !== 'seguro').map(m => ({
              Material: m.nome, Estoque: m.estoque_atual, 'PC Abertos': m.pcAbertos,
              Necessidade: m.necessidade.toFixed(1), Cobertura: `${m.coberturaPercent.toFixed(0)}%`, Risco: m.risco
            })))}
          >
            {qtdRisco > 0 && <OctagonAlert className="h-5 w-5 text-destructive mb-1" />}
            <span className="text-[9px] text-muted-foreground uppercase font-semibold">Risco Parada</span>
            <span className={cn("text-lg font-bold",
              qtdRisco > 0 ? "text-destructive" :
              materiaisComRisco.filter(m => m.risco === 'atencao').length > 0 ? "text-warning" : "text-success"
            )}>
              {qtdRisco > 0 ? `🔴 ${qtdRisco}` : materiaisComRisco.filter(m => m.risco === 'atencao').length > 0 ? `🟡 ${materiaisComRisco.filter(m => m.risco === 'atencao').length}` : '🟢 0'}
            </span>
          </div>
        </div>

        {/* LINHA 2 — Estoque (existente) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
          <KPICard title="Valor Estoque" value={fmtCurrency(valorEstoqueTotal)} subtitle="Total valorizado" icon={<Warehouse className="h-4 w-4" />} variant="cic" />
          <KPICard title="Materiais Ativos" value={materiais.length} subtitle="Cadastrados" icon={<Package className="h-4 w-4" />} variant="cic" />
          <KPICard title="Proposta Compra" value={fmtCurrency(totalPropostaCompra)} subtitle="Valor estimado" icon={<ShoppingCart className="h-4 w-4" />} variant="cic" />
          <div className="cursor-pointer" onClick={() => openDrilldown('Materiais Críticos', materiaisCriticos.map(m => ({
            Material: m.nome, Estoque: `${m.estoque_atual} ${m.unidade}`, Alcance: `${(m.alcance_estoque||0).toFixed(1)}d`, 'Ponto Pedido': m.ponto_pedido
          })))}>
            <KPICard title="Mat. Críticos" value={materiaisCriticos.length} subtitle="Abaixo ponto pedido" icon={<AlertTriangle className="h-4 w-4" />} variant="cic" trend={materiaisCriticos.length > 0 ? 'down' : 'up'} trendValue={materiaisCriticos.length > 0 ? 'Atenção' : 'OK'} />
          </div>
          <div className={cn(
            "p-2 rounded-xl border flex flex-col justify-center items-center",
            materiaisCriticos.length > 3 ? "bg-destructive/10 border-destructive/30" :
            materiaisCriticos.length > 0 ? "bg-warning/10 border-warning/30" :
            "bg-success/10 border-success/30"
          )}>
            <span className="text-[9px] text-muted-foreground uppercase">Status Geral</span>
            <span className={cn("text-lg font-bold mt-1",
              materiaisCriticos.length > 3 ? "text-destructive" :
              materiaisCriticos.length > 0 ? "text-warning" : "text-success"
            )}>
              {materiaisCriticos.length > 3 ? 'CRÍTICO' : materiaisCriticos.length > 0 ? 'ATENÇÃO' : 'NORMAL'}
            </span>
          </div>
        </div>

        {/* LINHA 3 — Gráficos Estoque */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ModuleCard title="Estoque por Categoria" variant="cic">
            <div className="h-56 flex items-center">
              <div className="w-1/2 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={35} outerRadius={65} paddingAngle={3} dataKey="value">
                    {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie><Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(v: number) => [`R$ ${v.toLocaleString('pt-BR')}`, '']} /></PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-1/2 space-y-1.5">
                {pieData.map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} /><span className="text-[10px] text-muted-foreground">{item.name}</span></div>
                    <span className="text-[10px] font-semibold">{fmtCurrency(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </ModuleCard>

          <ModuleCard title="Top Materiais por Valor" variant="cic">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[...materiais].sort((a, b) => (b.valor_estoque || 0) - (a.valor_estoque || 0)).slice(0, 6).map(m => ({ nome: m.nome.substring(0, 12), valor: m.valor_estoque || 0 }))} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} tickFormatter={(v) => fmtCurrency(v)} />
                  <YAxis type="category" dataKey="nome" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }} width={90} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(v: number) => [`R$ ${v.toLocaleString('pt-BR')}`, 'Valor']} />
                  <Bar dataKey="valor" fill={CHART_COLORS.laranja} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ModuleCard>
        </div>

        {/* LINHA 4 — Compras: Pipeline + Atrasos por Fornecedor */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ModuleCard title="Pipeline de Compras" variant="cic">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pipelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(v: number) => [`${v} pedidos`, '']} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {pipelineData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ModuleCard>

          <ModuleCard title="Atrasos por Fornecedor" variant="cic">
            <div className="h-56">
              {atrasosData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  <CheckCircle2 className="h-5 w-5 mr-2 text-success" /> Sem atrasos registrados
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={atrasosData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} allowDecimals={false} />
                    <YAxis type="category" dataKey="nome" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }} width={120} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(v: number) => [`${v} atrasados`, '']} />
                    <Bar dataKey="qtd" fill={CHART_COLORS.vermelho} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </ModuleCard>
        </div>

        {/* LINHA 5 — Fornecedores Performance + Financeiro */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ModuleCard title="Performance Fornecedores (OTIF %)" variant="cic">
            <div className="h-56">
              {perfData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  Nenhum pedido recebido para avaliar
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={perfData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="nome" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} domain={[0, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                      formatter={(v: number, name: string) => [name === 'otif' ? `${v}%` : `${v}d`, name === 'otif' ? 'OTIF' : 'Lead Time']} />
                    <Bar dataKey="otif" fill={CHART_COLORS.verde} radius={[4, 4, 0, 0]} name="OTIF" />
                    <Bar dataKey="leadTime" fill={CHART_COLORS.azulClaro} radius={[4, 4, 0, 0]} name="Lead Time (dias)" />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </ModuleCard>

          <ModuleCard title="Financeiro das Compras" variant="cic">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financeiroData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} tickFormatter={(v) => fmtCurrency(v)} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                    formatter={(v: number) => [`R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, '']} />
                  <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
                    {financeiroData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ModuleCard>
        </div>

        {/* RISCO DE PARADA — Lista detalhada */}
        {riscoSorted.filter(m => m.risco !== 'seguro').length > 0 && (
          <ModuleCard title="⚠ Materiais com Risco de Parada de Produção" variant="cic">
            <ScrollArea className="max-h-[250px]">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border/50 bg-secondary/30 sticky top-0 z-10">
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium text-xs">Material</th>
                  <th className="text-center py-2 px-2 text-muted-foreground font-medium text-xs">Estoque</th>
                  <th className="text-center py-2 px-2 text-muted-foreground font-medium text-xs">PC Abertos</th>
                  <th className="text-center py-2 px-2 text-muted-foreground font-medium text-xs">Cobertura</th>
                  <th className="text-center py-2 px-2 text-muted-foreground font-medium text-xs">Necessidade</th>
                  <th className="text-center py-2 px-2 text-muted-foreground font-medium text-xs">Cobertura %</th>
                  <th className="text-center py-2 px-2 text-muted-foreground font-medium text-xs">Risco</th>
                </tr></thead>
                <tbody>
                  {riscoSorted.filter(m => m.risco !== 'seguro').map(m => (
                    <tr key={m.id} className={cn("border-b border-border/30", m.risco === 'risco' ? "bg-destructive/5" : "bg-warning/5")}>
                      <td className="py-2 px-3 font-medium text-xs">{m.nome}</td>
                      <td className="py-2 px-2 text-center text-xs">{m.estoque_atual} {m.unidade}</td>
                      <td className="py-2 px-2 text-center text-xs">{m.pcAbertos}</td>
                      <td className="py-2 px-2 text-center font-semibold text-xs">{m.coberturaTotal.toFixed(1)}</td>
                      <td className="py-2 px-2 text-center text-xs text-muted-foreground">{m.necessidade.toFixed(1)}</td>
                      <td className="py-2 px-2 text-center text-xs">
                        <span className={cn("font-bold", m.risco === 'risco' ? "text-destructive" : "text-warning")}>
                          {m.coberturaPercent.toFixed(0)}%
                        </span>
                      </td>
                      <td className="py-2 px-2 text-center">
                        <Badge className={cn("text-[10px]", m.risco === 'risco' ? 'bg-destructive/20 text-destructive' : 'bg-warning/20 text-warning')}>
                          {m.risco === 'risco' ? '🔴 RISCO' : '🟡 Atenção'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          </ModuleCard>
        )}
      </div>
    );
  };

  // === GESTÃO DE MATERIAIS ===
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
  const renderFornecedores = () => <CICFornecedores />;

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
                <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">Todos os materiais dentro dos parâmetros.</td></tr>
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
                <p className="text-sm text-muted-foreground">{materiaisAtencao.length} materiais em zona de atenção</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-success opacity-50" />
          <p className="text-lg font-medium text-success">Operação Normal</p>
          <p className="text-sm mt-1">Todos os materiais dentro dos parâmetros.</p>
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
                <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} tickFormatter={(v) => fmtCurrency(v)} />
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

      {/* Drilldown Modal */}
      <Dialog open={drilldownOpen} onOpenChange={setDrilldownOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-cic">{drilldownTitle}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            {drilldownData.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhum registro encontrado.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 bg-secondary/30">
                    {Object.keys(drilldownData[0] || {}).map(key => (
                      <th key={key} className="text-left py-2 px-3 text-muted-foreground font-medium text-xs">{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {drilldownData.map((row, i) => (
                    <tr key={i} className="border-b border-border/30 hover:bg-secondary/30">
                      {Object.values(row).map((val, j) => (
                        <td key={j} className="py-2 px-3 text-xs">{String(val ?? '—')}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
