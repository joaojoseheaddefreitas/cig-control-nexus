import { cn } from '@/lib/utils';
import { Search, AlertTriangle, Clock, CheckCircle, Package, Eye, Brain, TrendingUp, Lightbulb, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface OPDB {
  id: string;
  numero_op: string;
  produto_nome: string;
  quantidade: number;
  tempo_total: number | null;
  status_producao: string;
  current_sector: string | null;
  prazo_entrega: string | null;
  pedido_id: string | null;
}

interface SetorDB {
  id: string;
  nome: string;
  ordem: number;
}

interface TrackingDB {
  op_id: string;
  setor_id: string;
  status: string;
  data_entrada: string | null;
  data_baixa: string | null;
}

const statusConfig = {
  em_producao: { label: 'Em Produção', color: 'bg-success text-success-foreground' },
  atrasado: { label: 'Atrasado', color: 'bg-destructive text-destructive-foreground' },
  aguardando: { label: 'Pendente', color: 'bg-warning text-warning-foreground' },
  programada: { label: 'Programada', color: 'bg-primary text-primary-foreground' },
  'Producao Finalizada': { label: 'Finalizada', color: 'bg-success text-success-foreground' },
};

export function CIPRastreamento() {
  const [search, setSearch] = useState('');
  const [selectedOpId, setSelectedOpId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [ops, setOps] = useState<OPDB[]>([]);
  const [setores, setSetores] = useState<SetorDB[]>([]);
  const [tracking, setTracking] = useState<TrackingDB[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [opsRes, setoresRes] = await Promise.all([
      supabase.from('ops').select('id, numero_op, produto_nome, quantidade, tempo_total, status_producao, current_sector, prazo_entrega, pedido_id')
        .in('status_producao', ['programada', 'em_producao', 'Producao Finalizada'])
        .order('created_at', { ascending: false }),
      supabase.from('setores_produtivos').select('id, nome, ordem').eq('ativo', true).order('ordem'),
    ]);
    const opsData = (opsRes.data || []) as OPDB[];
    setOps(opsData);
    setSetores((setoresRes.data || []) as SetorDB[]);

    const opIds = opsData.map(o => o.id);
    if (opIds.length > 0) {
      const { data } = await supabase.from('setor_rastreamento').select('op_id, setor_id, status, data_entrada, data_baixa').in('op_id', opIds);
      setTracking((data || []) as TrackingDB[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const ch = supabase.channel('rastreamento-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'setor_rastreamento' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ops' }, () => loadData())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [loadData]);

  const filteredOps = useMemo(() => ops.filter(o => {
    if (!search) return true;
    const term = search.toLowerCase();
    return o.numero_op.toLowerCase().includes(term) || o.produto_nome.toLowerCase().includes(term);
  }), [ops, search]);

  const getOpProgress = (opId: string) => {
    const opTrack = tracking.filter(t => t.op_id === opId);
    const concluidos = opTrack.filter(t => t.status === 'baixa').length;
    return setores.length > 0 ? Math.round((concluidos / setores.length) * 100) : 0;
  };

  const emProducaoCount = ops.filter(o => o.status_producao === 'em_producao').length;
  const programadaCount = ops.filter(o => o.status_producao === 'programada').length;
  const finalizadaCount = ops.filter(o => o.status_producao === 'Producao Finalizada').length;

  // IA alerts based on real data
  const alertasIA = useMemo(() => {
    const alerts: { tipo: string; titulo: string; descricao: string; sugestao: string; prioridade: string }[] = [];
    const opsEmProd = ops.filter(o => o.status_producao === 'em_producao');
    opsEmProd.forEach(op => {
      const opTrack = tracking.filter(t => t.op_id === op.id);
      const emEntrada = opTrack.filter(t => t.status === 'entrada');
      emEntrada.forEach(t => {
        if (t.data_entrada) {
          const horasDesde = (Date.now() - new Date(t.data_entrada).getTime()) / 3600000;
          if (horasDesde > 24) {
            const setor = setores.find(s => s.id === t.setor_id);
            alerts.push({
              tipo: 'atraso',
              titulo: `OP ${op.numero_op} parada há ${Math.round(horasDesde)}h`,
              descricao: `Setor ${setor?.nome || '?'} com entrada há mais de 24h sem baixa.`,
              sugestao: 'Verificar e registrar baixa',
              prioridade: 'alta',
            });
          }
        }
      });
    });
    if (alerts.length === 0) {
      alerts.push({
        tipo: 'tendencia',
        titulo: 'Fluxo normal de produção',
        descricao: 'Nenhuma OP parada ou com atraso detectado.',
        sugestao: 'Manter ritmo atual',
        prioridade: 'baixa',
      });
    }
    return alerts;
  }, [ops, tracking, setores]);

  const alertaIconConfig: Record<string, { icon: any; color: string; bg: string }> = {
    atraso: { icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10' },
    gargalo: { icon: Clock, color: 'text-warning', bg: 'bg-warning/10' },
    tendencia: { icon: TrendingUp, color: 'text-success', bg: 'bg-success/10' },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-cip" />
        <span className="ml-3 text-muted-foreground">Carregando rastreamento...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Aviso */}
      <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg flex items-center gap-3">
        <Eye className="h-5 w-5 text-primary" />
        <div>
          <p className="text-sm font-medium text-foreground">Modo Rastreamento – Visualização em Tempo Real</p>
          <p className="text-xs text-muted-foreground">Status atualizado automaticamente. Para entrada/baixa, use a aba PCP.</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por OP ou produto..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 text-center">
          <p className="text-2xl font-bold text-primary">{ops.length}</p>
          <p className="text-xs text-muted-foreground">Total Rastreadas</p>
        </div>
        <div className="rounded-xl border border-success/30 bg-success/10 p-4 text-center">
          <p className="text-2xl font-bold text-success">{emProducaoCount}</p>
          <p className="text-xs text-muted-foreground">Em Produção</p>
        </div>
        <div className="rounded-xl border border-warning/30 bg-warning/10 p-4 text-center">
          <p className="text-2xl font-bold text-warning">{programadaCount}</p>
          <p className="text-xs text-muted-foreground">Programadas</p>
        </div>
        <div className="rounded-xl border border-cip/30 bg-cip/10 p-4 text-center">
          <p className="text-2xl font-bold text-cip">{finalizadaCount}</p>
          <p className="text-xs text-muted-foreground">Finalizadas</p>
        </div>
      </div>

      {/* Grid: Rastreamento + Alertas IA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pedidos */}
        <div className="lg:col-span-2 rounded-xl border border-border/30 bg-card/80 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-display font-bold text-foreground">OPs Rastreadas</h3>
            </div>
            <span className="text-xs text-muted-foreground">{filteredOps.length} resultados</span>
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {filteredOps.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhuma OP encontrada</p>
            ) : filteredOps.map((op) => {
              const progresso = getOpProgress(op.id);
              const progressColor = progresso >= 80 ? 'bg-primary' : progresso >= 50 ? 'bg-warning' : 'bg-muted-foreground';
              const st = (statusConfig as any)[op.status_producao] || { label: op.status_producao, color: 'bg-secondary' };
              const isSelected = selectedOpId === op.id;

              return (
                <div
                  key={op.id}
                  className={cn(
                    'rounded-xl border p-4 transition-all duration-300 cursor-pointer',
                    isSelected ? 'border-primary bg-primary/5' : 'border-border/30 hover:border-primary/30'
                  )}
                  onClick={() => setSelectedOpId(isSelected ? null : op.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-foreground">{op.numero_op}</span>
                      </div>
                      <h3 className="font-display font-bold text-foreground mt-1">{op.produto_nome}</h3>
                      <p className="text-xs text-muted-foreground">Qtd: {op.quantidade}</p>
                    </div>
                    <div className="text-right">
                      <Badge className={cn('text-xs', st.color)}>{st.label}</Badge>
                      <p className={cn('text-2xl font-bold mt-1', progresso >= 80 ? 'text-primary' : progresso >= 50 ? 'text-warning' : 'text-foreground')}>
                        {progresso}%
                      </p>
                    </div>
                  </div>

                  <div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div className={cn('h-full rounded-full transition-all duration-500', progressColor)} style={{ width: `${progresso}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground text-right mt-1">Setor: {op.current_sector || 'Aguardando'}</p>
                  </div>

                  {/* Expanded: sector-by-sector */}
                  {isSelected && (
                    <div className="mt-4 pt-4 border-t border-border/30">
                      <h4 className="text-sm font-medium text-foreground mb-3">Etapas de Produção</h4>
                      <div className="space-y-2">
                        {setores.map((setor, idx) => {
                          const track = tracking.find(t => t.op_id === op.id && t.setor_id === setor.id);
                          const etapaStatus = track?.status === 'baixa' ? 'concluido' : track?.status === 'entrada' ? 'em_andamento' : 'pendente';
                          const entrada = track?.data_entrada ? new Date(track.data_entrada) : null;
                          const baixa = track?.data_baixa ? new Date(track.data_baixa) : null;
                          const tempoMin = entrada && baixa ? Math.round((baixa.getTime() - entrada.getTime()) / 60000) : null;

                          return (
                            <div key={setor.id} className="flex items-center gap-3">
                              <div className={cn(
                                'w-6 h-6 rounded-full flex items-center justify-center',
                                etapaStatus === 'concluido' ? 'bg-success text-success-foreground' :
                                etapaStatus === 'em_andamento' ? 'bg-warning text-warning-foreground' :
                                'bg-secondary text-muted-foreground'
                              )}>
                                {etapaStatus === 'concluido' ? <CheckCircle className="h-4 w-4" /> :
                                 etapaStatus === 'em_andamento' ? <Clock className="h-3 w-3" /> :
                                 <span className="text-xs">{idx + 1}</span>}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <span className={cn('text-sm', etapaStatus === 'pendente' ? 'text-muted-foreground' : 'text-foreground')}>
                                    {setor.nome}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {etapaStatus === 'concluido' && tempoMin ? `${tempoMin}min` :
                                     etapaStatus === 'em_andamento' && entrada ? `Desde ${entrada.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` :
                                     '—'}
                                  </span>
                                </div>
                                {etapaStatus === 'em_andamento' && (
                                  <div className="h-1 bg-secondary rounded-full mt-1 overflow-hidden">
                                    <div className="h-full bg-warning rounded-full w-1/2 animate-pulse" />
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Alertas IA */}
        <div className="rounded-xl border border-border/30 bg-card/80 p-4">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="h-5 w-5 text-cip" />
            <h3 className="font-display font-bold text-foreground">Alertas IA</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Alertas automáticos baseados em dados reais de produção.
          </p>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {alertasIA.map((alerta, idx) => {
              const config = alertaIconConfig[alerta.tipo] || alertaIconConfig.tendencia;
              const Icon = config.icon;
              return (
                <div key={idx} className={cn('p-3 rounded-lg border', config.bg, 'border-opacity-30')}>
                  <div className="flex items-start gap-3">
                    <Icon className={cn('h-4 w-4 mt-0.5', config.color)} />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-foreground">{alerta.titulo}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{alerta.descricao}</p>
                      <div className="mt-2 p-2 bg-secondary/50 rounded text-xs">
                        <span className="flex items-center gap-1">
                          <Lightbulb className="h-3 w-3 text-warning" />
                          <strong>Sugestão:</strong> {alerta.sugestao}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 p-3 bg-warning/10 border border-warning/30 rounded-lg">
            <p className="text-xs text-warning">⚠️ A IA analisa e sugere, mas <strong>NÃO executa ações automaticamente</strong>.</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pt-4 border-t border-border/30">
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold">Modelo Industrial CIP</span> — João José Head de Freitas
        </p>
      </div>
    </div>
  );
}
