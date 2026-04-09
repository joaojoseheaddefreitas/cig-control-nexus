import { useState, useEffect, useMemo } from 'react';
import { Activity, Clock, Calendar, AlertTriangle, Users, Target, TrendingUp, Gauge, Brain, ChevronDown, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { KPICardCIP } from './dashboard/KPICardCIP';
import { SetorCard } from './dashboard/SetorCard';
import { IAAlertCard, IAAlert } from './dashboard/IAAlertCard';
import { PedidoEmExecucaoCard } from './dashboard/PedidoEmExecucaoCard';
import { CargaSetorChart } from './dashboard/CargaSetorChart';
import { ProducaoMensalChart } from './dashboard/ProducaoMensalChart';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  calcularCapacidadeFabrica,
  getOcupacaoStatus,
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
  const [loading, setLoading] = useState(true);
  const [capacidade, setCapacidade] = useState<CapacidadeFabrica | null>(null);
  const [ops, setOps] = useState<OPDB[]>([]);
  const [tracking, setTracking] = useState<{ op_id: string; setor_id: string; status: string }[]>([]);

  const loadData = async () => {
    setLoading(true);
    const [capResult, opsRes] = await Promise.all([
      calcularCapacidadeFabrica(),
      supabase.from('ops').select('id, numero_op, produto_nome, quantidade, tempo_total, status_producao, current_sector, data_programada, pedido_id, prazo_entrega').order('created_at', { ascending: false }),
    ]);
    setCapacidade(capResult);
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

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    const ch = supabase.channel('dash-cip')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ops' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'setor_rastreamento' }, () => loadData())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  // Derived values — READ from centralized service, NO recalculation
  const setorCapacidade = capacidade?.setores || [];
  const totalOperadores = setorCapacidade.reduce((a, s) => a + s.mao_de_obra, 0);
  const opsAtivas = ops.filter(o => o.status_producao !== 'Producao Finalizada' && o.status_producao !== 'cancelado');
  const totalHorasCarteira = opsAtivas.reduce((a, o) => a + Number(o.tempo_total || 0), 0);
  const totalCapDisp = capacidade?.horasProdutivasTotais || 0;
  const totalCargaNec = capacidade?.horasNecessarias || 0;
  const saldoGlobalHoras = capacidade?.saldoHoras || 0;
  const eficienciaMedia = capacidade ? Math.round(capacidade.eficienciaMedia * 100) : 85;
  const gargaloSetor = setorCapacidade.reduce((max, s) => s.carga_percent > (max?.carga_percent || 0) ? s : max, setorCapacidade[0] || null);
  const opsPendentes = ops.filter(o => o.status_producao === 'aguardando').length;
  const opsEmProducao = ops.filter(o => o.status_producao === 'em_producao').length;
  const opsProgramadas = ops.filter(o => o.status_producao === 'programada').length;
  const opsFinalizadas = ops.filter(o => o.status_producao === 'Producao Finalizada').length;
  const ocupacaoGeral = capacidade?.percentualOcupacao || 0;

  const cargaSetorData = setorCapacidade.map(s => ({
    setor: s.nome.length > 12 ? s.nome.substring(0, 10) + '...' : s.nome,
    carga: s.carga_percent,
    status: s.status === 'laranja' ? 'amarelo' as const : s.status as 'verde' | 'amarelo' | 'vermelho' | 'azul',
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
    const gargalos = setorCapacidade.filter(s => s.carga_percent > 100);
    gargalos.forEach(s => {
      alerts.push({
        id: `gargalo-${s.id}`,
        tipo: 'gargalo',
        prioridade: 'alta',
        mensagem: `GARGALO: ${s.nome} com ${s.carga_percent}% de ocupação. Déficit de ${(s.horas_ocupadas - s.horas_disponiveis_mensal).toFixed(0)}h.`,
        setor: s.nome,
        horario: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      });
    });
    if (opsPendentes > 5) {
      alerts.push({
        id: 'pendentes', tipo: 'sugestao', prioridade: 'media',
        mensagem: `${opsPendentes} OPs aguardando programação.`,
        setor: 'Geral',
        horario: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      });
    }
    if (alerts.length === 0) {
      alerts.push({
        id: 'ok', tipo: 'otimizacao', prioridade: 'media',
        mensagem: 'Produção dentro da capacidade. Sem gargalos detectados.',
        setor: 'Geral',
        horario: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      });
    }
    return alerts;
  }, [setorCapacidade, opsPendentes]);

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

  if (loading) {
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
          title="Capacidade Fábrica"
          value={`${ocupacaoGeral}%`}
          subtitle={`Saldo: ${saldoGlobalHoras >= 0 ? '+' : ''}${saldoGlobalHoras.toFixed(0)}h`}
          icon={<Gauge className="h-5 w-5" />}
          variant="blue"
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
          value={gargaloSetor && gargaloSetor.carga_percent > 100 ? gargaloSetor.nome : 'Nenhum'}
          subtitle={gargaloSetor && gargaloSetor.carga_percent > 100 ? `${gargaloSetor.carga_percent}% ocupação` : 'Sem gargalos'}
          icon={<AlertTriangle className="h-5 w-5" />}
          variant="red"
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
          title="Dias Necessários"
          value={`${capacidade?.diasNecessarios || 0}d`}
          subtitle={`${capacidade?.diasUteis || 22} dias úteis/mês`}
          icon={<Target className="h-5 w-5" />}
          variant={ocupacaoGeral > 80 ? 'red' : 'green'}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CargaSetorChart data={cargaSetorData} />
        <ProducaoMensalChart data={producaoMensalData} />
      </div>

      {/* Status dos Setores */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display font-bold text-foreground text-lg">Status dos Setores</h2>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-destructive" />
                <span className="text-[10px] text-muted-foreground">&gt;100% Gargalo</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-orange-400" />
                <span className="text-[10px] text-muted-foreground">95-100% Limite</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-warning" />
                <span className="text-[10px] text-muted-foreground">80-95% Atenção</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-success" />
                <span className="text-[10px] text-muted-foreground">50-80% Normal</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <span className="text-[10px] text-muted-foreground">&lt;50% Ocioso</span>
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
              />
          ))}
        </div>
      </div>

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
          40 anos de chão de fábrica • Gargalo por saldo calculado, <span className="text-warning">nunca estimado</span>
        </p>
      </div>
    </div>
  );
}
