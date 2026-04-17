import { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ComposedChart, Line, Legend, AreaChart, Area, LineChart,
} from 'recharts';
import { ModuleCard } from '@/components/ui/ModuleCard';
import {
  LayoutDashboard, TrendingUp, Factory, DollarSign, Clock,
  AlertTriangle, Activity, RefreshCw, Warehouse, Package,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { calcularCapacidadeFabrica, type CapacidadeFabrica } from '@/services/capacidadeIndustrialService';
import { Button } from '@/components/ui/button';
import { fetchMateriais, type Material } from '@/services/materiaisService';
import { fetchCIFData, type CIFDashboardData } from '@/services/cifService';

const CHART_COLORS = {
  azulMarinho: 'hsl(215, 75%, 48%)',
  verde: 'hsl(145, 70%, 42%)',
  amarelo: 'hsl(45, 95%, 50%)',
  vermelho: 'hsl(0, 72%, 51%)',
  laranja: 'hsl(30, 90%, 50%)',
  azulClaro: 'hsl(200, 75%, 50%)',
};

interface PedidoRow {
  id: string;
  status: string;
  status_producao: string;
  valor_total: number;
  canal: string;
  data_entrada: string;
  quantidade: number;
}

interface OPRow {
  id: string;
  status_producao: string;
  current_sector: string | null;
  tempo_total: number | null;
  created_at: string;
  quantidade: number;
  data_programada: string | null;
}

interface KPIData {
  totalPedidos: number;
  pedidosEmProducao: number;
  pedidosAguardando: number;
  pedidosFinalizados: number;
  valorCarteiraTotal: number;
  horasCarteira: number;
  totalOPs: number;
  opsEmProducao: number;
  totalSetores: number;
  capacidadeDiaria: number;
  pedidosPorStatus: { status: string; count: number }[];
  pedidosPorCanal: { canal: string; valor: number }[];
  setoresProducao: { nome: string; opsAtivas: number; capacidade: number; carga: number }[];
  alertas: string[];
  materiaisCriticos: Material[];
  valorEstoque: number;
  totalPropostaCompra: number;
  cifData: CIFDashboardData | null;
  // Unified series — vendas e produção do mês corrente (por dia útil)
  vendasMesAtual: { dia: string; label: string; valor: number; qtd: number }[];
  producaoMesAtual: { dia: string; label: string; qtd: number; horas: number }[];
  // Comparativo anual (vendido vs produzido em valor)
  comparativoAnual: { mes: string; vendido: number; produzido: number }[];
  pedidosAtrasados: number;
}

interface DashboardCIGMelhoradoProps {
  onGoHome?: () => void;
}

// Helper: format month key
const mesKey = (d: string) => {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
};
const mesLabel = (k: string) => {
  const [y, m] = k.split('-');
  const names = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  return `${names[parseInt(m) - 1]}/${y.slice(2)}`;
};
const diaKey = (d: string) => d.slice(0, 10);
const diaLabel = (k: string) => {
  const [, m, d] = k.split('-');
  return `${d}/${m}`;
};

// Generate example data when DB is empty
function gerarDadosExemplo() {
  const meses: { mes: string; valor: number; qtd: number; produzido: number }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
    const vendas = Math.round(80000 + Math.random() * 120000);
    const qtdVendida = Math.round(15 + Math.random() * 35);
    const qtdProduzida = Math.round(qtdVendida * (0.75 + Math.random() * 0.35));
    meses.push({ mes: key, valor: vendas, qtd: qtdVendida, produzido: qtdProduzida });
  }

  const dias: { dia: string; valor: number; qtd: number; produzido: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const dt = new Date();
    dt.setDate(dt.getDate() - i);
    const key = dt.toISOString().slice(0, 10);
    dias.push({
      dia: key,
      valor: Math.round(3000 + Math.random() * 15000),
      qtd: Math.round(1 + Math.random() * 5),
      produzido: Math.round(1 + Math.random() * 4),
    });
  }

  return {
    vendasMensal: meses.map(m => ({ mes: m.mes, valor: m.valor, qtd: m.qtd })),
    vendasDiario: dias.map(d => ({ dia: d.dia, valor: d.valor, qtd: d.qtd })),
    producaoMensal: meses.map(m => ({ mes: m.mes, qtd: m.produzido })),
    producaoDiario: dias.map(d => ({ dia: d.dia, qtd: d.produzido })),
    comparativoMensal: meses.map(m => ({ mes: m.mes, vendido: m.qtd, produzido: m.produzido })),
  };
}

