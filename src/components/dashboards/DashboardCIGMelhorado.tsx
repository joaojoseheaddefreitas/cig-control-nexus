import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ComposedChart, Line, Legend, AreaChart, Area,
} from 'recharts';
import { ModuleCard } from '@/components/ui/ModuleCard';
import {
  LayoutDashboard, TrendingUp, Factory, DollarSign, Clock,
  AlertTriangle, Activity, RefreshCw, Warehouse, Inbox,
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

interface DiaSerie { dia: string; label: string; valor: number; qtd?: number; horas?: number; }
interface MesRef { ano: number; mes: number; rotulo: string; ehAtual: boolean; }

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
  pedidosPorCanal: { canal: string; valor: number }[];
  alertas: string[];
  materiaisCriticos: Material[];
  valorEstoque: number;
  totalPropostaCompra: number;
  cifData: CIFDashboardData | null;
  mesRef: MesRef | null;
  vendasMesRef: DiaSerie[];
  producaoMesRef: DiaSerie[];
  comprasMesRef: DiaSerie[];
  comparativoAnual: { mes: string; vendido: number; produzido: number }[];
  pedidosAtrasados: number;
  derivadoFinanceiroDiario: { dia: string; label: string; faturamento: number; custo: number; lucro: number; lucroAcumulado: number; margem: number }[];
  custoPorHoraReal: number;
  custoFixoMensal: number;
  horasProduzidasMes: number;
  custoEstimado: boolean;
}

interface DashboardCIGMelhoradoProps {
  onGoHome?: () => void;
}

const MESES_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const mesKey = (d: string) => `${d.slice(0, 4)}-${d.slice(5, 7)}`;
const diaKey = (d: string) => d.slice(0, 10);

