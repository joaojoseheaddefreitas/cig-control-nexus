import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { KPICard } from '@/components/ui/KPICard';
import {
  RefreshCw, Factory, Printer, PackagePlus, Zap, AlertTriangle,
  CheckCircle2, PlayCircle, Clock, Gauge, Package, Calendar,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { getOPDisplayMask } from '@/services/aprovacaoService';
import { imprimirOP } from '@/services/printService';
import {
  fetchSetores,
  handleSetorClick,
  type SetorProdutivo,
} from '@/services/setorTrackingService';
import {
  fetchCargas, calcularGargalo, emitirCargaManual, emitirCargaAutomatica,
  imprimirCarga, type Carga, type GargaloResult,
} from '@/services/cargaService';

interface OPRow {
  id: string;
  numero_op: string;
  produto_nome: string;
  quantidade: number;
  tempo_total: number | null;
  tempo_unitario: number;
  status_producao: string;
  carga_id: string | null;
  sequence_number: number | null;
  total_ops_at_generation: number | null;
  prazo_entrega: string | null;
  current_sector: string | null;
  data_programada: string | null;
  sequencia_programada: number | null;
  rastreamento?: { setor_id: string; status: string }[];
}

type SectionId = 'dashboard' | 'grade' | 'programacao' | 'producao';

export function CIPPCPControle() {
  const [ops, setOps] = useState<OPRow[]>([]);
  const [setores, setSetores] = useState<SetorProdutivo[]>([]);
  const [cargas, setCargas] = useState<Carga[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [gargalo, setGargalo] = useState<GargaloResult[]>([]);
  const [emitting, setEmitting] = useState(false);
  const [dataProgramada, setDataProgramada] = useState(new Date().toISOString().split('T')[0]);
  const [collapsedSections, setCollapsedSections] = useState<Set<SectionId>>(new Set());

  const toggleSection = (id: SectionId) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    const [setoresData, cargasData, opsResult] = await Promise.all([
      fetchSetores(),
      fetchCargas(),
      supabase
        .from('ops')
        .select('id, numero_op, produto_nome, quantidade, tempo_total, tempo_unitario, status_producao, carga_id, sequence_number, total_ops_at_generation, prazo_entrega, current_sector, data_programada, sequencia_programada')
        .neq('status_producao', 'Producao Finalizada')
        .order('sequencia_fila'),
    ]);

    setSetores(setoresData);
    setCargas(cargasData);
    const opsData = (opsResult.data || []) as OPRow[];

    // Fetch tracking for all OPs
    const opIds = opsData.map(o => o.id);
    if (opIds.length > 0) {
      const { data: tracking } = await supabase
        .from('setor_rastreamento')
        .select('op_id, setor_id, status')
        .in('op_id', opIds);

      opsData.forEach(op => {
        op.rastreamento = (tracking || [])
          .filter(t => t.op_id === op.id)
          .map(t => ({ setor_id: t.setor_id, status: t.status }));
      });
    }

    setOps(opsData);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel('pcp-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ops' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'setor_rastreamento' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cargas' }, () => loadData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadData]);

  // Gargalo analysis
  useEffect(() => {
    if (selected.size > 0) {
      calcularGargalo(Array.from(selected)).then(setGargalo);
    } else {
      setGargalo([]);
    }
  }, [selected]);

  // === HANDLERS ===
  const handleCellClick = async (opId: string, setorId: string) => {
    setProcessing(`${opId}-${setorId}`);
    const result = await handleSetorClick(opId, setorId, setores);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(result.newStatus === 'entrada' ? '🟡 Entrada registrada' : '🟢 Baixa registrada');
      await loadData();
    }
    setProcessing(null);
  };

  const toggleSelect = (opId: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(opId)) next.delete(opId); else next.add(opId);
      return next;
    });
  };

  const handleMontarCarga = async () => {
    if (selected.size === 0) return;
    const overLimit = gargalo.some(g => g.percentual >= 100);
    if (overLimit) {
      toast.error('Emissão bloqueada: capacidade excedida');
      return;
    }
    setEmitting(true);

    // Set data_programada on selected OPs
    const ids = Array.from(selected);
    await supabase.from('ops').update({
      data_programada: dataProgramada,
      status_producao: 'programada',
    } as any).in('id', ids);

    // Set sequencia_programada
    for (let i = 0; i < ids.length; i++) {
      await supabase.from('ops').update({ sequencia_programada: i + 1 } as any).eq('id', ids[i]);
    }

    // Emit carga
    const result = await emitirCargaManual(ids);
    if (result.error) toast.error(result.error);
    else {
      toast.success(`✅ Carga montada: ${ids.length} OPs para ${new Date(dataProgramada).toLocaleDateString('pt-BR')}`);
      setSelected(new Set());
      await loadData();
    }
    setEmitting(false);
  };

  const handleCargaAutomatica = async () => {
    setEmitting(true);
    const result = await emitirCargaAutomatica();
    if (result.error) toast.error(result.error);
    else {
      toast.success(`Carga automática: ${result.opsCount} OPs`);
      await loadData();
    }
    setEmitting(false);
  };

  // === DERIVED DATA ===
  const getCellStatus = (op: OPRow, setorId: string): 'pendente' | 'entrada' | 'baixa' => {
    const track = op.rastreamento?.find(t => t.setor_id === setorId);
    if (!track || track.status === 'pendente') return 'pendente';
    return track.status as 'entrada' | 'baixa';
  };

  const getCellClass = (status: 'pendente' | 'entrada' | 'baixa') => {
    switch (status) {
      case 'baixa': return 'bg-success/30 border-success/50 text-success cursor-default';
      case 'entrada': return 'bg-warning/30 border-warning/50 text-warning cursor-pointer hover:bg-warning/40';
      default: return 'bg-secondary/30 border-border/30 text-muted-foreground cursor-pointer hover:bg-secondary/50';
    }
  };

  const getCellLabel = (status: 'pendente' | 'entrada' | 'baixa') => {
    switch (status) { case 'baixa': return '✓'; case 'entrada': return '▶'; default: return '—'; }
  };

  const pendingOps = ops.filter(o => !o.data_programada && o.status_producao === 'aguardando');
  const programmedOps = ops.filter(o => o.data_programada || o.status_producao === 'em_producao' || o.status_producao === 'programada');
  const totalHoras = ops.reduce((s, o) => s + Number(o.tempo_total || 0), 0);
  const opsPendentes = ops.filter(o => o.status_producao === 'aguardando').length;
  const opsEmProducao = ops.filter(o => o.status_producao === 'em_producao').length;

  // Capacity per sector
  const cargaPorSetor = setores.map(s => {
    const opsNoSetor = ops.filter(op => {
      const track = op.rastreamento?.find(t => t.setor_id === s.id);
      return track?.status === 'entrada';
    });
    const horas = opsNoSetor.reduce((sum, op) => sum + Number(op.tempo_total || 0), 0);
    return { setorId: s.id, nome: s.nome, horas, count: opsNoSetor.length };
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-cip" />
        <span className="ml-3 text-muted-foreground">Carregando PCP...</span>
      </div>
    );
  }

  const SectionHeader = ({ id, title, icon: Icon, badge }: { id: SectionId; title: string; icon: any; badge?: string }) => (
    <button
      onClick={() => toggleSection(id)}
      className="w-full flex items-center justify-between p-3 rounded-lg bg-card/80 border border-border/30 hover:bg-secondary/30 transition-colors"
    >
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-cip" />
        <span className="font-display font-bold text-foreground text-sm">{title}</span>
        {badge && <Badge variant="outline" className="text-[10px]">{badge}</Badge>}
      </div>
      {collapsedSections.has(id) ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronUp className="h-4 w-4 text-muted-foreground" />}
    </button>
  );

  return (
    <div className="space-y-4 animate-fade-in">
      {/* ═══════════════════════ DASHBOARD KPIs ═══════════════════════ */}
      <SectionHeader id="dashboard" title="Painel de Capacidade" icon={Gauge} />
      {!collapsedSections.has('dashboard') && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <KPICard title="Total Horas" value={`${totalHoras.toFixed(1)}h`} subtitle="Em carteira" icon={<Clock className="h-5 w-5" />} variant="cip" />
          <KPICard title="OPs Pendentes" value={opsPendentes} subtitle="Aguardando programação" icon={<Package className="h-5 w-5" />} variant="cip" />
          <KPICard title="Em Produção" value={opsEmProducao} subtitle="No chão de fábrica" icon={<Factory className="h-5 w-5" />} variant="cip" />
          <KPICard title="Programadas" value={programmedOps.length} subtitle="Com data definida" icon={<Calendar className="h-5 w-5" />} variant="cip" />
          <KPICard title="Cargas Ativas" value={cargas.filter(c => c.status !== 'FINALIZADA').length} subtitle="PLANEJADA + EM_EXECUCAO" icon={<Gauge className="h-5 w-5" />} variant="cip" />
        </div>
      )}

      {/* Capacity per sector strip */}
      {!collapsedSections.has('dashboard') && (
        <div className="flex gap-2 flex-wrap">
          {cargaPorSetor.map(s => (
            <Badge key={s.setorId} variant="outline" className="text-xs">
              {s.nome.substring(0, 12)}: {s.count} OPs / {s.horas.toFixed(1)}h
            </Badge>
          ))}
        </div>
      )}

      {/* ═══════════════════ PROGRAMAÇÃO / MONTAGEM DE CARGA ═══════════════════ */}
      <SectionHeader id="programacao" title="Programação — Montar Carga do Dia" icon={PackagePlus} badge={`${pendingOps.length} pendentes`} />
      {!collapsedSections.has('programacao') && (
        <div className="space-y-3">
          {/* Actions bar */}
          <div className="flex items-center justify-between flex-wrap gap-2 p-3 rounded-lg border border-border/30 bg-card/60">
            <div className="flex items-center gap-2">
              <Input
                type="date"
                className="w-auto h-8 text-xs"
                value={dataProgramada}
                onChange={e => setDataProgramada(e.target.value)}
              />
              <Button size="sm" className="bg-cip hover:bg-cip/90 h-8 text-xs" onClick={handleMontarCarga} disabled={emitting || selected.size === 0}>
                <PackagePlus className="h-3.5 w-3.5 mr-1" /> Montar Carga ({selected.size})
              </Button>
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleCargaAutomatica} disabled={emitting}>
                <Zap className="h-3.5 w-3.5 mr-1" /> Automática
              </Button>
            </div>
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={loadData}>
              <RefreshCw className="h-3.5 w-3.5 mr-1" /> Atualizar
            </Button>
          </div>

          {/* Gargalo */}
          {gargalo.length > 0 && (
            <div className="p-3 rounded-lg border border-border/30 bg-card/60 space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" /> Análise de Gargalo — {selected.size} OPs
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
                {gargalo.map(g => (
                  <div key={g.setor_id} className="p-2 rounded border border-border/30 bg-secondary/20">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] font-medium truncate">{g.setor_nome}</span>
                      <span className={cn("text-[10px] font-bold", g.percentual >= 100 ? "text-destructive" : g.percentual >= 80 ? "text-warning" : "text-success")}>
                        {g.percentual.toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={Math.min(g.percentual, 100)} className={cn("h-1.5", g.percentual >= 100 ? "[&>div]:bg-destructive" : g.percentual >= 80 ? "[&>div]:bg-warning" : "[&>div]:bg-success")} />
                    <div className="flex justify-between text-[9px] text-muted-foreground mt-0.5">
                      <span>{g.horas_necessarias.toFixed(1)}h</span>
                      <span>{g.capacidade_liquida.toFixed(1)}h cap</span>
                    </div>
                  </div>
                ))}
              </div>
              {gargalo.some(g => g.percentual >= 100) && (
                <p className="text-[10px] text-destructive font-medium">🔴 Emissão bloqueada — reduza OPs ou aumente capacidade.</p>
              )}
            </div>
          )}

          {/* Cargas ativas */}
          {cargas.filter(c => c.status !== 'FINALIZADA').length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {cargas.filter(c => c.status !== 'FINALIZADA').map(c => (
                <div key={c.id} className="flex items-center gap-2 p-2 rounded-lg border border-border/30 bg-card/80 text-xs">
                  {c.status === 'EM_EXECUCAO'
                    ? <Badge className="bg-warning/20 text-warning text-[10px]"><PlayCircle className="h-3 w-3 mr-0.5" />Exec</Badge>
                    : <Badge className="bg-primary/20 text-primary text-[10px]"><Clock className="h-3 w-3 mr-0.5" />Plan</Badge>
                  }
                  <span className="text-muted-foreground">{new Date(c.data_emissao).toLocaleDateString('pt-BR')}</span>
                  <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => imprimirCarga(c.id)}><Printer className="h-3 w-3" /></Button>
                </div>
              ))}
            </div>
          )}

          {/* OPs pendentes para programação */}
          <div className="rounded-xl border border-border/30 bg-card/80 max-h-[350px] overflow-y-auto overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 z-10 bg-secondary/80 backdrop-blur-sm">
                <tr className="border-b border-border/50">
                  <th className="py-2 px-2 w-8">
                    <Checkbox
                      checked={pendingOps.length > 0 && selected.size === pendingOps.length}
                      onCheckedChange={() => {
                        if (selected.size === pendingOps.length) setSelected(new Set());
                        else setSelected(new Set(pendingOps.map(o => o.id)));
                      }}
                    />
                  </th>
                  <th className="text-left py-2 px-2 font-medium text-muted-foreground">OP / Produto</th>
                  <th className="text-center py-2 px-1 font-medium text-muted-foreground">Qtd</th>
                  <th className="text-center py-2 px-1 font-medium text-muted-foreground">Hrs</th>
                  <th className="text-center py-2 px-1 font-medium text-muted-foreground">Prazo</th>
                  <th className="text-center py-2 px-1 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {pendingOps.length === 0 ? (
                  <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">Nenhuma OP pendente para programação</td></tr>
                ) : pendingOps.map(op => {
                  const mask = getOPDisplayMask(op.numero_op, op.sequence_number, op.total_ops_at_generation);
                  return (
                    <tr key={op.id} className={cn("border-b border-border/30 hover:bg-secondary/20", selected.has(op.id) && "bg-cip/5")}>
                      <td className="py-1.5 px-2"><Checkbox checked={selected.has(op.id)} onCheckedChange={() => toggleSelect(op.id)} /></td>
                      <td className="py-1.5 px-2">
                        <div className="font-mono font-bold text-foreground">{mask}</div>
                        <div className="text-muted-foreground truncate max-w-[180px]">{op.produto_nome}</div>
                      </td>
                      <td className="text-center py-1.5 px-1 font-bold">{op.quantidade}</td>
                      <td className="text-center py-1.5 px-1 font-bold text-cip">{Number(op.tempo_total || 0).toFixed(1)}</td>
                      <td className="text-center py-1.5 px-1 text-muted-foreground">{op.prazo_entrega ? new Date(op.prazo_entrega).toLocaleDateString('pt-BR') : '—'}</td>
                      <td className="text-center py-1.5 px-1"><Badge variant="outline" className="text-[10px]">Pendente</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════════════ PRODUÇÃO / BAIXAS POR SETOR ═══════════════════ */}
      <SectionHeader id="producao" title="Produção — Apontamento por Setor" icon={Factory} badge={`${opsEmProducao} em produção`} />
      {!collapsedSections.has('producao') && (
        <div className="space-y-3">
          {/* Legend */}
          <div className="flex gap-4 text-xs">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-secondary/30 border border-border/30" /><span className="text-muted-foreground">Pendente</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-warning/30 border border-warning/50" /><span className="text-muted-foreground">Entrada 🟡</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-success/30 border border-success/50" /><span className="text-muted-foreground">Baixa 🟢</span></div>
          </div>
          <p className="text-[10px] text-muted-foreground">1º Clique = Entrada → 2º Clique = Baixa (Total) — Sequencial obrigatório. OP indivisível.</p>

          {/* Tracking Grid */}
          <div className="rounded-xl border border-border/30 bg-card/80 max-h-[500px] overflow-y-auto overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 z-10 bg-secondary/80 backdrop-blur-sm">
                <tr className="border-b border-border/50">
                  <th className="text-left py-2 px-2 font-medium text-muted-foreground sticky left-0 bg-secondary/80 z-20 min-w-[150px]">OP / Produto</th>
                  <th className="text-center py-2 px-1 font-medium text-muted-foreground min-w-[35px]">Qtd</th>
                  <th className="text-center py-2 px-1 font-medium text-muted-foreground min-w-[35px]">Hrs</th>
                  <th className="text-center py-2 px-1 font-medium text-muted-foreground min-w-[55px]">Data Prog</th>
                  {setores.map(s => (
                    <th key={s.id} className="text-center py-2 px-1 font-medium text-muted-foreground min-w-[48px]">
                      <span className="block truncate" title={s.nome}>{s.nome.substring(0, 6)}</span>
                    </th>
                  ))}
                  <th className="text-center py-2 px-1 font-medium text-muted-foreground w-8">🖨</th>
                </tr>
              </thead>
              <tbody>
                {programmedOps.length === 0 ? (
                  <tr><td colSpan={4 + setores.length + 1} className="py-8 text-center text-muted-foreground">
                    <Factory className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    Nenhuma OP programada ou em produção. Monte uma carga acima.
                  </td></tr>
                ) : programmedOps.map(op => {
                  const mask = getOPDisplayMask(op.numero_op, op.sequence_number, op.total_ops_at_generation);
                  return (
                    <tr key={op.id} className="border-b border-border/30 hover:bg-secondary/20">
                      <td className="py-1.5 px-2 sticky left-0 bg-card/80 z-10">
                        <div className="font-mono font-bold text-foreground">{mask}</div>
                        <div className="text-muted-foreground truncate max-w-[140px]">{op.produto_nome}</div>
                      </td>
                      <td className="text-center py-1.5 px-1 font-bold">{op.quantidade}</td>
                      <td className="text-center py-1.5 px-1 font-bold text-cip">{Number(op.tempo_total || 0).toFixed(1)}</td>
                      <td className="text-center py-1.5 px-1 text-muted-foreground text-[10px]">
                        {op.data_programada ? new Date(op.data_programada).toLocaleDateString('pt-BR') : '—'}
                      </td>
                      {setores.map(s => {
                        const status = getCellStatus(op, s.id);
                        const isProcessing = processing === `${op.id}-${s.id}`;
                        return (
                          <td key={s.id} className="text-center py-1 px-0.5">
                            <button
                              onClick={() => status !== 'baixa' && handleCellClick(op.id, s.id)}
                              disabled={isProcessing || status === 'baixa'}
                              className={cn(
                                'w-9 h-7 rounded border text-[10px] font-bold transition-all',
                                getCellClass(status),
                                isProcessing && 'animate-pulse'
                              )}
                              title={`${mask} → ${s.nome}: ${status}`}
                            >
                              {isProcessing ? '...' : getCellLabel(status)}
                            </button>
                          </td>
                        );
                      })}
                      <td className="text-center py-1 px-0.5">
                        <button onClick={() => imprimirOP(op.id)} className="text-muted-foreground hover:text-foreground" title="Imprimir OP">
                          <Printer className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