export function DashboardCIGMelhorado({ onGoHome }: DashboardCIGMelhoradoProps) {
  const [kpis, setKpis] = useState<KPIData>({
    totalPedidos: 0, pedidosEmProducao: 0, pedidosAguardando: 0, pedidosFinalizados: 0,
    valorCarteiraTotal: 0, horasCarteira: 0, totalOPs: 0, opsEmProducao: 0,
    totalSetores: 0, capacidadeDiaria: 8,
    pedidosPorStatus: [], pedidosPorCanal: [], setoresProducao: [], alertas: [],
    materiaisCriticos: [], valorEstoque: 0, totalPropostaCompra: 0, cifData: null,
    vendasMensal: [], vendasDiario: [], producaoMensal: [], producaoDiario: [],
    comparativoMensal: [], pedidosAtrasados: 0,
  });
  const [capacidade, setCapacidade] = useState<CapacidadeFabrica | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [usandoExemplo, setUsandoExemplo] = useState(false);

  useEffect(() => {
    loadData();
    const channel = supabase
      .channel('cig-dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ops' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'setores_produtivos' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'materiais' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'op_route_steps' }, () => loadData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pedidosRes, opsRes, carteiraRes, setoresRes, configRes, materiais, cifData, routeStepsRes, capFabrica] = await Promise.all([
        supabase.from('pedidos').select('id, status, status_producao, valor_total, canal, data_entrada, quantidade').order('created_at', { ascending: false }),
        supabase.from('ops').select('id, status_producao, current_sector, tempo_total, created_at, quantidade, data_programada').neq('status_producao', 'cancelado'),
        supabase.from('carteira_producao').select('total_horas_acumuladas').limit(1).maybeSingle(),
        supabase.from('setores_produtivos').select('*').eq('ativo', true).order('ordem'),
        supabase.from('configuracoes_capacidade').select('capacidade_produtiva_diaria').limit(1).maybeSingle(),
        fetchMateriais(),
        fetchCIFData(),
        supabase.from('op_route_steps').select('op_id, setor_id, tempo_estimado'),
        calcularCapacidadeFabrica(),
      ]);

      const pedidos = (pedidosRes.data || []) as PedidoRow[];
      const ops = (opsRes.data || []) as OPRow[];
      const horasCarteira = capFabrica.horasNecessarias;
      const setores = setoresRes.data || [];
      const capacidadeDiaria = capFabrica.capacidadeDiaria > 0 ? capFabrica.capacidadeDiaria : (configRes.data ? Number(configRes.data.capacidade_produtiva_diaria) : 8);
      const routeSteps = routeStepsRes.data || [];
      setCapacidade(capFabrica);

      // Status breakdown
      const statusMap: Record<string, number> = {};
      pedidos.forEach(p => { statusMap[p.status] = (statusMap[p.status] || 0) + 1; });
      const statusLabels: Record<string, string> = {
        aguardando: 'Aguardando', programado: 'Programado', em_producao: 'Em Produção',
        finalizado: 'Finalizado', cancelado: 'Cancelado', aprovado: 'Aprovado',
      };
      const pedidosPorStatus = Object.entries(statusMap)
        .filter(([s]) => s !== 'cancelado')
        .map(([status, count]) => ({ status: statusLabels[status] || status, count }));

      // Canal breakdown
      const canalMap: Record<string, number> = {};
      pedidos.filter(p => p.status !== 'cancelado').forEach(p => {
        const canal = p.canal || 'Outros';
        canalMap[canal] = (canalMap[canal] || 0) + Number(p.valor_total || 0);
      });
      const pedidosPorCanal = Object.entries(canalMap)
        .map(([canal, valor]) => ({ canal, valor }))
        .sort((a, b) => b.valor - a.valor);

      // Sector load
      const activeOpIds = new Set(ops.filter(o => o.status_producao !== 'Producao Finalizada').map(o => o.id));
      const setorCargaMap: Record<string, number> = {};
      (routeSteps as any[]).forEach((step: any) => {
        if (activeOpIds.has(step.op_id)) {
          setorCargaMap[step.setor_id] = (setorCargaMap[step.setor_id] || 0) + Number(step.tempo_estimado || 0);
        }
      });
      const setoresProducaoData = setores.map((s: any) => {
        const cap = (s.mao_de_obra + s.maquinas_automaticas) * s.horas_turno * s.eficiencia;
        return { nome: s.nome.replace(' / ', '/').substring(0, 16), opsAtivas: 0, capacidade: cap, carga: setorCargaMap[s.id] || 0 };
      });
      ops.forEach(op => {
        if (op.current_sector) {
          const found = setoresProducaoData.find(s => op.current_sector?.includes(s.nome.substring(0, 8)));
          if (found) found.opsAtivas++;
        }
      });

      const materiaisCriticos = materiais.filter(m => m.status === 'critico');
      const valorEstoque = materiais.reduce((s, m) => s + (m.valor_estoque || 0), 0);
      const totalPropostaCompra = materiais.reduce((s, m) => s + (m.proposta_compra || 0) * m.valor_unitario, 0);

      // === TIME SERIES ===
      const pedidosAtivos = pedidos.filter(p => p.status !== 'cancelado');

      // Vendas mensal
      const vendasMensalMap: Record<string, { valor: number; qtd: number }> = {};
      pedidosAtivos.forEach(p => {
        const k = mesKey(p.data_entrada);
        if (!vendasMensalMap[k]) vendasMensalMap[k] = { valor: 0, qtd: 0 };
        vendasMensalMap[k].valor += Number(p.valor_total || 0);
        vendasMensalMap[k].qtd += Number(p.quantidade || 0);
      });
      const vendasMensal = Object.entries(vendasMensalMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-6)
        .map(([mes, d]) => ({ mes, ...d }));

      // Vendas diário (last 14 days)
      const vendasDiarioMap: Record<string, { valor: number; qtd: number }> = {};
      pedidosAtivos.forEach(p => {
        const k = diaKey(p.data_entrada);
        if (!vendasDiarioMap[k]) vendasDiarioMap[k] = { valor: 0, qtd: 0 };
        vendasDiarioMap[k].valor += Number(p.valor_total || 0);
        vendasDiarioMap[k].qtd += Number(p.quantidade || 0);
      });
      const vendasDiario = Object.entries(vendasDiarioMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-14)
        .map(([dia, d]) => ({ dia, ...d }));

      // Produção mensal (OPs finalizadas by created_at)
      const producaoMensalMap: Record<string, number> = {};
      ops.forEach(op => {
        if (op.status_producao === 'Producao Finalizada') {
          const k = mesKey(op.created_at);
          producaoMensalMap[k] = (producaoMensalMap[k] || 0) + Number(op.quantidade || 1);
        }
      });
      const producaoMensal = Object.entries(producaoMensalMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-6)
        .map(([mes, qtd]) => ({ mes, qtd }));

      // Produção diária
      const producaoDiarioMap: Record<string, number> = {};
      ops.forEach(op => {
        if (op.status_producao === 'Producao Finalizada') {
          const k = diaKey(op.created_at);
          producaoDiarioMap[k] = (producaoDiarioMap[k] || 0) + Number(op.quantidade || 1);
        }
      });
      const producaoDiario = Object.entries(producaoDiarioMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-14)
        .map(([dia, qtd]) => ({ dia, qtd }));

      // Comparativo vendido vs produzido (mensal)
      const allMonths = new Set([...Object.keys(vendasMensalMap), ...Object.keys(producaoMensalMap)]);
      const comparativoMensal = Array.from(allMonths)
        .sort()
        .slice(-6)
        .map(mes => ({
          mes,
          vendido: vendasMensalMap[mes]?.qtd || 0,
          produzido: producaoMensalMap[mes] || 0,
        }));

      // Pedidos atrasados
      const hoje = new Date().toISOString().slice(0, 10);
      const pedidosAtrasados = pedidos.filter(p =>
        p.status !== 'cancelado' && p.status !== 'finalizado' &&
        p.status_producao !== 'Producao Finalizada'
      ).length; // simplified: count active non-finalized

      // Check if we have enough data for charts
      const temDadosGraficos = vendasMensal.length > 0 || producaoMensal.length > 0;
      let dadosExemplo: ReturnType<typeof gerarDadosExemplo> | null = null;
      if (!temDadosGraficos) {
        dadosExemplo = gerarDadosExemplo();
        setUsandoExemplo(true);
      } else {
        setUsandoExemplo(false);
      }

      // Alertas
      const alertas: string[] = [];
      const diasCarteira = capacidadeDiaria > 0 ? Math.ceil(horasCarteira / capacidadeDiaria) : 0;
      if (diasCarteira > 15) alertas.push(`🔴 Sobrecarga: ${diasCarteira} dias de carteira (>15 dias)`);
      else if (diasCarteira > 10) alertas.push(`🟡 Carga alta: ${diasCarteira} dias de carteira`);

      const aguardando = pedidos.filter(p => p.status === 'aguardando').length;
      if (aguardando > 3) alertas.push(`🔴 ${aguardando} pedidos aguardando programação`);
      else if (aguardando > 0) alertas.push(`🟡 ${aguardando} pedido(s) aguardando programação`);

      if (materiaisCriticos.length > 3) alertas.push(`🔴 ${materiaisCriticos.length} materiais em nível CRÍTICO`);
      else if (materiaisCriticos.length > 0) alertas.push(`🟡 ${materiaisCriticos.length} material(is) em nível crítico`);

      const overloaded = setoresProducaoData.filter(s => s.capacidade > 0 && (s.carga / s.capacidade) > 0.9);
      if (overloaded.length > 0) alertas.push(`🟡 ${overloaded.length} setor(es) com carga >90%`);

      const margemLiq = cifData.receita > 0 ? (cifData.ebitda / cifData.receita) * 100 : 0;
      if (margemLiq < 0) alertas.push(`🔴 EBITDA negativo: margem ${margemLiq.toFixed(1)}%`);
      else if (margemLiq < 15) alertas.push(`🟡 Margem abaixo de 15%: ${margemLiq.toFixed(1)}%`);

      if (alertas.length === 0) alertas.push('✅ Operação normal — sem alertas críticos');

      setKpis({
        totalPedidos: pedidosAtivos.length,
        pedidosEmProducao: pedidos.filter(p => p.status === 'programado' || p.status === 'em_producao').length,
        pedidosAguardando: aguardando,
        pedidosFinalizados: pedidos.filter(p => p.status === 'finalizado').length,
        valorCarteiraTotal: pedidosAtivos.reduce((s, p) => s + Number(p.valor_total || 0), 0),
        horasCarteira, totalOPs: ops.length,
        opsEmProducao: ops.filter(o => o.status_producao !== 'Producao Finalizada' && o.status_producao !== 'aguardando').length,
        totalSetores: setores.length, capacidadeDiaria,
        pedidosPorStatus, pedidosPorCanal, setoresProducao: setoresProducaoData,
        alertas, materiaisCriticos, valorEstoque, totalPropostaCompra, cifData,
        vendasMensal: dadosExemplo ? dadosExemplo.vendasMensal : vendasMensal,
        vendasDiario: dadosExemplo ? dadosExemplo.vendasDiario : vendasDiario,
        producaoMensal: dadosExemplo ? dadosExemplo.producaoMensal : producaoMensal,
        producaoDiario: dadosExemplo ? dadosExemplo.producaoDiario : producaoDiario,
        comparativoMensal: dadosExemplo ? dadosExemplo.comparativoMensal : comparativoMensal,
        pedidosAtrasados,
      });
      setLastUpdate(new Date());
    } catch (e) {
      console.error('[CIG] Erro ao carregar dados:', e);
    }
    setLoading(false);
  };

  const temDados = kpis.totalPedidos > 0 || usandoExemplo;
  const diasCarteira = capacidade ? capacidade.diasNecessarios : 0;
  const cargaPercentual = capacidade ? capacidade.percentualOcupacao : 0;
  const prazoVendas = capacidade?.prazoVendasDias ?? 0;
  const gargaloNome = capacidade?.setorGargaloDias ?? 'N/A';
  const fmt = (v: number) => v >= 999500 ? `R$ ${(v / 1000000).toFixed(2)}M` : v >= 1000 ? `R$ ${(v / 1000).toFixed(0)}k` : `R$ ${v.toFixed(0)}`;

  const tooltipStyle = { backgroundColor: 'hsl(220, 20%, 14%)', border: '1px solid hsl(220, 18%, 22%)', borderRadius: '8px', color: 'hsl(210, 20%, 95%)' };

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in h-full overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <LayoutDashboard className="h-5 w-5 text-primary-foreground" />
            </div>
            Dashboard Executivo
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Dados em tempo real • Atualizado: {lastUpdate.toLocaleTimeString('pt-BR')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading} className="gap-2">
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            Atualizar
          </Button>
          <div className={cn('flex items-center gap-2 px-4 py-2 rounded-lg border',
            usandoExemplo
              ? 'bg-warning/10 border-warning/30'
              : 'bg-success/10 border-success/30'
          )}>
            <div className={cn('w-2 h-2 rounded-full animate-pulse', usandoExemplo ? 'bg-warning' : 'bg-success')} />
            <span className={cn('text-sm font-medium', usandoExemplo ? 'text-warning' : 'text-success')}>
              {usandoExemplo ? 'Dados de Exemplo' : 'Dados Reais'}
            </span>
          </div>
        </div>
      </div>

      {/* Alertas */}
      {kpis.alertas.length > 0 && (
        <div className="space-y-2">
          {kpis.alertas.map((alerta, i) => (
            <div key={i} className={cn(
              'p-3 rounded-lg border text-sm font-medium',
              alerta.startsWith('🔴') ? 'bg-destructive/10 border-destructive/30 text-destructive' :
              alerta.startsWith('🟡') ? 'bg-warning/10 border-warning/30 text-warning' :
              'bg-success/10 border-success/30 text-success'
            )}>
              {alerta}
            </div>
          ))}
        </div>
      )}

      {/* KPIs Row 1 */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* PRAZO DE VENDAS */}
        <div className={cn('p-4 rounded-xl border-2',
          prazoVendas > 20 ? 'bg-destructive/15 border-destructive/50' : prazoVendas > 12 ? 'bg-warning/15 border-warning/50' : 'bg-success/10 border-success/30'
        )}>
          <div className="flex items-center justify-between mb-2">
            <Clock className={cn('h-5 w-5', prazoVendas > 20 ? 'text-destructive' : prazoVendas > 12 ? 'text-warning' : 'text-success')} />
            <span className="text-xs text-muted-foreground">PRAZO</span>
          </div>
          <p className={cn('text-3xl font-bold', prazoVendas > 20 ? 'text-destructive' : prazoVendas > 12 ? 'text-warning' : 'text-success')}>{prazoVendas}d</p>
          <p className="text-xs text-muted-foreground mt-1">Prazo de Vendas</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Gargalo: {gargaloNome}</p>
        </div>

        {/* PEDIDOS */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-civ/20 to-civ/5 border border-civ/30">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="h-5 w-5 text-civ" />
            <span className="text-xs text-muted-foreground">CIV</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{kpis.totalPedidos}</p>
          <p className="text-xs text-muted-foreground mt-1">Pedidos Ativos</p>
          <p className="text-xs text-civ mt-1">{kpis.pedidosAguardando} aguardando</p>
        </div>

        {/* EM PRODUÇÃO */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-cip/20 to-cip/5 border border-cip/30">
          <div className="flex items-center justify-between mb-2">
            <Factory className="h-5 w-5 text-cip" />
            <span className="text-xs text-muted-foreground">CIP</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{kpis.pedidosEmProducao}</p>
          <p className="text-xs text-muted-foreground mt-1">Em Produção</p>
          <p className="text-xs text-cip mt-1">{kpis.totalOPs} OPs | {kpis.opsEmProducao} ativas</p>
        </div>

        {/* CARTEIRA */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-success/20 to-success/5 border border-success/30">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="h-5 w-5 text-success" />
            <span className="text-xs text-muted-foreground">CARTEIRA</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{fmt(kpis.valorCarteiraTotal)}</p>
          <p className="text-xs text-muted-foreground mt-1">Valor em Aberto</p>
          <p className="text-xs text-success mt-1">{kpis.pedidosFinalizados} finalizados</p>
        </div>

        {/* CAPACIDADE */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-warning/20 to-warning/5 border border-warning/30">
          <div className="flex items-center justify-between mb-2">
            <Activity className="h-5 w-5 text-warning" />
            <span className="text-xs text-muted-foreground">CAPAC.</span>
          </div>
          <p className={cn('text-3xl font-bold', cargaPercentual > 100 ? 'text-destructive' : cargaPercentual > 80 ? 'text-warning' : 'text-success')}>
            {cargaPercentual}%
          </p>
          <p className="text-xs text-muted-foreground mt-1">Utilizada</p>
          <div className="w-full h-1.5 rounded-full bg-secondary mt-2 overflow-hidden">
            <div className={cn('h-full rounded-full transition-all', cargaPercentual > 100 ? 'bg-destructive' : cargaPercentual > 80 ? 'bg-warning' : 'bg-success')}
              style={{ width: `${Math.min(cargaPercentual, 100)}%` }} />
          </div>
        </div>

        {/* ESTOQUE */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-cic/20 to-cic/5 border border-cic/30">
          <div className="flex items-center justify-between mb-2">
            <Warehouse className="h-5 w-5 text-cic" />
            <span className="text-xs text-muted-foreground">CIC</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{fmt(kpis.valorEstoque)}</p>
          <p className="text-xs text-muted-foreground mt-1">Estoque Total</p>
          <p className={cn('text-xs mt-1', kpis.materiaisCriticos.length > 0 ? 'text-destructive' : 'text-success')}>
            {kpis.materiaisCriticos.length} crítico(s)
          </p>
        </div>

        {/* FINANCEIRO */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-cif/20 to-cif/5 border border-cif/30">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="h-5 w-5 text-cif" />
            <span className="text-xs text-muted-foreground">CIF</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{fmt(kpis.cifData?.faturamento || 0)}</p>
          <p className="text-xs text-muted-foreground mt-1">Faturamento</p>
          <p className={cn('text-xs mt-1', (kpis.cifData?.ebitda || 0) > 0 ? 'text-success' : 'text-destructive')}>
            EBITDA: {fmt(kpis.cifData?.ebitda || 0)}
          </p>
        </div>
      </div>

      {/* === VENDAS === */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vendas Mensal */}
        <ModuleCard title="📊 Vendas — Mensal (R$)" variant="civ">
          <div className="h-64">
            {kpis.vendasMensal.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={kpis.vendasMensal.map(v => ({ ...v, label: mesLabel(v.mes) }))}>
                  <defs>
                    <linearGradient id="gradVendas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.verde} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={CHART_COLORS.verde} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 18%, 22%)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`R$ ${v.toLocaleString('pt-BR')}`, 'Valor']} />
                  <Area type="monotone" dataKey="valor" stroke={CHART_COLORS.verde} fill="url(#gradVendas)" strokeWidth={2.5} name="Vendas" />
                </AreaChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </div>
        </ModuleCard>

        {/* Vendas Diário */}
        <ModuleCard title="📈 Vendas — Diário (R$)" variant="civ">
          <div className="h-64">
            {kpis.vendasDiario.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={kpis.vendasDiario.map(v => ({ ...v, label: diaLabel(v.dia) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 18%, 22%)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 10 }} />
                  <YAxis tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`R$ ${v.toLocaleString('pt-BR')}`, 'Valor']} />
                  <Bar dataKey="valor" fill={CHART_COLORS.verde} radius={[4, 4, 0, 0]} name="Vendas" />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </div>
        </ModuleCard>
      </div>

      {/* === PRODUÇÃO === */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Produção Mensal */}
        <ModuleCard title="🏭 Produção — Mensal (Qtd)" variant="cip">
          <div className="h-64">
            {kpis.producaoMensal.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={kpis.producaoMensal.map(v => ({ ...v, label: mesLabel(v.mes) }))}>
                  <defs>
                    <linearGradient id="gradProducao" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.laranja} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={CHART_COLORS.laranja} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 18%, 22%)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="qtd" stroke={CHART_COLORS.laranja} fill="url(#gradProducao)" strokeWidth={2.5} name="Produzido" />
                </AreaChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </div>
        </ModuleCard>

        {/* Produção Diária */}
        <ModuleCard title="⚡ Produção — Diária (Qtd)" variant="cip">
          <div className="h-64">
            {kpis.producaoDiario.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={kpis.producaoDiario.map(v => ({ ...v, label: diaLabel(v.dia) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 18%, 22%)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 10 }} />
                  <YAxis tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="qtd" fill={CHART_COLORS.laranja} radius={[4, 4, 0, 0]} name="Produzido" />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </div>
        </ModuleCard>
      </div>

      {/* === ANÁLISE === */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Comparativo Vendido vs Produzido */}
        <ModuleCard title="🔄 Vendido vs Produzido (Mensal)" variant="cig">
          <div className="h-64">
            {kpis.comparativoMensal.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={kpis.comparativoMensal.map(v => ({ ...v, label: mesLabel(v.mes) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 18%, 22%)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                  <Bar dataKey="vendido" fill={CHART_COLORS.verde} radius={[4, 4, 0, 0]} name="Vendido" />
                  <Bar dataKey="produzido" fill={CHART_COLORS.laranja} radius={[4, 4, 0, 0]} name="Produzido" />
                  <Line type="monotone" dataKey="vendido" stroke={CHART_COLORS.verde} strokeWidth={2} dot={false} name="Tendência Vendas" />
                </ComposedChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </div>
        </ModuleCard>

        {/* Carga por Setor */}
        <ModuleCard title="⚙️ Carga por Setor (horas)" variant="cip">
          <div className="h-64">
            {kpis.setoresProducao.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={kpis.setoresProducao} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 18%, 22%)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 11 }} />
                  <YAxis type="category" dataKey="nome" tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 9 }} width={110} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v.toFixed(1)}h`, '']} />
                  <Legend />
                  <Bar dataKey="carga" fill={CHART_COLORS.laranja} radius={[0, 4, 4, 0]} name="Carga" />
                  <Bar dataKey="capacidade" fill={CHART_COLORS.azulClaro} radius={[0, 4, 4, 0]} name="Capacidade" opacity={0.35} />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </div>
        </ModuleCard>
      </div>

      {/* Financeiro Row */}
      {kpis.cifData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-card border border-border/30">
              <p className="text-xs text-muted-foreground">Ponto de Equilíbrio</p>
              <p className="text-xl font-bold text-foreground">{fmt(kpis.cifData.pontoEquilibrio)}</p>
              <p className={cn('text-xs mt-1', kpis.cifData.faturamento > kpis.cifData.pontoEquilibrio ? 'text-success' : 'text-destructive')}>
                {kpis.cifData.faturamento > kpis.cifData.pontoEquilibrio ? '🟢 ACIMA' : '🔴 ABAIXO'}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-card border border-border/30">
              <p className="text-xs text-muted-foreground">Margem Líquida</p>
              {(() => { const ml = kpis.cifData!.receita > 0 ? (kpis.cifData!.ebitda / kpis.cifData!.receita) * 100 : 0; return (<><p className="text-xl font-bold text-foreground">{ml.toFixed(1)}%</p><p className={cn('text-xs mt-1', ml >= 15 ? 'text-success' : 'text-warning')}>{ml >= 15 ? 'Meta atingida' : 'Abaixo da meta (15%)'}</p></>); })()}
            </div>
            <div className="p-4 rounded-xl bg-card border border-border/30">
              <p className="text-xs text-muted-foreground">Proposta Compras</p>
              <p className="text-xl font-bold text-foreground">{fmt(kpis.totalPropostaCompra)}</p>
              <p className="text-xs text-cic mt-1">{kpis.materiaisCriticos.length} crítico(s)</p>
            </div>
            <div className="p-4 rounded-xl bg-card border border-border/30">
              <p className="text-xs text-muted-foreground">Pedidos Atrasados</p>
              <p className={cn('text-xl font-bold', kpis.pedidosAtrasados > 5 ? 'text-destructive' : kpis.pedidosAtrasados > 0 ? 'text-warning' : 'text-success')}>
                {kpis.pedidosAtrasados}
              </p>
              <p className="text-xs text-muted-foreground mt-1">sem finalizar</p>
            </div>
          </div>

          {kpis.cifData.receitaMensal.some(r => r.receita > 0) ? (
            <ModuleCard title="💰 Receita × Ponto de Equilíbrio" variant="cif">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={kpis.cifData.receitaMensal.map(r => ({ mes: r.mes, faturamento: r.receita, equilibrio: kpis.cifData!.pontoEquilibrio }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 18%, 22%)" vertical={false} />
                    <XAxis dataKey="mes" tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 11 }} />
                    <YAxis tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`R$ ${v.toLocaleString('pt-BR')}`, '']} />
                    <Legend />
                    <Bar dataKey="faturamento" fill={CHART_COLORS.verde} name="Faturamento" radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="equilibrio" stroke={CHART_COLORS.vermelho} strokeWidth={2} strokeDasharray="5 5" name="Ponto Equilíbrio" dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </ModuleCard>
          ) : (
            <ModuleCard title="💰 Resultado Financeiro" variant="cif">
              <EmptyChart />
            </ModuleCard>
          )}
        </div>
      )}

      {/* Materiais Críticos */}
      {kpis.materiaisCriticos.length > 0 && (
        <ModuleCard title="⚠ Materiais em Nível Crítico" variant="cic">
          <div className="overflow-x-auto max-h-[250px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border/50 bg-secondary/30 sticky top-0">
                <th className="text-left py-2 px-3 text-xs text-muted-foreground">Material</th>
                <th className="text-center py-2 px-3 text-xs text-muted-foreground">Estoque</th>
                <th className="text-center py-2 px-3 text-xs text-muted-foreground">Alcance</th>
                <th className="text-center py-2 px-3 text-xs text-muted-foreground">Pto Pedido</th>
                <th className="text-right py-2 px-3 text-xs text-muted-foreground">Proposta</th>
              </tr></thead>
              <tbody>
                {kpis.materiaisCriticos.slice(0, 8).map(m => (
                  <tr key={m.id} className="border-b border-border/30 bg-destructive/5">
                    <td className="py-2 px-3 font-medium text-foreground text-xs">{m.nome}</td>
                    <td className="py-2 px-3 text-center text-xs">{m.estoque_atual} {m.unidade}</td>
                    <td className="py-2 px-3 text-center text-xs text-destructive font-bold">{(m.alcance_estoque || 0).toFixed(1)}d</td>
                    <td className="py-2 px-3 text-center text-xs text-muted-foreground">{m.ponto_pedido}</td>
                    <td className="py-2 px-3 text-right text-xs text-warning font-bold">{(m.proposta_compra || 0) > 0 ? `${m.proposta_compra} ${m.unidade}` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ModuleCard>
      )}

      {usandoExemplo && (
        <div className="text-center py-4 border-t border-border/30">
          <p className="text-xs text-muted-foreground">
            📋 Os gráficos de vendas e produção exibem <span className="text-warning font-medium">dados de exemplo</span> para demonstração.
            Cadastre pedidos e OPs para visualizar dados reais.
          </p>
        </div>
      )}
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
      Sem dados cadastrados
    </div>
  );
}
