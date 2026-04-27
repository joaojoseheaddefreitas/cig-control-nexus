import { useState, useEffect, useMemo } from 'react';
import { Activity, Clock, Calendar, AlertTriangle, Users, Target, TrendingUp, Gauge, Brain, ChevronDown, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { KPICardCIP } from './dashboard/KPICardCIP';
import { SetorCard } from './dashboard/SetorCard';
import { IAAlertCard, IAAlert } from './dashboard/IAAlertCard';
import { PedidoEmExecucaoCard } from './dashboard/PedidoEmExecucaoCard';
import { CargaSetorChart } from './dashboard/CargaSetorChart';
import { ProducaoMensalChart } from './dashboard/ProducaoMensalChart';
import { SerieMensal2026 } from '@/components/shared/SerieMensal2026';
import { DistribuicaoDiariaAbrilChart } from '@/components/shared/DistribuicaoDiariaAbrilChart';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCapacidadeIndustrial } from '@/hooks/useCapacidadeIndustrial';
import {
  getEficienciaLabel,
  type CapacidadeFabrica,
} from '@/services/capacidadeIndustrialService';

interface OPDB {
  id: string;
  numero_op: string;
  produto_nome: string;
  quantidade: number;
  tempo_total: number | null;
  status_producao: string;
  current_sector: string | null;
  data_programada: string | null;
  pedido_id: string | null;
  prazo_entrega: string | null;
}

