import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, ComposedChart, Line, Legend,
} from 'recharts';
import { ModuleCard } from '@/components/ui/ModuleCard';
import {
  LayoutDashboard, TrendingUp, Factory, DollarSign, Clock,
  AlertTriangle, Activity, RefreshCw, ShoppingCart, Warehouse, Package,
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
}

interface DashboardCIGMelhoradoProps {
  onGoHome?: () => void;
}

export function DashboardCIGMelhorado({ onGoHome }: DashboardCIGMelhoradoProps) {
  const [kpis, setKpis] = useState<KPIData>({
    totalPedidos: 0, pedidosEmProducao: 0, pedidosAguardando: 0, pedidosFinalizados: 0,
    valorCarteiraTotal: 0, horasCarteira: 0, totalOPs: 0, opsEmProducao: 0,
    totalSetores: 0, capacidadeDiaria: 8,
    pedidosPorStatus: [], pedidosPorCanal: [], setoresProducao: [], alertas: [],
    materiaisCriticos: [], valorEstoque: 0, totalPropostaCompra: 0, cifData: null,
  });
  const [capacidade, setCapacidade] = useState<CapacidadeFabrica | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    loadData();
    // Realtime: reload when key tables change
    const channel = supabase
      .channel('cig-dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ops' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'setores_produtivos' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'materiais' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'op_route_steps' }, () => loadData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pedidosRes, opsRes, carteiraRes, setoresRes, configRes, materiais, cifData, routeStepsRes, capFabrica] = await Promise.all([
        supabase.from('pedidos').select('id, status, status_producao, valor_total, canal').order('created_at', { ascending: false }),
        supabase.from('ops').select('id, status_producao, current_sector, tempo_total').neq('status_producao', 'cancelado'),
        supabase.from('carteira_producao').select('total_horas_acumuladas').limit(1).maybeSingle(),
        supabase.from('setores_produtivos').select('*').eq('ativo', true).order('ordem'),
        supabase.from('configuracoes_capacidade').select('capacidade_produtiva_diaria').limit(1).maybeSingle(),
        fetchMateriais(),
        fetchCIFData(),
        supabase.from('op_route_steps').select('op_id, setor_id, tempo_estimado'),
        calcularCapacidadeFabrica(),
      ]);

      const pedidos = pedidosRes.data || [];
      const ops = opsRes.data || [];
      // Use bottleneck capacity for hours
      const horasCarteira = capFabrica.horasNecessarias;
      const setores = setoresRes.data || [];
      const capacidadeDiaria = capFabrica.capacidadeDiaria > 0 ? capFabrica.capacidadeDiaria : (configRes.data ? Number(configRes.data.capacidade_produtiva_diaria) : 8);
      const routeSteps = routeStepsRes.data || [];
      setCapacidade(capFabrica);

      const statusMap: Record<string, number> = {};
      pedidos.forEach(p => { statusMap[p.status] = (statusMap[p.status] || 0) + 1; });
      const statusLabels: Record<string, string> = {
        aguardando: 'Aguardando', programado: 'Programado', em_producao: 'Em Produção',
        finalizado: 'Finalizado', cancelado: 'Cancelado', aprovado: 'Aprovado',
      };
      const pedidosPorStatus = Object.entries(statusMap)
        .filter(([s]) => s !== 'cancelado')
        .map(([status, count]) => ({ status: statusLabels[status] || status, count }));

      const canalMap: Record<string, number> = {};
      pedidos.filter(p => p.status !== 'cancelado').forEach(p => {
        const canal = p.canal || 'Outros';
        canalMap[canal] = (canalMap[canal] || 0) + Number(p.valor_total || 0);
      });
      const pedidosPorCanal = Object.entries(canalMap)
        .map(([canal, valor]) => ({ canal, valor }))
        .sort((a, b) => b.valor - a.valor);

      // Calculate per-sector load from route steps of active (non-finalized) OPs
      const activeOpIds = new Set(ops.filter(o => o.status_producao !== 'Producao Finalizada').map(o => o.id));
      const setorCargaMap: Record<string, number> = {};
      (routeSteps as any[]).forEach((step: any) => {
        if (activeOpIds.has(step.op_id)) {
          setorCargaMap[step.setor_id] = (setorCargaMap[step.setor_id] || 0) + Number(step.tempo_estimado || 0);
        }
      });

      const setoresProducaoData = setores.map((s: any) => {
        const cap = (s.mao_de_obra + s.maquinas_automaticas) * s.horas_turno * s.eficiencia;
        return {
          nome: s.nome.replace(' / ', '/').substring(0, 16),
          opsAtivas: 0,
          capacidade: cap,
          carga: setorCargaMap[s.id] || 0,
        };
      });

      // OPs por setor (current_sector)
      ops.forEach(op => {
        if (op.current_sector) {
          const found = setoresProducaoData.find(s => op.current_sector?.includes(s.nome.substring(0, 8)));
          if (found) found.opsAtivas++;
        }
      });

      const materiaisCriticos = materiais.filter(m => m.status === 'critico');
      const valorEstoque = materiais.reduce((s, m) => s + (m.valor_estoque || 0), 0);
      const totalPropostaCompra = materiais.reduce((s, m) => s + (m.proposta_compra || 0) * m.valor_unitario, 0);

      // Alertas inteligentes
      const alertas: string[] = [];
      const pedidosAtivos = pedidos.filter(p => p.status !== 'cancelado' && p.status !== 'finalizado');
      const diasCarteira = capacidadeDiaria > 0 ? Math.ceil(horasCarteira / capacidadeDiaria) : 0;

      if (diasCarteira > 15) alertas.push(`🔴 Sobrecarga: ${diasCarteira} dias de carteira (>15 dias)`);
      else if (diasCarteira > 10) alertas.push(`🟡 Carga alta: ${diasCarteira} dias de carteira`);

      const aguardando = pedidos.filter(p => p.status === 'aguardando').length;
      if (aguardando > 3) alertas.push(`🔴 ${aguardando} pedidos aguardando programação`);
      else if (aguardando > 0) alertas.push(`🟡 ${aguardando} pedido(s) aguardando programação`);

      if (materiaisCriticos.length > 3) alertas.push(`🔴 ${materiaisCriticos.length} materiais em nível CRÍTICO`);
      else if (materiaisCriticos.length > 0) alertas.push(`🟡 ${materiaisCriticos.length} material(is) em nível crítico`);

      // Sector overload
      const overloaded = setoresProducaoData.filter(s => s.capacidade > 0 && (s.carga / s.capacidade) > 0.9);
      if (overloaded.length > 0) alertas.push(`🟡 ${overloaded.length} setor(es) com carga >90%`);

      if (cifData.margemLiquida < 0) alertas.push(`🔴 EBITDA negativo: margem ${cifData.margemLiquida.toFixed(1)}%`);
      else if (cifData.margemLiquida < 15) alertas.push(`🟡 Margem abaixo de 15%: ${cifData.margemLiquida.toFixed(1)}%`);

      if (alertas.length === 0) alertas.push('✅ Operação normal — sem alertas críticos');

      setKpis({
        totalPedidos: pedidos.filter(p => p.status !== 'cancelado').length,
        pedidosEmProducao: pedidos.filter(p => p.status === 'programado' || p.status === 'em_producao').length,
        pedidosAguardando: aguardando,
        pedidosFinalizados: pedidos.filter(p => p.status === 'finalizado').length,
        valorCarteiraTotal: pedidosAtivos.reduce((s, p) => s + Number(p.valor_total || 0), 0),
        horasCarteira, totalOPs: ops.length,
        opsEmProducao: ops.filter(o => o.status_producao !== 'Producao Finalizada' && o.status_producao !== 'aguardando').length,
        totalSetores: setores.length, capacidadeDiaria,
        pedidosPorStatus, pedidosPorCanal, setoresProducao: setoresProducaoData,
        alertas, materiaisCriticos, valorEstoque, totalPropostaCompra, cifData,
      });
      setLastUpdate(new Date());
    } catch (e) {
      console.error('[CIG] Erro ao carregar dados:', e);
    }
    setLoading(false);
  };

  const temDados = kpis.totalPedidos > 0;
  const diasCarteira = capacidade ? capacidade.diasNecessarios : 0;
  const cargaPercentual = capacidade ? capacidade.percentualOcupacao : 0;
  const prazoVendas = capacidade?.prazoVendasDias ?? 0;
  const gargaloNome = capacidade?.setorGargaloDias ?? 'N/A';
  const fmt = (v: number) => v >= 1000000 ? `R$ ${(v / 1000000).toFixed(2)}M` : v >= 1000 ? `R$ ${(v / 1000).toFixed(0)}k` : `R$ ${v.toFixed(0)}`;

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
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-success/10 border border-success/30">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-sm text-success font-medium">Dados Reais</span>
          </div>
        </div>
      </div>

      {!temDados && !loading && (
        <div className="p-6 rounded-xl border-2 border-warning/30 bg-warning/10 text-center">
          <AlertTriangle className="h-8 w-8 text-warning mx-auto mb-2" />
          <p className="font-medium text-foreground">Sem dados cadastrados – insira dados para iniciar o monitoramento.</p>
        </div>
      )}

      {/* Alerta Pulsante – Materiais Críticos */}
      {kpis.materiaisCriticos.length > 0 && (
        <div className="p-4 rounded-xl border-2 border-destructive/50 bg-destructive/10 animate-pulse flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-destructive flex-shrink-0" />
          <div>
            <p className="font-bold text-destructive text-sm">⚠️ AGUARDANDO COMPRAS — {kpis.materiaisCriticos.length} material(is) em nível crítico</p>
            <p className="text-xs text-destructive/80 mt-0.5">
              {kpis.materiaisCriticos.slice(0, 5).map(m => m.nome).join(', ')}
              {kpis.materiaisCriticos.length > 5 && ` e mais ${kpis.materiaisCriticos.length - 5}...`}
            </p>
          </div>
        </div>
      )}

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

      {/* KPIs Row 1 - Vendas & Produção */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-xl bg-gradient-to-br from-civ/20 to-civ/5 border border-civ/30">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="h-5 w-5 text-civ" />
            <span className="text-xs text-muted-foreground">CIV</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{kpis.totalPedidos}</p>
          <p className="text-xs text-muted-foreground mt-1">Pedidos Ativos</p>
          <p className="text-xs text-civ mt-1">{kpis.pedidosAguardando} aguardando</p>
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-br from-cip/20 to-cip/5 border border-cip/30">
          <div className="flex items-center justify-between mb-2">
            <Factory className="h-5 w-5 text-cip" />
            <span className="text-xs text-muted-foreground">CIP</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{kpis.pedidosEmProducao}</p>
          <p className="text-xs text-muted-foreground mt-1">Em Produção</p>
          <p className="text-xs text-cip mt-1">{kpis.totalOPs} OPs | {kpis.opsEmProducao} ativas</p>
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-br from-success/20 to-success/5 border border-success/30">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="h-5 w-5 text-success" />
            <span className="text-xs text-muted-foreground">CARTEIRA</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{fmt(kpis.valorCarteiraTotal)}</p>
          <p className="text-xs text-muted-foreground mt-1">Valor em Aberto</p>
          <p className="text-xs text-success mt-1">{kpis.pedidosFinalizados} finalizados</p>
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-br from-warning/20 to-warning/5 border border-warning/30">
          <div className="flex items-center justify-between mb-2">
            <Clock className="h-5 w-5 text-warning" />
            <span className="text-xs text-muted-foreground">HORAS</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{kpis.horasCarteira.toFixed(0)}h</p>
          <p className="text-xs text-muted-foreground mt-1">Horas Necessárias</p>
          <p className="text-xs text-warning mt-1">≈ {diasCarteira} dias | Cap: {capacidade?.capacidadeFabrica.toFixed(0) || 0}h</p>
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-br from-cic/20 to-cic/5 border border-cic/30">
          <div className="flex items-center justify-between mb-2">
            <Warehouse className="h-5 w-5 text-cic" />
            <span className="text-xs text-muted-foreground">CIC</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{fmt(kpis.valorEstoque)}</p>
          <p className="text-xs text-muted-foreground mt-1">Estoque Total</p>
          <p className={cn('text-xs mt-1', kpis.materiaisCriticos.length > 0 ? 'text-destructive' : 'text-success')}>
            {kpis.materiaisCriticos.length} material(is) crítico(s)
          </p>
        </div>

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

      {/* KPIs Row 2 - Financeiro */}
      {kpis.cifData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-card border border-border/30">
            <p className="text-xs text-muted-foreground">Ponto de Equilíbrio</p>
            <p className="text-xl font-bold text-foreground">{fmt(kpis.cifData.pontoEquilibrio)}</p>
            <p className={cn('text-xs mt-1', kpis.cifData.faturamento > kpis.cifData.pontoEquilibrio ? 'text-success' : 'text-destructive')}>
              {kpis.cifData.faturamento > kpis.cifData.pontoEquilibrio ? '🟢 ACIMA' : '🔴 ABAIXO'}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-card border border-border/30">
            <p className="text-xs text-muted-foreground">Margem Líquida</p>
            <p className="text-xl font-bold text-foreground">{kpis.cifData.margemLiquida.toFixed(1)}%</p>
            <p className={cn('text-xs mt-1', kpis.cifData.margemLiquida >= 15 ? 'text-success' : 'text-warning')}>
              {kpis.cifData.margemLiquida >= 15 ? 'Meta atingida' : 'Abaixo da meta (15%)'}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-card border border-border/30">
            <p className="text-xs text-muted-foreground">Capacidade × Carga</p>
            <p className={cn('text-xl font-bold', cargaPercentual > 100 ? 'text-destructive' : cargaPercentual > 80 ? 'text-warning' : 'text-success')}>
              {cargaPercentual}%
            </p>
            <div className="w-full h-2 rounded-full bg-secondary mt-2 overflow-hidden">
              <div className={cn('h-full rounded-full', cargaPercentual > 100 ? 'bg-destructive' : cargaPercentual > 80 ? 'bg-warning' : 'bg-success')}
                style={{ width: `${Math.min(cargaPercentual, 100)}%` }} />
            </div>
          </div>
          <div className="p-3 rounded-xl bg-card border border-border/30">
            <p className="text-xs text-muted-foreground">Proposta Compras</p>
            <p className="text-xl font-bold text-foreground">{fmt(kpis.totalPropostaCompra)}</p>
            <p className="text-xs text-cic mt-1">{kpis.materiaisCriticos.length} material(is) crítico(s)</p>
          </div>
        </div>
      )}

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ModuleCard title="Pedidos por Status" variant="civ">
          <div className="h-64">
            {kpis.pedidosPorStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={kpis.pedidosPorStatus}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="status" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Bar dataKey="count" fill={CHART_COLORS.verde} radius={[4, 4, 0, 0]} name="Pedidos" />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Sem dados</div>}
          </div>
        </ModuleCard>

        <ModuleCard title="Valor por Canal de Venda" variant="civ">
          <div className="h-64">
            {kpis.pedidosPorCanal.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={kpis.pedidosPorCanal}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="canal" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Valor']} />
                  <Bar dataKey="valor" fill={CHART_COLORS.azulMarinho} radius={[4, 4, 0, 0]} name="Valor" />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Sem dados</div>}
          </div>
        </ModuleCard>
      </div>

      {/* Charts Row 2 - Produção & Financeiro */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ModuleCard title="Carga por Setor (horas)" variant="cip">
          <div className="h-64">
            {kpis.setoresProducao.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={kpis.setoresProducao} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <YAxis type="category" dataKey="nome" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }} width={110} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(value: number) => [`${value.toFixed(1)}h`, '']} />
                  <Legend />
                  <Bar dataKey="carga" fill={CHART_COLORS.laranja} radius={[0, 4, 4, 0]} name="Carga Programada" />
                  <Bar dataKey="capacidade" fill={CHART_COLORS.azulClaro} radius={[0, 4, 4, 0]} name="Capacidade" opacity={0.4} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Sem dados</div>}
          </div>
        </ModuleCard>

        {kpis.cifData && kpis.cifData.receitaMensal.some(r => r.receita > 0) ? (
          <ModuleCard title="Receita × Ponto de Equilíbrio" variant="cif">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={kpis.cifData.receitaMensal.map(r => ({ mes: r.mes, faturamento: r.receita, equilibrio: kpis.cifData!.pontoEquilibrio }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, '']} />
                  <Legend />
                  <Bar dataKey="faturamento" fill={CHART_COLORS.verde} name="Faturamento" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="equilibrio" stroke={CHART_COLORS.vermelho} strokeWidth={2} strokeDasharray="5 5" name="Ponto Equilíbrio" dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </ModuleCard>
        ) : (
          <ModuleCard title="Resultado Financeiro" variant="cif">
            <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
              Sem dados cadastrados – insira dados para iniciar o monitoramento.
            </div>
          </ModuleCard>
        )}
      </div>

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
    </div>
  );
}
