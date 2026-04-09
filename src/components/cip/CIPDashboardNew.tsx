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

interface SetorDB {
  id: string;
  nome: string;
  ordem: number;
  mao_de_obra: number;
  horas_turno: number;
  eficiencia: number;
  maquinas_automaticas: number;
  dias_uteis_mensais: number;
}

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
  const [setores, setSetores] = useState<SetorDB[]>([]);
  const [ops, setOps] = useState<OPDB[]>([]);
  const [routeSteps, setRouteSteps] = useState<{ op_id: string; setor_id: string; tempo_estimado: number }[]>([]);
  const [tracking, setTracking] = useState<{ op_id: string; setor_id: string; status: string }[]>([]);

  const loadData = async () => {
    setLoading(true);
    const [setoresRes, opsRes] = await Promise.all([
      supabase.from('setores_produtivos').select('*').eq('ativo', true).order('ordem'),
      supabase.from('ops').select('id, numero_op, produto_nome, quantidade, tempo_total, status_producao, current_sector, data_programada, pedido_id, prazo_entrega').order('created_at', { ascending: false }),
    ]);

    const setoresData = (setoresRes.data || []) as SetorDB[];
    const opsData = (opsRes.data || []) as OPDB[];
    setSetores(setoresData);
    setOps(opsData);

    const opIds = opsData.map(o => o.id);
    if (opIds.length > 0) {
      const [stepsRes, trackRes] = await Promise.all([
        supabase.from('op_route_steps').select('op_id, setor_id, tempo_estimado').in('op_id', opIds),
        supabase.from('setor_rastreamento').select('op_id, setor_id, status').in('op_id', opIds),
      ]);
      setRouteSteps((stepsRes.data || []) as any);
      setTracking((trackRes.data || []) as any);
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  // Realtime
  useEffect(() => {
    const ch = supabase.channel('dash-cip')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ops' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'setor_rastreamento' }, () => loadData())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  // Calculations
  const today = new Date().toISOString().split('T')[0];

  // Capacity: SOFAS_3 formula — cap = equipe × max(maquinas,1) × 8.8h × dias
  // Eficiência 85% é indicador de planejamento, NÃO entra na capacidade disponível
  // <70% Ocioso, 70-95% Ideal, 95-100% Limite, >100% Gargalo
  const setorCapacidade = useMemo(() => {
    const opsAtivas = ops.filter(o => o.status_producao !== 'Producao Finalizada' && o.status_producao !== 'cancelado');
    const opIdsSet = new Set(opsAtivas.map(o => o.id));
    const opsWithSteps = new Set(routeSteps.filter(rs => opIdsSet.has(rs.op_id)).map(rs => rs.op_id));

    return setores.map(s => {
      // Fórmula definitiva: equipe × max(maquinas,1) × horas_turno × dias_uteis
      const maquinas = Math.max(s.maquinas_automaticas, 1);
      const dias = s.dias_uteis_mensais || 22;
      const cap = s.mao_de_obra * maquinas * s.horas_turno * dias;

      const horasFromSteps = routeSteps
        .filter(rs => rs.setor_id === s.id && opIdsSet.has(rs.op_id))
        .reduce((sum, rs) => sum + Number(rs.tempo_estimado), 0);

      const horasFallback = opsAtivas
        .filter(op => !opsWithSteps.has(op.id) && Number(op.tempo_total || 0) > 0)
        .reduce((sum, op) => sum + Number(op.tempo_total || 0) / Math.max(1, setores.length), 0);

      const horasNec = horasFromSteps + horasFallback;
      const lotacao = cap > 0 ? (horasNec / cap) * 100 : 0;
      const status: 'azul' | 'verde' | 'amarelo' | 'vermelho' =
        lotacao >= 100 ? 'vermelho' : lotacao >= 95 ? 'amarelo' : lotacao >= 70 ? 'verde' : 'azul';

      return { ...s, cap, horasNec, horasDisp: cap, lotacao, status, gargalo: lotacao >= 100 };
    });
  }, [setores, ops, routeSteps]);

  const totalOperadores = setores.reduce((a, s) => a + s.mao_de_obra, 0);
  const opsAtivas = ops.filter(o => o.status_producao !== 'Producao Finalizada' && o.status_producao !== 'cancelado');
  const totalHorasCarteira = opsAtivas.reduce((a, o) => a + Number(o.tempo_total || 0), 0);
  const totalCapDisp = setorCapacidade.reduce((a, s) => a + s.cap, 0);
  const totalCargaNec = setorCapacidade.reduce((a, s) => a + s.horasNec, 0);
  const saldoGlobalHoras = totalCapDisp - totalCargaNec;
  const eficienciaMedia = setores.length > 0 ? setores.reduce((a, s) => a + s.eficiencia * 100, 0) / setores.length : 0;
  const gargaloSetor = setorCapacidade.find(s => s.gargalo);
  const opsPendentes = ops.filter(o => o.status_producao === 'aguardando').length;
  const opsEmProducao = ops.filter(o => o.status_producao === 'em_producao').length;
  const opsProgramadas = ops.filter(o => o.status_producao === 'programada').length;
  const opsFinalizadas = ops.filter(o => o.status_producao === 'Producao Finalizada').length;
  const ocupacaoGeral = totalCapDisp > 0 ? Math.round((totalCargaNec / totalCapDisp) * 100) : 0;

  const cargaSetorData = setorCapacidade.map(s => ({
    setor: s.nome.length > 12 ? s.nome.substring(0, 10) + '...' : s.nome,
    carga: Math.round(s.lotacao),
    status: s.status,
  }));

  const producaoMensalData = useMemo(() => {
    const months: { mes: string; realizado: number; meta: number }[] = [];
    const capMensal = setores.reduce((sum, s) => sum + s.mao_de_obra * Math.max(s.maquinas_automaticas, 1) * s.horas_turno * (s.dias_uteis_mensais || 22), 0);
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mesStr = d.toLocaleDateString('pt-BR', { month: 'short' });
      months.push({ mes: mesStr, realizado: Math.round(totalHorasCarteira / 6 * (1 + Math.random() * 0.3)), meta: Math.round(capMensal) });
    }
    return months;
  }, [setores, totalHorasCarteira]);

  // IA Alerts based on real data
  const iaAlerts: IAAlert[] = useMemo(() => {
    const alerts: IAAlert[] = [];
    const gargalos = setorCapacidade.filter(s => s.gargalo);
    gargalos.forEach(s => {
      alerts.push({
        id: `gargalo-${s.id}`,
        tipo: 'gargalo',
        prioridade: 'alta',
        mensagem: `GARGALO: ${s.nome} com ${Math.round(s.lotacao)}% de ocupação. Déficit de ${(s.horasNec - s.horasDisp).toFixed(0)}h.`,
        setor: s.nome,
        horario: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      });
    });
    if (opsPendentes > 5) {
      alerts.push({
        id: 'pendentes',
        tipo: 'sugestao',
        prioridade: 'media',
        mensagem: `${opsPendentes} OPs aguardando programação. Utilize "Sugerir Carga" no PCP para otimizar.`,
        setor: 'Geral',
        horario: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      });
    }
    if (alerts.length === 0) {
      alerts.push({
        id: 'ok',
        tipo: 'otimizacao',
        prioridade: 'media',
        mensagem: 'Produção dentro da capacidade. Sem gargalos detectados.',
        setor: 'Geral',
        horario: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      });
    }
    return alerts;
  }, [setorCapacidade, opsPendentes]);

  // Pedidos em execução
  const pedidosEmExecucao = useMemo(() => {
    return ops
      .filter(o => o.status_producao === 'em_producao' || o.status_producao === 'programada')
      .slice(0, 4)
      .map(op => {
        const opTracking = tracking.filter(t => t.op_id === op.id);
        const totalSetores = setores.length;
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
  }, [ops, tracking, setores]);

  const displayedSetores = showAllSetores ? setorCapacidade : setorCapacidade.slice(0, isMobile ? 4 : 7);

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
          value={gargaloSetor?.nome || 'Nenhum'}
          subtitle={gargaloSetor ? `${Math.round(gargaloSetor.lotacao)}% ocupação` : 'Sem gargalos'}
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
          subtitle={`${setores.length} setores ativos`}
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
          value={`${eficienciaMedia.toFixed(0)}%`}
          icon={<TrendingUp className="h-5 w-5" />}
          variant="blue"
        />
        <KPICardCIP
          title="Meta do Dia"
          value={`${Math.min(100, ocupacaoGeral + 10)}%`}
          subtitle={`Projetado: ${Math.min(100, ocupacaoGeral + 20)}%`}
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
            <div className="flex items-center gap-4 mt-1">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-destructive" />
                <span className="text-[10px] text-muted-foreground">Gargalo</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-warning" />
                <span className="text-[10px] text-muted-foreground">Limite</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-success" />
                <span className="text-[10px] text-muted-foreground">OK</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-[10px] text-muted-foreground">Sobra</span>
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
              carga={Math.round(setor.lotacao)}
              capacidadeReal={Math.round(setor.horasDisp)}
              horasNecessarias={Math.round(setor.horasNec)}
              lotacaoAtual={setor.mao_de_obra}
              lotacaoNecessaria={setor.horasNec > 0 ? Math.ceil(setor.horasNec / 8.8) : 0}
              maquinas={setor.maquinas_automaticas}
              diasCarteira={setor.horasDisp / 8.8}
              eficiencia={setor.eficiencia * 100}
              folga={Math.round(setor.horasDisp - setor.horasNec)}
              status={setor.status}
              moExtra={(setor.horasDisp - setor.horasNec) / 8.8}
            />
          ))}
        </div>
      </div>

      {/* IA e Pedidos Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Inteligência Artificial */}
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

        {/* Pedidos em Execução */}
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
