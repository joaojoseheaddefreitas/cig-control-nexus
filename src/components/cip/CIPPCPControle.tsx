import { useState, useEffect, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  RefreshCw, Factory, Printer, PackagePlus, Zap, AlertTriangle,
  CheckCircle2, Clock, Gauge, Package, Calendar, ArrowRight,
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
  fetchCargas, calcularGargalo, emitirCargaManual,
  imprimirCarga, type Carga, type GargaloResult,
} from '@/services/cargaService';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Cell, ComposedChart, Line,
} from 'recharts';

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
  pedido_id: string | null;
  rastreamento?: { setor_id: string; status: string }[];
}

interface SetorComCapacidade extends SetorProdutivo {
  mao_de_obra: number;
  horas_turno: number;
  eficiencia: number;
  maquinas_automaticas: number;
}

export function CIPPCPControle() {
  const [ops, setOps] = useState<OPRow[]>([]);
  const [setores, setSetores] = useState<SetorComCapacidade[]>([]);
  const [cargas, setCargas] = useState<Carga[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [emitting, setEmitting] = useState(false);
  const [dataProgramada, setDataProgramada] = useState(new Date().toISOString().split('T')[0]);
  const [dataFiltro, setDataFiltro] = useState(new Date().toISOString().split('T')[0]);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [setoresResult, cargasData, opsResult] = await Promise.all([
      supabase.from('setores_produtivos').select('*').eq('ativo', true).order('ordem'),
      fetchCargas(),
      supabase
        .from('ops')
        .select('id, numero_op, produto_nome, quantidade, tempo_total, tempo_unitario, status_producao, carga_id, sequence_number, total_ops_at_generation, prazo_entrega, current_sector, data_programada, sequencia_programada, pedido_id')
        .neq('status_producao', 'Producao Finalizada')
        .order('sequencia_programada', { ascending: true, nullsFirst: true }),
    ]);

    const setoresData = (setoresResult.data || []) as SetorComCapacidade[];
    setSetores(setoresData);
    setCargas(cargasData);
    const opsData = (opsResult.data || []) as OPRow[];

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

  useEffect(() => {
    const channel = supabase
      .channel('pcp-unified')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ops' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'setor_rastreamento' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cargas' }, () => loadData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadData]);

  // === CAPACITY CALCULATION (memoized) ===
  const capacidadePorSetor = useMemo(() => {
    return setores.map(setor => {
      const capacidadeTotal = (setor.mao_de_obra + setor.maquinas_automaticas) * setor.horas_turno * setor.eficiencia;
      
      // Sum hours for OPs that are PROGRAMADA or EM_PRODUCAO for the selected date
      const opsDoSetor = ops.filter(op => {
        if (op.status_producao !== 'programada' && op.status_producao !== 'em_producao') return false;
        if (dataFiltro && op.data_programada !== dataFiltro) return false;
        // Check if this OP has a route step in this sector (via rastreamento or route_steps)
        return true; // We'll refine with route steps
      });

      const horasOcupadas = opsDoSetor.reduce((sum, op) => sum + Number(op.tempo_total || 0), 0);
      const percentual = capacidadeTotal > 0 ? (horasOcupadas / capacidadeTotal) * 100 : 0;
      const horasLivres = Math.max(0, capacidadeTotal - horasOcupadas);

      return {
        id: setor.id,
        nome: setor.nome,
        capacidadeTotal,
        horasOcupadas,
        horasLivres,
        percentual,
      };
    });
  }, [setores, ops, dataFiltro]);

  const isOverCapacity = useCallback(() => {
    return capacidadePorSetor.some(s => s.percentual >= 100);
  }, [capacidadePorSetor]);

  const getCapacityColor = (pct: number) => {
    if (pct === 0) return { bg: 'bg-primary/20', bar: 'bg-primary', text: 'text-primary', label: 'LIVRE' };
    if (pct < 80) return { bg: 'bg-success/20', bar: 'bg-success', text: 'text-success', label: 'OK' };
    if (pct < 100) return { bg: 'bg-warning/20', bar: 'bg-warning', text: 'text-warning', label: 'ALTO' };
    return { bg: 'bg-destructive/20', bar: 'bg-destructive', text: 'text-destructive', label: 'GARGALO' };
  };

  const getCapacityFill = (pct: number) => {
    if (pct === 0) return 'hsl(215, 80%, 50%)';
    if (pct < 80) return 'hsl(145, 70%, 42%)';
    if (pct < 100) return 'hsl(45, 95%, 50%)';
    return 'hsl(0, 72%, 51%)';
  };

  // Max gargalo
  const gargaloMax = useMemo(() => {
    if (capacidadePorSetor.length === 0) return null;
    return capacidadePorSetor.reduce((max, s) => s.percentual > max.percentual ? s : max, capacidadePorSetor[0]);
  }, [capacidadePorSetor]);

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
    if (isOverCapacity()) {
      toast.error('🔴 Emissão bloqueada: capacidade excedida em algum setor');
      return;
    }
    setEmitting(true);

    const ids = Array.from(selected);
    
    // Get current max sequencia for this date
    const existingProgrammed = ops.filter(o => o.data_programada === dataProgramada && o.sequencia_programada);
    const maxSeq = existingProgrammed.length > 0 
      ? Math.max(...existingProgrammed.map(o => o.sequencia_programada || 0)) 
      : 0;

    // Update each OP with date and sequence
    for (let i = 0; i < ids.length; i++) {
      await supabase.from('ops').update({
        data_programada: dataProgramada,
        sequencia_programada: maxSeq + i + 1,
        status_producao: 'programada',
      } as any).eq('id', ids[i]);
    }

    const result = await emitirCargaManual(ids);
    if (result.error) toast.error(result.error);
    else {
      toast.success(`✅ Carga montada: ${ids.length} OPs para ${new Date(dataProgramada + 'T12:00:00').toLocaleDateString('pt-BR')}`);
      setSelected(new Set());
      await loadData();
    }
    setEmitting(false);
  };

  const handleRemoverDaCarga = async (opId: string) => {
    await supabase.from('ops').update({
      data_programada: null,
      sequencia_programada: null,
      status_producao: 'aguardando',
      carga_id: null,
    } as any).eq('id', opId);
    toast.success('OP removida da carga, voltou para PENDENTE');
    await loadData();
  };

  // === DERIVED DATA ===
  const getCellStatus = (op: OPRow, setorId: string): 'pendente' | 'entrada' | 'baixa' => {
    const track = op.rastreamento?.find(t => t.setor_id === setorId);
    if (!track || track.status === 'pendente') return 'pendente';
    return track.status as 'entrada' | 'baixa';
  };

  const pendingOps = ops.filter(o => !o.data_programada && (o.status_producao === 'aguardando' || o.status_producao === 'PENDENTE'));
  const programmedOps = ops.filter(o => {
    if (!o.data_programada) return false;
    if (dataFiltro && o.data_programada !== dataFiltro) return false;
    return true;
  }).sort((a, b) => (a.sequencia_programada || 999) - (b.sequencia_programada || 999));

  const totalHoras = ops.reduce((s, o) => s + Number(o.tempo_total || 0), 0);
  const opsPendentes = pendingOps.length;
  const opsEmProducao = ops.filter(o => o.status_producao === 'em_producao').length;
  const opsProgramadas = ops.filter(o => o.status_producao === 'programada').length;

  // Chart data for capacity
  const chartCapacidade = useMemo(() => {
    return capacidadePorSetor.map(s => ({
      setor: s.nome.length > 10 ? s.nome.substring(0, 10) + '…' : s.nome,
      ocupacao: Math.round(s.percentual),
      capacidade: Math.round(s.capacidadeTotal),
      horasOcupadas: Number(s.horasOcupadas.toFixed(1)),
      horasLivres: Number(s.horasLivres.toFixed(1)),
      pct: s.percentual,
    }));
  }, [capacidadePorSetor]);

  // Chart data for load composition
  const chartCarga = useMemo(() => {
    return capacidadePorSetor.map(s => ({
      setor: s.nome.length > 10 ? s.nome.substring(0, 10) + '…' : s.nome,
      programada: Number(s.horasOcupadas.toFixed(1)),
      capacidadeMax: Number(s.capacidadeTotal.toFixed(1)),
    }));
  }, [capacidadePorSetor]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-cip" />
        <span className="ml-3 text-muted-foreground">Carregando PCP...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* ═══════════════════ ZONA SUPERIOR – PAINEL DE CAPACIDADE ═══════════════════ */}
      <div className="space-y-3">
        {/* KPI Summary Row */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border/30 bg-card/80">
            <Package className="h-4 w-4 text-cip" />
            <span className="text-xs text-muted-foreground">Pendentes:</span>
            <span className="text-sm font-bold text-foreground">{opsPendentes}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border/30 bg-card/80">
            <Factory className="h-4 w-4 text-warning" />
            <span className="text-xs text-muted-foreground">Em Produção:</span>
            <span className="text-sm font-bold text-foreground">{opsEmProducao}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border/30 bg-card/80">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground">Programadas:</span>
            <span className="text-sm font-bold text-foreground">{opsProgramadas}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border/30 bg-card/80">
            <Clock className="h-4 w-4 text-cip" />
            <span className="text-xs text-muted-foreground">Total Horas:</span>
            <span className="text-sm font-bold text-cip">{totalHoras.toFixed(1)}h</span>
          </div>
          <Button variant="outline" size="sm" className="h-8 text-xs ml-auto" onClick={loadData}>
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Atualizar
          </Button>
        </div>

        {/* GRID HORIZONTAL COMPACTO – Cards de Setor */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-10 gap-2 w-full">
          {capacidadePorSetor.map(setor => {
            const colors = getCapacityColor(setor.percentual);
            const isGargalo = gargaloMax?.id === setor.id && setor.percentual > 0;
            return (
              <div
                key={setor.id}
                className={cn(
                  'relative rounded-lg border p-2 transition-all max-h-[90px] overflow-hidden',
                  colors.bg,
                  isGargalo ? 'border-destructive/60 ring-1 ring-destructive/30' : 'border-border/30',
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-medium text-foreground truncate leading-tight" title={setor.nome}>
                    {setor.nome.length > 12 ? setor.nome.substring(0, 12) + '…' : setor.nome}
                  </span>
                  {isGargalo && <AlertTriangle className="h-3 w-3 text-destructive flex-shrink-0" />}
                </div>
                <div className={cn('text-xl font-display font-bold leading-none', colors.text)}>
                  {Math.round(setor.percentual)}%
                </div>
                {/* Progress bar */}
                <div className="h-1.5 bg-secondary/50 rounded-full mt-1.5 overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all', colors.bar)}
                    style={{ width: `${Math.min(100, setor.percentual)}%` }}
                  />
                </div>
                <span className="text-[9px] text-muted-foreground mt-0.5 block">
                  {setor.horasLivres.toFixed(1)}h livres
                </span>
              </div>
            );
          })}
        </div>

        {/* Recharts – Two charts side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Chart 1: Acompanhamento de Produção – Ocupação por setor */}
          <div className="rounded-xl border border-border/30 bg-card/80 p-4">
            <h4 className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
              <Gauge className="h-3.5 w-3.5 text-cip" /> Acompanhamento de Produção
            </h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartCapacidade} layout="vertical" margin={{ left: 70, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 18%, 22%)" horizontal vertical={false} />
                  <XAxis type="number" tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 10 }} axisLine={{ stroke: 'hsl(220, 18%, 22%)' }} />
                  <YAxis type="category" dataKey="setor" tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 10 }} axisLine={{ stroke: 'hsl(220, 18%, 22%)' }} width={68} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(220, 20%, 14%)', border: '1px solid hsl(220, 18%, 22%)', borderRadius: '8px', fontSize: '11px' }}
                    formatter={(value: number, name: string) => {
                      if (name === 'horasOcupadas') return [`${value}h`, 'Horas Ocupadas'];
                      if (name === 'horasLivres') return [`${value}h`, 'Horas Livres'];
                      return [value, name];
                    }}
                  />
                  <Bar dataKey="horasOcupadas" stackId="a" fill="hsl(145, 70%, 42%)" radius={[0, 0, 0, 0]} name="horasOcupadas" />
                  <Bar dataKey="horasLivres" stackId="a" fill="hsl(220, 18%, 25%)" radius={[0, 4, 4, 0]} name="horasLivres" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Montagem de Carga – Programada vs Capacidade Max */}
          <div className="rounded-xl border border-border/30 bg-card/80 p-4">
            <h4 className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
              <PackagePlus className="h-3.5 w-3.5 text-cip" /> Montagem de Carga
            </h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartCarga} layout="vertical" margin={{ left: 70, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 18%, 22%)" horizontal vertical={false} />
                  <XAxis type="number" tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 10 }} axisLine={{ stroke: 'hsl(220, 18%, 22%)' }} />
                  <YAxis type="category" dataKey="setor" tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 10 }} axisLine={{ stroke: 'hsl(220, 18%, 22%)' }} width={68} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(220, 20%, 14%)', border: '1px solid hsl(220, 18%, 22%)', borderRadius: '8px', fontSize: '11px' }}
                    formatter={(value: number, name: string) => {
                      if (name === 'programada') return [`${value}h`, 'Carga Programada'];
                      if (name === 'capacidadeMax') return [`${value}h`, 'Capacidade Máx'];
                      return [value, name];
                    }}
                  />
                  <Bar dataKey="programada" name="programada" radius={[0, 4, 4, 0]}>
                    {chartCarga.map((entry, idx) => (
                      <Cell
                        key={idx}
                        fill={entry.programada > entry.capacidadeMax ? 'hsl(0, 72%, 51%)' : 'hsl(30, 90%, 50%)'}
                      />
                    ))}
                  </Bar>
                  <Line
                    type="step"
                    dataKey="capacidadeMax"
                    stroke="hsl(0, 72%, 51%)"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    name="capacidadeMax"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════ ZONA INFERIOR – GRADE + PROGRAMAÇÃO ═══════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* ZONA ESQUERDA – GRADE DE OPs PENDENTES */}
        <div className="lg:col-span-4 space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-display font-bold text-foreground flex items-center gap-1.5">
              <Package className="h-4 w-4 text-cip" /> Grade de OPs
              <Badge variant="outline" className="text-[10px] ml-1">{pendingOps.length}</Badge>
            </h3>
          </div>

          {/* Action bar */}
          <div className="flex items-center gap-2 flex-wrap p-2 rounded-lg border border-border/30 bg-card/60">
            <Input
              type="date"
              className="w-auto h-7 text-xs"
              value={dataProgramada}
              onChange={e => setDataProgramada(e.target.value)}
            />
            <Button
              size="sm"
              className="bg-cip hover:bg-cip/90 h-7 text-xs"
              onClick={handleMontarCarga}
              disabled={emitting || selected.size === 0 || isOverCapacity()}
            >
              <PackagePlus className="h-3 w-3 mr-1" /> Montar Carga ({selected.size})
            </Button>
          </div>

          {isOverCapacity() && selected.size > 0 && (
            <p className="text-[10px] text-destructive font-medium px-2">🔴 Bloqueado: setor(es) ≥ 100%</p>
          )}

          {/* OP List */}
          <div className="rounded-xl border border-border/30 bg-card/80 max-h-[500px] overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 z-10 bg-secondary/80 backdrop-blur-sm">
                <tr className="border-b border-border/50">
                  <th className="py-2 px-2 w-7">
                    <Checkbox
                      checked={pendingOps.length > 0 && selected.size === pendingOps.length}
                      onCheckedChange={() => {
                        if (selected.size === pendingOps.length) setSelected(new Set());
                        else setSelected(new Set(pendingOps.map(o => o.id)));
                      }}
                    />
                  </th>
                  <th className="text-left py-2 px-1 font-medium text-muted-foreground">Nº OP</th>
                  <th className="text-left py-2 px-1 font-medium text-muted-foreground">Produto</th>
                  <th className="text-center py-2 px-1 font-medium text-muted-foreground">Hrs</th>
                </tr>
              </thead>
              <tbody>
                {pendingOps.length === 0 ? (
                  <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">
                    <CheckCircle2 className="h-6 w-6 mx-auto mb-2 opacity-30" />
                    Nenhuma OP pendente
                  </td></tr>
                ) : pendingOps.map(op => {
                  const mask = getOPDisplayMask(op.numero_op, op.sequence_number, op.total_ops_at_generation);
                  return (
                    <tr
                      key={op.id}
                      className={cn(
                        'border-b border-border/30 hover:bg-secondary/20 cursor-pointer',
                        selected.has(op.id) && 'bg-cip/10'
                      )}
                      onClick={() => toggleSelect(op.id)}
                    >
                      <td className="py-1.5 px-2" onClick={e => e.stopPropagation()}>
                        <Checkbox checked={selected.has(op.id)} onCheckedChange={() => toggleSelect(op.id)} />
                      </td>
                      <td className="py-1.5 px-1 font-mono font-bold text-foreground text-[11px]">{mask}</td>
                      <td className="py-1.5 px-1 text-muted-foreground truncate max-w-[120px]">{op.produto_nome}</td>
                      <td className="text-center py-1.5 px-1 font-bold text-cip">{Number(op.tempo_total || 0).toFixed(1)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ZONA DIREITA – PROGRAMAÇÃO E BAIXAS */}
        <div className="lg:col-span-8 space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-display font-bold text-foreground flex items-center gap-1.5">
              <Factory className="h-4 w-4 text-cip" /> Programação & Baixas
              <Badge variant="outline" className="text-[10px] ml-1">{programmedOps.length} OPs</Badge>
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground">Filtro:</span>
              <Input
                type="date"
                className="w-auto h-7 text-xs"
                value={dataFiltro}
                onChange={e => setDataFiltro(e.target.value)}
              />
            </div>
          </div>

          {/* Legend */}
          <div className="flex gap-4 text-xs px-1">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-secondary/30 border border-border/30" />
              <span className="text-muted-foreground">Pendente —</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-warning/30 border border-warning/50" />
              <span className="text-muted-foreground">Entrada 🟡</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-success/30 border border-success/50" />
              <span className="text-muted-foreground">Baixa 🟢</span>
            </div>
          </div>

          {/* Tracking Grid */}
          <div className="rounded-xl border border-border/30 bg-card/80 max-h-[500px] overflow-y-auto overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 z-10 bg-secondary/80 backdrop-blur-sm">
                <tr className="border-b border-border/50">
                  <th className="text-left py-2 px-2 font-medium text-muted-foreground sticky left-0 bg-secondary/80 z-20 min-w-[130px]">OP / Produto</th>
                  <th className="text-center py-2 px-1 font-medium text-muted-foreground min-w-[30px]">Seq</th>
                  <th className="text-center py-2 px-1 font-medium text-muted-foreground min-w-[35px]">Hrs</th>
                  {setores.map(s => (
                    <th key={s.id} className="text-center py-2 px-1 font-medium text-muted-foreground min-w-[50px]">
                      <span className="block truncate text-[10px]" title={s.nome}>{s.nome.substring(0, 7)}</span>
                    </th>
                  ))}
                  <th className="text-center py-2 px-1 font-medium text-muted-foreground w-14">Ações</th>
                </tr>
              </thead>
              <tbody>
                {programmedOps.length === 0 ? (
                  <tr><td colSpan={3 + setores.length + 1} className="py-8 text-center text-muted-foreground">
                    <Factory className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    Nenhuma OP programada para {new Date(dataFiltro + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </td></tr>
                ) : programmedOps.map(op => {
                  const mask = getOPDisplayMask(op.numero_op, op.sequence_number, op.total_ops_at_generation);
                  return (
                    <tr key={op.id} className="border-b border-border/30 hover:bg-secondary/20">
                      <td className="py-1.5 px-2 sticky left-0 bg-card/80 z-10">
                        <div className="font-mono font-bold text-foreground text-[11px]">{mask}</div>
                        <div className="text-muted-foreground truncate max-w-[120px]">{op.produto_nome}</div>
                      </td>
                      <td className="text-center py-1.5 px-1 font-bold text-primary">{op.sequencia_programada || '—'}</td>
                      <td className="text-center py-1.5 px-1 font-bold text-cip">{Number(op.tempo_total || 0).toFixed(1)}</td>
                      {setores.map(s => {
                        const status = getCellStatus(op, s.id);
                        const isProc = processing === `${op.id}-${s.id}`;
                        return (
                          <td key={s.id} className="text-center py-1 px-0.5">
                            <button
                              onClick={() => status !== 'baixa' && handleCellClick(op.id, s.id)}
                              disabled={isProc || status === 'baixa'}
                              className={cn(
                                'w-10 h-8 rounded border text-[10px] font-bold transition-all',
                                status === 'baixa' 
                                  ? 'bg-success/30 border-success/50 text-success cursor-default' 
                                  : status === 'entrada' 
                                    ? 'bg-warning/30 border-warning/50 text-warning cursor-pointer hover:bg-warning/40' 
                                    : 'bg-secondary/30 border-border/30 text-muted-foreground cursor-pointer hover:bg-secondary/50',
                                isProc && 'animate-pulse',
                              )}
                              title={`${mask} → ${s.nome}: ${status}`}
                            >
                              {isProc ? '...' : status === 'baixa' ? '✓' : status === 'entrada' ? '▶' : '—'}
                            </button>
                          </td>
                        );
                      })}
                      <td className="text-center py-1 px-0.5">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => imprimirOP(op.id)} className="text-muted-foreground hover:text-foreground" title="Imprimir OP">
                            <Printer className="h-3 w-3" />
                          </button>
                          {op.status_producao === 'programada' && (
                            <button onClick={() => handleRemoverDaCarga(op.id)} className="text-muted-foreground hover:text-destructive" title="Remover da carga">
                              <ArrowRight className="h-3 w-3 rotate-180" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