export function CIPDashboardNew() {
  const isMobile = useIsMobile();
  const [showAllSetores, setShowAllSetores] = useState(false);
  const { capacidade, loading: capLoading } = useCapacidadeIndustrial();
  const [ops, setOps] = useState<OPDB[]>([]);
  const [tracking, setTracking] = useState<{ op_id: string; setor_id: string; status: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOps = async () => {
    setLoading(true);
    const opsRes = await supabase.from('ops').select('id, numero_op, produto_nome, quantidade, tempo_total, status_producao, current_sector, data_programada, pedido_id, prazo_entrega').order('created_at', { ascending: false });
    const opsData = (opsRes.data || []) as OPDB[];
    setOps(opsData);

    if (opsData.length > 0) {
      const { data: trackData } = await supabase
        .from('setor_rastreamento')
        .select('op_id, setor_id, status')
        .in('op_id', opsData.map(o => o.id));
      setTracking((trackData || []) as any);
    }
    setLoading(false);
  };

  useEffect(() => { loadOps(); }, []);

  useEffect(() => {
    const ch = supabase.channel('dash-cip-ops')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ops' }, () => loadOps())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'setor_rastreamento' }, () => loadOps())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  // Derived values
  const setorCapacidade = capacidade?.setores || [];
  const totalOperadores = setorCapacidade.reduce((a, s) => a + s.mao_de_obra, 0);
  const opsAtivas = ops.filter(o => o.status_producao !== 'Producao Finalizada' && o.status_producao !== 'cancelado');
  const totalHorasCarteira = opsAtivas.reduce((a, o) => a + Number(o.tempo_total || 0), 0);
  const totalCapDisp = capacidade?.horasProdutivasTotais || 0;
  const saldoGlobalHoras = capacidade?.saldoHoras || 0;
  const eficienciaMedia = capacidade ? Math.round(capacidade.eficienciaMedia * 100) : 85;
  const opsPendentes = ops.filter(o => o.status_producao === 'aguardando').length;
  const opsEmProducao = ops.filter(o => o.status_producao === 'em_producao').length;
  const opsProgramadas = ops.filter(o => o.status_producao === 'programada').length;
  const opsFinalizadas = ops.filter(o => o.status_producao === 'Producao Finalizada').length;
  // OCUPAÇÃO REAL = ocupação do GARGALO (setor com maior carga %)
  // A capacidade fabril é limitada pelo gargalo, não pela média dos setores.
  const ocupacaoGargalo = setorCapacidade.length > 0
    ? Math.max(...setorCapacidade.map(s => s.carga_percent))
    : 0;
  const setorGargaloOcup = setorCapacidade.length > 0
    ? setorCapacidade.reduce((max, s) => s.carga_percent > max.carga_percent ? s : max, setorCapacidade[0])
    : null;
  const ocupacaoMediaSetores = capacidade?.percentualOcupacao || 0;
  // Ocupação Geral mostra a do gargalo (limita toda a fábrica)
  const ocupacaoGeral = ocupacaoGargalo;

  // PCP 3.0 — prazo de vendas
  const prazoVendasDias = capacidade?.prazoVendasDias || 0;
  const gargaloEmDias = capacidade?.gargaloEmDias || 0;
  const setorGargaloDias = capacidade?.setorGargaloDias || 'N/A';
  const alertaDesbalanceamento = capacidade?.alertaDesbalanceamento || false;
  const folgaMax = capacidade?.folgaMax || 0;
  const folgaMin = capacidade?.folgaMin || 0;
  const setorMaisFolgado = capacidade?.setorMaisFolgado || '';
  const setorMenosFolgado = capacidade?.setorMenosFolgado || '';

  const cargaSetorData = setorCapacidade.map(s => ({
    setor: s.nome.length > 12 ? s.nome.substring(0, 10) + '...' : s.nome,
    carga: s.carga_percent,
    status: s.status as 'verde' | 'amarelo' | 'vermelho' | 'azul' | 'laranja',
    cap: Math.round(s.horas_disponiveis_mensal),
    nec: Math.round(s.horas_ocupadas),
    diasGargalo: s.diasGargalo,
  }));

  const producaoMensalData = useMemo(() => {
    const months: { mes: string; realizado: number; meta: number }[] = [];
    const capMensal = totalCapDisp;
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mesStr = d.toLocaleDateString('pt-BR', { month: 'short' });
      months.push({ mes: mesStr, realizado: Math.round(totalHorasCarteira / 6 * (1 + Math.random() * 0.3)), meta: Math.round(capMensal) });
    }
    return months;
  }, [totalCapDisp, totalHorasCarteira]);

  const iaAlerts: IAAlert[] = useMemo(() => {
    const alerts: IAAlert[] = [];
    const horario = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    // Setores com risco de gargalo (>=85%)
    const sobrecarga = setorCapacidade.filter(s => s.carga_percent >= 85);
    sobrecarga.forEach(s => {
      const isGargalo = s.carga_percent > 100;
      const operadoresExtras = Math.ceil((s.horas_ocupadas - s.horas_disponiveis_mensal) / (s.horas_turno * s.dias_uteis_mensais)) || 1;
      alerts.push({
        id: `sobrecarga-${s.id}`,
        tipo: 'gargalo',
        prioridade: 'alta',
        mensagem: isGargalo
          ? `🔥 GARGALO em ${s.nome} (${s.carga_percent}%). Sugestão: aumentar lotação em +${Math.max(operadoresExtras, 1)} operador(es) ou adicionar 1 máquina/turno extra para balancear a fábrica.`
          : `⚠️ ${s.nome} a ${s.carga_percent}% — risco de gargalo. Sugestão: avaliar +1 operador OU realocar carga para setor ocioso (${setorMaisFolgado}).`,
        setor: s.nome,
        horario,
      });
    });

    if (opsPendentes > 5) {
      alerts.push({
        id: 'pendentes', tipo: 'sugestao', prioridade: 'media',
        mensagem: `${opsPendentes} OPs aguardando programação.`,
        setor: 'Geral',
        horario,
      });
    }
    if (alertaDesbalanceamento) {
      alerts.push({
        id: 'desbalance', tipo: 'gargalo', prioridade: 'alta',
        mensagem: `⚖️ Desbalanceamento: ${setorMenosFolgado} (${folgaMin.toFixed(1)}% folga) está limitando a fábrica enquanto ${setorMaisFolgado} (${folgaMax.toFixed(1)}% folga) está ocioso. Sugestão: realocar 1-2 operadores do setor ocioso para o gargalo.`,
        setor: 'Geral',
        horario,
      });
    }
    if (alerts.length === 0) {
      alerts.push({
        id: 'ok', tipo: 'otimizacao', prioridade: 'media',
        mensagem: 'Produção dentro da capacidade. Sem gargalos detectados.',
        setor: 'Geral',
        horario,
      });
    }
    return alerts;
  }, [setorCapacidade, opsPendentes, alertaDesbalanceamento, folgaMax, folgaMin, setorMaisFolgado, setorMenosFolgado]);

  const pedidosEmExecucao = useMemo(() => {
    return ops
      .filter(o => o.status_producao === 'em_producao' || o.status_producao === 'programada')
      .slice(0, 4)
      .map(op => {
        const opTracking = tracking.filter(t => t.op_id === op.id);
        const totalSetores = setorCapacidade.length;
        const concluidos = opTracking.filter(t => t.status === 'baixa').length;
        const progresso = totalSetores > 0 ? Math.round((concluidos / totalSetores) * 100) : 0;
        return {
          codigo: op.numero_op,
          produto: op.produto_nome,
          cliente: '',
          progresso,
          setorAtual: op.current_sector || 'Aguardando',
          status: op.status_producao === 'em_producao' ? 'em_producao' as const : 'aguardando' as const,
        };
      });
  }, [ops, tracking, setorCapacidade]);

  const displayedSetores = showAllSetores ? setorCapacidade : setorCapacidade.slice(0, isMobile ? 4 : 7);
  const efLabel = getEficienciaLabel(eficienciaMedia);

  if (loading || capLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-cip" />
        <span className="ml-3 text-muted-foreground">Carregando Dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-cip" />
            <h1 className="font-display text-xl lg:text-2xl font-bold text-foreground">CIP</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Centro de Inteligência de Produção • {new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px]">{ops.length} OPs</Badge>
          <Badge variant="outline" className="text-[10px] border-success/50 text-success">{opsFinalizadas} Finalizadas</Badge>
        </div>
      </div>

      {/* KPIs Grid - Main */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <KPICardCIP
          title="Prazo de Vendas"
          value={`${prazoVendasDias}d`}
          subtitle={`Gargalo: ${setorGargaloDias.substring(0, 15)} (${gargaloEmDias.toFixed(1)}d)`}
          icon={<Target className="h-5 w-5" />}
          variant={
            gargaloEmDias > 25 ? 'red' :
            gargaloEmDias > 15 ? 'orange' :
            gargaloEmDias > 8  ? 'green' : 'blue'
          }
        />
        <KPICardCIP
          title="OPs Ativas"
          value={`${opsPendentes + opsProgramadas + opsEmProducao}`}
          subtitle={`Pend: ${opsPendentes} | Prog: ${opsProgramadas}`}
          icon={<Clock className="h-5 w-5" />}
          variant="green"
        />
        <KPICardCIP
          title="Em Produção"
          value={`${opsEmProducao}`}
          subtitle={`Finalizadas: ${opsFinalizadas}`}
          icon={<Calendar className="h-5 w-5" />}
          variant="orange"
        />
        <KPICardCIP
          title="Gargalo Atual"
          value={(setorGargaloOcup?.nome || setorGargaloDias).substring(0, 12)}
          subtitle={`${gargaloEmDias.toFixed(1)}d · ${ocupacaoGargalo}% ocup. (gargalo)`}
          icon={<AlertTriangle className="h-5 w-5" />}
          variant={ocupacaoGargalo > 100 ? 'red' : ocupacaoGargalo >= 85 ? 'red' : ocupacaoGargalo >= 70 ? 'orange' : 'green'}
          size="sm"
        />
      </div>

      {/* KPIs Grid - Secondary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <KPICardCIP
          title="Lotação Total"
          value={totalOperadores}
          subtitle={`${setorCapacidade.length} setores ativos`}
          icon={<Users className="h-5 w-5" />}
          variant="blue"
        />
        <KPICardCIP
          title="Total Horas Carteira"
          value={`${totalHorasCarteira.toFixed(0)}h`}
          subtitle={`${ops.length} OPs no sistema`}
          icon={<Clock className="h-5 w-5" />}
          variant="default"
        />
        <KPICardCIP
          title="Eficiência Média"
          value={`${eficienciaMedia}%`}
          subtitle={efLabel.label}
          icon={<TrendingUp className="h-5 w-5" />}
          variant="blue"
        />
        <KPICardCIP
          title="Ocupação Fabril (Gargalo)"
          value={`${ocupacaoGargalo}%`}
          subtitle={`Limite real · média: ${ocupacaoMediaSetores}% · saldo ${saldoGlobalHoras >= 0 ? '+' : ''}${saldoGlobalHoras.toFixed(0)}h`}
          icon={<Gauge className="h-5 w-5" />}
          variant={ocupacaoGargalo > 100 ? 'red' : ocupacaoGargalo >= 85 ? 'red' : ocupacaoGargalo >= 70 ? 'orange' : 'green'}
        />
      </div>

      {/* Charts Row — Produção 2026 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SerieMensal2026
          metricas={['producao']}
          variant="cip"
          title="Produção Mensal 2026"
          subtitle="Valor produzido Jan → Abr (R$)"
        />
        <DistribuicaoDiariaAbrilChart
          metricas={['producao']}
          variant="cip"
          title="Produção Diária – Abril/2026"
          subtitle="Distribuição diária do valor produzido (R$)"
        />
      </div>

      {/* Ocupação por Setor */}
      <div className="grid grid-cols-1 gap-4">
        <CargaSetorChart data={cargaSetorData} title="Ocupação por Setor" />
      </div>

      {/* Status dos Setores */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display font-bold text-foreground text-lg">Status dos Setores</h2>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-destructive" />
                <span className="text-[10px] text-muted-foreground">&lt;3% Folga — Crítico</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-warning" />
                <span className="text-[10px] text-muted-foreground">3-11% Atenção</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-success" />
                <span className="text-[10px] text-muted-foreground">11-30% Normal</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <span className="text-[10px] text-muted-foreground">&gt;30% Disponível</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowAllSetores(!showAllSetores)}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            {showAllSetores ? 'Ver menos' : 'Ver todos'}
            <ChevronDown className={`h-4 w-4 transition-transform ${showAllSetores ? 'rotate-180' : ''}`} />
          </button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {displayedSetores.map((setor) => (
              <SetorCard
                key={setor.id}
                nome={setor.nome}
                sigla={setor.id.substring(0, 3).toUpperCase()}
                carga={setor.carga_percent}
                capacidadeReal={Math.round(setor.horas_disponiveis_mensal)}
                horasNecessarias={Math.round(setor.horas_ocupadas)}
                lotacaoAtual={setor.mao_de_obra}
                maquinas={Math.max(setor.maquinas_automaticas, 1)}
                diasUteis={setor.dias_uteis_mensais}
                diasUteisManual={setor.dias_uteis_manual}
                eficiencia={Math.round(setor.eficiencia * 100)}
                folga={Math.round(setor.horas_disponiveis_mensal - setor.horas_ocupadas)}
                status={setor.status}
                folgaResidual={Math.round(setor.folgaResidual)}
                diasGargalo={+(setor.diasGargalo).toFixed(1)}
                statusFolga={setor.statusFolga}
                limiteOperacional={Math.round(setor.limiteOperacional)}
              />
          ))}
        </div>
      </div>

      {/* Alerta de Desbalanceamento */}
      {alertaDesbalanceamento && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl border-2 border-warning/60 bg-warning/10 text-sm">
          <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-warning">⚠️ ALERTA DE DESBALANCEAMENTO</p>
            <p className="text-muted-foreground text-xs mt-1">
              <strong className="text-foreground">{setorMenosFolgado}</strong> está
              bloqueando o faturamento ({folgaMin.toFixed(1)}% de folga) enquanto{' '}
              <strong className="text-foreground">{setorMaisFolgado}</strong> está
              ocioso ({folgaMax.toFixed(1)}% de folga).
              Diferença de {(folgaMax - folgaMin).toFixed(0)}%.
              Sugerido remanejamento imediato.
            </p>
          </div>
        </div>
      )}

      {/* IA e Pedidos Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border/30 bg-card/80 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cip/20">
                <Brain className="h-5 w-5 text-cip" />
              </div>
              <div>
                <h3 className="font-display font-bold text-foreground">Inteligência Artificial</h3>
                <p className="text-xs text-muted-foreground">Diagnóstico em tempo real</p>
              </div>
            </div>
            <Badge className="bg-success/20 text-success border-success/30">● Ativo</Badge>
          </div>
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {iaAlerts.map((alert) => (
              <IAAlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border/30 bg-card/80 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-display font-bold text-foreground">OPs em Execução</h3>
            </div>
            <span className="text-xs text-muted-foreground">{pedidosEmExecucao.length} ativos</span>
          </div>
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {pedidosEmExecucao.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhuma OP em execução</p>
            ) : pedidosEmExecucao.map((pedido, index) => (
              <PedidoEmExecucaoCard key={index} {...pedido} />
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pt-4 border-t border-border/30">
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold">Modelo Industrial CIP</span> — João José Head de Freitas
        </p>
        <p className="text-[10px] text-muted-foreground mt-1">
          40 anos de chão de fábrica • Prazo baseado em <span className="text-warning">dias do gargalo</span>, nunca estimado
        </p>
      </div>
    </div>
  );
}