function diasUteisDoMes(ano: number, mes: number): { dia: string; label: string }[] {
  const ultimo = new Date(ano, mes + 1, 0).getDate();
  const out: { dia: string; label: string }[] = [];
  for (let d = 1; d <= ultimo; d++) {
    const dt = new Date(ano, mes, d);
    const dow = dt.getDay();
    if (dow === 0 || dow === 6) continue;
    out.push({
      dia: `${ano}-${String(mes + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      label: String(d).padStart(2, '0'),
    });
  }
  return out;
}

export function DashboardCIGMelhorado({ onGoHome }: DashboardCIGMelhoradoProps) {
  const [kpis, setKpis] = useState<KPIData>({
    totalPedidos: 0, pedidosEmProducao: 0, pedidosAguardando: 0, pedidosFinalizados: 0,
    valorCarteiraTotal: 0, horasCarteira: 0, totalOPs: 0, opsEmProducao: 0,
    totalSetores: 0, capacidadeDiaria: 8,
    pedidosPorCanal: [], alertas: [],
    materiaisCriticos: [], valorEstoque: 0, totalPropostaCompra: 0, cifData: null,
    mesRef: null,
    vendasMesRef: [], producaoMesRef: [], comprasMesRef: [],
    comparativoAnual: [], pedidosAtrasados: 0,
    derivadoFinanceiroDiario: [], custoPorHoraReal: 0, custoFixoMensal: 0, horasProduzidasMes: 0,
    custoEstimado: false,
  });
  const [capacidade, setCapacidade] = useState<CapacidadeFabrica | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    loadData();
    const channel = supabase
      .channel('cig-dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ops' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'setores_produtivos' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'materiais' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'op_route_steps' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transacoes' }, () => loadData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pedidosRes, opsRes, setoresRes, configRes, materiais, cifData, transRes, capFabrica, custosFixosRes] = await Promise.all([
        supabase.from('pedidos').select('id, status, status_producao, valor_total, canal, data_entrada, quantidade').order('created_at', { ascending: false }),
        supabase.from('ops').select('id, status_producao, current_sector, tempo_total, created_at, quantidade, data_programada').neq('status_producao', 'cancelado'),
        supabase.from('setores_produtivos').select('*').eq('ativo', true).order('ordem'),
        supabase.from('configuracoes_capacidade').select('capacidade_produtiva_diaria').limit(1).maybeSingle(),
        fetchMateriais(),
        fetchCIFData(),
        supabase.from('transacoes').select('tipo, categoria, valor, data_emissao'),
        calcularCapacidadeFabrica(),
        supabase.from('custos_fixos').select('valor_mensal, ativo').eq('ativo', true),
      ]);

      const pedidos = (pedidosRes.data || []) as PedidoRow[];
      const ops = (opsRes.data || []) as OPRow[];
      const setores = setoresRes.data || [];
      const transacoes = (transRes.data || []) as { tipo: string; categoria: string; valor: number; data_emissao: string }[];
      const horasCarteira = capFabrica.horasNecessarias;
      const capacidadeDiaria = capFabrica.capacidadeDiaria > 0 ? capFabrica.capacidadeDiaria : (configRes.data ? Number(configRes.data.capacidade_produtiva_diaria) : 8);
      setCapacidade(capFabrica);

      const pedidosAtivos = pedidos.filter(p => p.status !== 'cancelado');

      // === MÊS DE REFERÊNCIA: atual; fallback = último mês com qualquer dado ===
      const now = new Date();
      const mesAtualKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      // Coleta todos os meses com dados (vendas / produção / compras)
      const mesesComDados = new Set<string>();
      pedidosAtivos.forEach(p => p.data_entrada && mesesComDados.add(mesKey(p.data_entrada)));
      ops.forEach(o => { if (o.data_programada) mesesComDados.add(mesKey(o.data_programada)); });
      transacoes.forEach(t => t.data_emissao && mesesComDados.add(mesKey(t.data_emissao)));

      let mesRef: MesRef | null = null;
      if (mesesComDados.has(mesAtualKey)) {
        mesRef = { ano: now.getFullYear(), mes: now.getMonth(), rotulo: `${MESES_PT[now.getMonth()]}/${now.getFullYear()}`, ehAtual: true };
      } else if (mesesComDados.size > 0) {
        const ultimo = [...mesesComDados].sort().reverse()[0];
        const [y, m] = ultimo.split('-').map(Number);
        mesRef = { ano: y, mes: m - 1, rotulo: `${MESES_PT[m - 1]}/${y}`, ehAtual: false };
      }

      // Canal breakdown (geral, base toda — não filtra mês)
      const canalMap: Record<string, number> = {};
      pedidosAtivos.forEach(p => {
        const canal = p.canal || 'Outros';
        canalMap[canal] = (canalMap[canal] || 0) + Number(p.valor_total || 0);
      });
      const pedidosPorCanal = Object.entries(canalMap).map(([canal, valor]) => ({ canal, valor })).sort((a, b) => b.valor - a.valor);

      const materiaisCriticos = materiais.filter(m => m.status === 'critico');
      const valorEstoque = materiais.reduce((s, m) => s + (m.valor_estoque || 0), 0);
      const totalPropostaCompra = materiais.reduce((s, m) => s + (m.proposta_compra || 0) * m.valor_unitario, 0);

      // === SÉRIES DIÁRIAS DO MÊS DE REFERÊNCIA ===
      let vendasMesRef: DiaSerie[] = [];
      let producaoMesRef: DiaSerie[] = [];
      let comprasMesRef: DiaSerie[] = [];

      if (mesRef) {
        const dias = diasUteisDoMes(mesRef.ano, mesRef.mes);

        const vendasDiaMap: Record<string, { valor: number; qtd: number }> = {};
        pedidosAtivos.forEach(p => {
          if (!p.data_entrada) return;
          const k = diaKey(p.data_entrada);
          const dt = new Date(p.data_entrada);
          if (dt.getFullYear() === mesRef!.ano && dt.getMonth() === mesRef!.mes) {
            if (!vendasDiaMap[k]) vendasDiaMap[k] = { valor: 0, qtd: 0 };
            vendasDiaMap[k].valor += Number(p.valor_total || 0);
            vendasDiaMap[k].qtd += Number(p.quantidade || 0);
          }
        });
        vendasMesRef = dias.map(d => ({ ...d, valor: vendasDiaMap[d.dia]?.valor || 0, qtd: vendasDiaMap[d.dia]?.qtd || 0 }));

        const producaoDiaMap: Record<string, { qtd: number; horas: number }> = {};
        ops.forEach(op => {
          if (!op.data_programada) return;
          const dt = new Date(op.data_programada);
          if (dt.getFullYear() === mesRef!.ano && dt.getMonth() === mesRef!.mes) {
            const k = op.data_programada.slice(0, 10);
            if (!producaoDiaMap[k]) producaoDiaMap[k] = { qtd: 0, horas: 0 };
            producaoDiaMap[k].qtd += Number(op.quantidade || 1);
            producaoDiaMap[k].horas += Number(op.tempo_total || 0);
          }
        });
        // Valor da produção: usa ticket médio do mês (vendas/qtd) se houver, senão 0
        const totalQtdVendas = vendasMesRef.reduce((s, v) => s + (v.qtd || 0), 0);
        const totalValorVendas = vendasMesRef.reduce((s, v) => s + v.valor, 0);
        const ticketMedio = totalQtdVendas > 0 ? totalValorVendas / totalQtdVendas : 0;
        producaoMesRef = dias.map(d => {
          const r = producaoDiaMap[d.dia];
          return { ...d, qtd: r?.qtd || 0, horas: r?.horas || 0, valor: r ? r.qtd * ticketMedio : 0 };
        });

        const comprasDiaMap: Record<string, number> = {};
        transacoes.forEach(t => {
          if (t.tipo !== 'DESPESA' || t.categoria !== 'materiais') return;
          if (!t.data_emissao) return;
          const dt = new Date(t.data_emissao);
          if (dt.getFullYear() === mesRef!.ano && dt.getMonth() === mesRef!.mes) {
            const k = diaKey(t.data_emissao);
            comprasDiaMap[k] = (comprasDiaMap[k] || 0) + Number(t.valor || 0);
          }
        });
        comprasMesRef = dias.map(d => ({ ...d, valor: comprasDiaMap[d.dia] || 0 }));
      }

      // Comparativo anual (12 meses até mesRef)
      const baseAno = mesRef?.ano ?? now.getFullYear();
      const baseMes = mesRef?.mes ?? now.getMonth();
      const vendasMensalMap: Record<string, number> = {};
      pedidosAtivos.forEach(p => { if (p.data_entrada) { const k = mesKey(p.data_entrada); vendasMensalMap[k] = (vendasMensalMap[k] || 0) + Number(p.valor_total || 0); } });
      const horasMensalMap: Record<string, number> = {};
      ops.forEach(op => { if (op.status_producao === 'Producao Finalizada') { const k = mesKey(op.created_at); horasMensalMap[k] = (horasMensalMap[k] || 0) + Number(op.tempo_total || 0); } });
      const totalHoras = Object.values(horasMensalMap).reduce((a, b) => a + b, 0);
      const totalVendas = Object.values(vendasMensalMap).reduce((a, b) => a + b, 0);
      const valorPorHora = totalHoras > 0 ? totalVendas / totalHoras : 0;
      const comparativoAnual: { mes: string; vendido: number; produzido: number }[] = [];
      for (let i = 11; i >= 0; i--) {
        const dt = new Date(baseAno, baseMes - i, 1);
        const k = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
        comparativoAnual.push({ mes: k, vendido: vendasMensalMap[k] || 0, produzido: (horasMensalMap[k] || 0) * valorPorHora });
      }

      // Pedidos atrasados
      const hojeStr = new Date().toISOString().slice(0, 10);
      const { data: pedidosCompletos } = await supabase
        .from('pedidos')
        .select('id, status, prazo_entrega')
        .neq('status', 'cancelado')
        .neq('status', 'finalizado');
      const pedidosAtrasados = (pedidosCompletos || []).filter((p: any) => p.prazo_entrega && p.prazo_entrega < hojeStr).length;

      // === ALERTAS ===
      const alertas: string[] = [];
      const prazoVendasReal = capFabrica.prazoVendasDias;
      if (pedidosAtivos.length > 0 && prazoVendasReal > 25) alertas.push(`🔴 Sobrecarga crítica: ${prazoVendasReal}d de prazo (gargalo: ${capFabrica.setorGargaloDias})`);
      else if (pedidosAtivos.length > 0 && prazoVendasReal > 18) alertas.push(`🟡 Carga alta: ${prazoVendasReal}d de prazo (gargalo: ${capFabrica.setorGargaloDias})`);

      const aguardando = pedidos.filter(p => p.status === 'aguardando').length;
      if (aguardando > 10) alertas.push(`🔴 ${aguardando} pedidos aguardando programação`);
      else if (aguardando > 0) alertas.push(`🟡 ${aguardando} pedido(s) aguardando programação`);

      if (materiais.length > 0 && materiaisCriticos.length > 0) {
        if (materiaisCriticos.length > 3) alertas.push(`🔴 ${materiaisCriticos.length} materiais em nível CRÍTICO`);
        else alertas.push(`🟡 ${materiaisCriticos.length} material(is) em nível crítico`);
      }
      const setoresSobrecarga = (capFabrica.setores || []).filter((s: any) => s.carga_percent > 90);
      if (setoresSobrecarga.length > 0) {
        const nomes = setoresSobrecarga.slice(0, 2).map((s: any) => s.nome.split(' ')[0]).join(', ');
        alertas.push(`🟡 ${setoresSobrecarga.length} setor(es) com carga >90% (${nomes}${setoresSobrecarga.length > 2 ? '...' : ''})`);
      }
      if (pedidosAtrasados > 0) alertas.push(`🔴 ${pedidosAtrasados} pedido(s) com prazo vencido`);
      if (cifData && cifData.receita > 0) {
        const margemLiq = (cifData.ebitda / cifData.receita) * 100;
        if (margemLiq < 0) alertas.push(`🔴 EBITDA negativo: margem ${margemLiq.toFixed(1)}%`);
        else if (margemLiq < 15) alertas.push(`🟡 Margem abaixo de 15%: ${margemLiq.toFixed(1)}%`);
      }
      if (mesRef && !mesRef.ehAtual) alertas.unshift(`ℹ️ Mês atual sem dados — exibindo ${mesRef.rotulo} (último mês com dados)`);
      if (alertas.length === 0) alertas.push('✅ Operação normal — sem alertas críticos');

      // === DERIVAÇÃO FINANCEIRA ===
      const custoFixoMensal = (custosFixosRes.data || []).reduce((s, c: any) => s + Number(c.valor_mensal || 0), 0);
      const horasProduzidasMes = producaoMesRef.reduce((s, d) => s + (d.horas || 0), 0);
      const custoPorHoraReal = horasProduzidasMes > 0 ? custoFixoMensal / horasProduzidasMes : 0;
      const FATOR_CUSTO_ESTIMADO = 0.65;
      const usarCustoEstimado = custoPorHoraReal === 0;

      let acumLucro = 0;
      const derivadoFinanceiroDiario = vendasMesRef.map(v => {
        const horasDoDia = producaoMesRef.find(p => p.dia === v.dia)?.horas || 0;
        const custo = usarCustoEstimado
          ? Math.round(v.valor * FATOR_CUSTO_ESTIMADO)
          : Math.round(horasDoDia * custoPorHoraReal);
        const lucro = Math.round(v.valor - custo);
        acumLucro += lucro;
        const margem = v.valor > 0 ? (lucro / v.valor) * 100 : 0;
        return {
          dia: v.dia, label: v.label, faturamento: v.valor, custo, lucro,
          lucroAcumulado: acumLucro, margem: Number(margem.toFixed(1)),
        };
      });

      if (custoPorHoraReal > 0 && derivadoFinanceiroDiario.length > 0) {
        const totalLucro = derivadoFinanceiroDiario.reduce((s, d) => s + d.lucro, 0);
        const totalFat = derivadoFinanceiroDiario.reduce((s, d) => s + d.faturamento, 0);
        if (totalFat > 0 && totalLucro < 0) alertas.unshift(`🔴 Prejuízo derivado: produção × custo > vendas no mês`);
        else if (totalFat > 0 && totalLucro / totalFat < 0.10) alertas.unshift(`🟡 Margem derivada baixa: ${((totalLucro / totalFat) * 100).toFixed(1)}%`);
      }

      setKpis({
        totalPedidos: pedidosAtivos.length,
        pedidosEmProducao: pedidos.filter(p => p.status === 'programado' || p.status === 'em_producao').length,
        pedidosAguardando: aguardando,
        pedidosFinalizados: pedidos.filter(p => p.status === 'finalizado').length,
        valorCarteiraTotal: pedidosAtivos.reduce((s, p) => s + Number(p.valor_total || 0), 0),
        horasCarteira, totalOPs: ops.length,
        opsEmProducao: ops.filter(o => o.status_producao !== 'Producao Finalizada' && o.status_producao !== 'aguardando').length,
        totalSetores: setores.length, capacidadeDiaria,
        pedidosPorCanal,
        alertas, materiaisCriticos, valorEstoque, totalPropostaCompra, cifData,
        mesRef, vendasMesRef, producaoMesRef, comprasMesRef,
        comparativoAnual,
        pedidosAtrasados,
        derivadoFinanceiroDiario,
        custoPorHoraReal, custoFixoMensal, horasProduzidasMes,
        custoEstimado: usarCustoEstimado,
      });
      setLastUpdate(new Date());
    } catch (e) {
      console.error('[CIG] Erro ao carregar dados:', e);
    }
    setLoading(false);
  };

  const diasCarteira = capacidade ? capacidade.diasNecessarios : 0;
  const setorGargaloOcup = capacidade?.setores ? Math.max(...capacidade.setores.map(s => s.carga_percent), 0) : 0;
  const cargaPercentual = setorGargaloOcup;
  const prazoVendas = capacidade?.prazoVendasDias ?? 0;
  const gargaloNome = capacidade?.setorGargaloDias ?? 'N/A';
  const fmt = (v: number) => v >= 999500 ? `R$ ${(v / 1000000).toFixed(2)}M` : v >= 1000 ? `R$ ${(v / 1000).toFixed(0)}k` : `R$ ${v.toFixed(0)}`;
  const tooltipStyle = { backgroundColor: 'hsl(220, 20%, 14%)', border: '1px solid hsl(220, 18%, 22%)', borderRadius: '8px', color: 'hsl(210, 20%, 95%)' };

  const temVendasMes = kpis.vendasMesRef.some(v => v.valor > 0);
  const temProducaoMes = kpis.producaoMesRef.some(p => (p.qtd || 0) > 0 || p.valor > 0);
  const temComprasMes = kpis.comprasMesRef.some(c => c.valor > 0);
  const temComparativo = kpis.comparativoAnual.some(c => c.vendido > 0 || c.produzido > 0);
  const rotuloMes = kpis.mesRef?.rotulo ?? new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

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
            Período: <span className="text-foreground font-medium">{rotuloMes}</span>
            {kpis.mesRef && !kpis.mesRef.ehAtual && <span className="text-warning ml-2">(fallback — mês atual vazio)</span>}
            {' • '}Atualizado: {lastUpdate.toLocaleTimeString('pt-BR')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading} className="gap-2">
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            Atualizar
          </Button>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-success/10 border-success/30">
            <div className="w-2 h-2 rounded-full animate-pulse bg-success" />
            <span className="text-sm font-medium text-success">Dados Reais</span>
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
              alerta.startsWith('ℹ️') ? 'bg-primary/10 border-primary/30 text-primary' :
              'bg-success/10 border-success/30 text-success'
            )}>
              {alerta}
            </div>
          ))}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
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

      {/* === VENDAS + PRODUÇÃO === */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ModuleCard title={`📊 Vendas — ${rotuloMes} (R$/dia útil)`} variant="civ">
          <div className="h-64">
            {temVendasMes ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={kpis.vendasMesRef}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 18%, 22%)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 10 }} interval={1} />
                  <YAxis tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`R$ ${v.toLocaleString('pt-BR')}`, 'Vendas']} labelFormatter={(l) => `Dia ${l}`} />
                  <Bar dataKey="valor" fill={CHART_COLORS.verde} radius={[3, 3, 0, 0]} name="Vendas diárias" opacity={0.85} />
                  <Line type="monotone" dataKey="valor" stroke={CHART_COLORS.verde} strokeWidth={2} dot={false} name="Tendência" />
                </ComposedChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </div>
        </ModuleCard>

        <ModuleCard title={`🏭 Produção — ${rotuloMes} (R$/dia útil)`} variant="cip">
          <div className="h-64">
            {temProducaoMes ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={kpis.producaoMesRef}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 18%, 22%)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 10 }} interval={1} />
                  <YAxis tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`R$ ${v.toLocaleString('pt-BR')}`, 'Produção']} labelFormatter={(l) => `Dia ${l}`} />
                  <Bar dataKey="valor" fill={CHART_COLORS.laranja} radius={[3, 3, 0, 0]} name="Produzido (R$)" opacity={0.85} />
                  <Line type="monotone" dataKey="valor" stroke={CHART_COLORS.laranja} strokeWidth={2} dot={false} name="Tendência" />
                </ComposedChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </div>
        </ModuleCard>
      </div>

      {/* === EVOLUÇÃO ANUAL + DISTRIBUIÇÃO DIÁRIA CONSOLIDADA === */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ModuleCard title="📈 Evolução Anual — Vendido × Produzido (R$)" variant="cig">
          <div className="h-64">
            {temComparativo ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={kpis.comparativoAnual}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 18%, 22%)" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 10 }} tickFormatter={(k) => { const [y, m] = k.split('-'); return `${MESES_PT[+m - 1].slice(0, 3)}/${y.slice(2)}`; }} />
                  <YAxis tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number, n: string) => [`R$ ${Number(v).toLocaleString('pt-BR')}`, n]} />
                  <Legend />
                  <Bar dataKey="vendido" fill={CHART_COLORS.verde} name="Vendido" radius={[3, 3, 0, 0]} />
                  <Line type="monotone" dataKey="produzido" stroke={CHART_COLORS.azulMarinho} strokeWidth={2} dot={{ r: 3 }} name="Produzido" />
                </ComposedChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </div>
        </ModuleCard>

        <ModuleCard title={`📅 Distribuição Diária — ${rotuloMes}`} variant="cig">
          <div className="h-64">
            {(temVendasMes || temProducaoMes || temComprasMes) ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={kpis.vendasMesRef.map((v, i) => ({
                  label: v.label,
                  vendas: v.valor,
                  producao: kpis.producaoMesRef[i]?.valor || 0,
                  compras: kpis.comprasMesRef[i]?.valor || 0,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 18%, 22%)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 10 }} interval={1} />
                  <YAxis tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number, n: string) => [`R$ ${Number(v).toLocaleString('pt-BR')}`, n]} labelFormatter={(l) => `Dia ${l}`} />
                  <Legend />
                  <Bar dataKey="vendas" fill={CHART_COLORS.verde} name="Vendas" radius={[2, 2, 0, 0]} />
                  <Line type="monotone" dataKey="producao" stroke={CHART_COLORS.azulMarinho} strokeWidth={2} dot={false} name="Produção" />
                  <Line type="monotone" dataKey="compras" stroke={CHART_COLORS.laranja} strokeWidth={2} dot={false} name="Compras" />
                </ComposedChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </div>
        </ModuleCard>
      </div>

      {/* === FINANCEIRO DERIVADO === */}
      <ModuleCard
        title="💰 Financeiro Derivado — Origem: Vendas (CIV) × Produção (CIP) × Custo Fixo (CIF)"
        variant="cif"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 p-3 rounded-lg bg-muted/20 border border-border/30">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Custo Fixo Mensal</p>
            <p className="text-sm font-bold text-foreground">{fmt(kpis.custoFixoMensal)}</p>
            <p className="text-[9px] text-muted-foreground">CIF · custos_fixos ativos</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Horas Produzidas</p>
            <p className="text-sm font-bold text-foreground">{kpis.horasProduzidasMes.toFixed(1)}h</p>
            <p className="text-[9px] text-muted-foreground">CIP · OPs do mês ref.</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
              Custo / Hora {kpis.custoEstimado && <span className="text-warning">(estimado)</span>}
            </p>
            <p className="text-sm font-bold text-foreground">
              {kpis.custoEstimado ? '65% s/ vendas' : fmt(kpis.custoPorHoraReal)}
            </p>
            <p className="text-[9px] text-muted-foreground">
              {kpis.custoEstimado ? 'Fator operacional padrão' : '= Custo Fixo ÷ Horas'}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Lucro Acumulado</p>
            {(() => {
              const totalLucro = kpis.derivadoFinanceiroDiario.reduce((s, d) => s + d.lucro, 0);
              return (
                <>
                  <p className={cn('text-sm font-bold', totalLucro >= 0 ? 'text-success' : 'text-destructive')}>{fmt(totalLucro)}</p>
                  <p className="text-[9px] text-muted-foreground">= Vendas − Custo derivado</p>
                </>
              );
            })()}
          </div>
        </div>

        {kpis.custoEstimado && temVendasMes && (
          <div className="mb-3 p-2 rounded-md bg-warning/10 border border-warning/30 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
            <p className="text-xs text-warning">
              <strong>Custo estimado</strong> (65% s/ vendas — referência moveleira). Para custo real:
              cadastre <strong>custos fixos no CIF</strong> e <strong>finalize OPs no CIP</strong>.
            </p>
          </div>
        )}

        <div className="h-72">
          {temVendasMes ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={kpis.derivadoFinanceiroDiario}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 18%, 22%)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 10 }} interval={1} />
                <YAxis tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number, name: string) => [`R$ ${Number(v).toLocaleString('pt-BR')}`, name]} labelFormatter={(l) => `Dia ${l}`} />
                <Legend />
                <Bar dataKey="faturamento" fill={CHART_COLORS.verde} radius={[3, 3, 0, 0]} name="Receita" opacity={0.85} />
                <Bar dataKey="custo" fill={CHART_COLORS.vermelho} radius={[3, 3, 0, 0]} name={kpis.custoEstimado ? 'Custo (estimado)' : 'Custo (real)'} opacity={0.75} />
                <Line type="monotone" dataKey="lucro" stroke={CHART_COLORS.amarelo} strokeWidth={2.5} dot={{ r: 3 }} name="Lucro" />
              </ComposedChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </div>
      </ModuleCard>

      {/* === Lucro Acumulado + Margem === */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ModuleCard title={`📈 Lucro Acumulado — ${rotuloMes} (R$)`} variant="cif">
          <div className="h-64">
            {temVendasMes ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={kpis.derivadoFinanceiroDiario}>
                  <defs>
                    <linearGradient id="lucroAcum" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.verde} stopOpacity={0.6} />
                      <stop offset="95%" stopColor={CHART_COLORS.verde} stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 18%, 22%)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 10 }} interval={1} />
                  <YAxis tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`R$ ${Number(v).toLocaleString('pt-BR')}`, 'Lucro acum.']} labelFormatter={(l) => `Dia ${l}`} />
                  <Area type="monotone" dataKey="lucroAcumulado" stroke={CHART_COLORS.verde} strokeWidth={2.5} fill="url(#lucroAcum)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </div>
        </ModuleCard>

        <ModuleCard title="📊 Margem Diária — % (Lucro ÷ Receita)" variant="cif">
          <div className="h-64">
            {temVendasMes ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={kpis.derivadoFinanceiroDiario}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 18%, 22%)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 10 }} interval={1} />
                  <YAxis tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 11 }} tickFormatter={(v) => `${v}%`} domain={[0, 'auto']} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`, 'Margem']} labelFormatter={(l) => `Dia ${l}`} />
                  <Bar dataKey="margem" fill={CHART_COLORS.amarelo} radius={[3, 3, 0, 0]} name="Margem %" opacity={0.85} />
                  <Line type="monotone" dataKey="margem" stroke={CHART_COLORS.azulMarinho} strokeWidth={2} dot={false} name="Tendência" />
                </ComposedChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </div>
        </ModuleCard>
      </div>

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
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="h-64 flex flex-col items-center justify-center text-muted-foreground gap-2">
      <Inbox className="h-8 w-8 opacity-50" />
      <span className="text-sm">Sem dados cadastrados no período</span>
    </div>
  );
}
