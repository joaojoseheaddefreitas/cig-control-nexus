import { useState, useEffect, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useCapacidadeIndustrial } from '@/hooks/useCapacidadeIndustrial';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  RefreshCw, Factory, Printer, PackagePlus, Zap, AlertTriangle,
  CheckCircle2, Clock, Gauge, Package, Calendar, ArrowRight,
  Search, ChevronUp, ChevronDown, ScanBarcode, Tag, Trash2,
  History, ArrowUpDown, Wand2, FileText, ClipboardList,
  Eye, Pencil, XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { getOPDisplayMask } from '@/services/aprovacaoService';
import { imprimirOP } from '@/services/printService';
import { imprimirEtiqueta } from '@/services/labelService';
import { imprimirCarga } from '@/services/cargaService';
import {
  fetchSetores,
  handleSetorClick,
  type SetorProdutivo,
} from '@/services/setorTrackingService';
import {
  fetchCargas, emitirCargaManual,
  type Carga,
} from '@/services/cargaService';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, ComposedChart, Line, Legend,
} from 'recharts';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

// ─── Types ───────────────────────────────────────────────────────────
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
  observacoes: string | null;
  rastreamento?: { setor_id: string; status: string; data_entrada: string | null; data_baixa: string | null }[];
}

interface SetorComCapacidade extends SetorProdutivo {
  mao_de_obra: number;
  horas_turno: number;
  eficiencia: number;
  maquinas_automaticas: number;
}

interface RouteStep {
  op_id: string;
  setor_id: string;
  tempo_estimado: number;
}

// ─── Utility: status label ──────────────────────────────────────────
function statusLabel(s: string): { label: string; color: string } {
  switch (s) {
    case 'aguardando': return { label: 'PENDENTE', color: 'border-border/50 text-muted-foreground bg-secondary/30' };
    case 'programada': return { label: 'PROGRAMADA', color: 'border-primary/50 text-primary bg-primary/10' };
    case 'em_producao': return { label: 'EM PRODUÇÃO', color: 'border-warning/50 text-warning bg-warning/10' };
    case 'Producao Finalizada': return { label: 'FINALIZADA', color: 'border-success/50 text-success bg-success/10' };
    default: return { label: s.toUpperCase(), color: 'border-border/30 text-muted-foreground' };
  }
}

// ─── Component ───────────────────────────────────────────────────────
export function CIPPCPControle() {
  const { capacidade: capUnificada, loading: capLoading } = useCapacidadeIndustrial();
  const [ops, setOps] = useState<OPRow[]>([]);
  const [setores, setSetores] = useState<SetorComCapacidade[]>([]);
  const [routeSteps, setRouteSteps] = useState<RouteStep[]>([]);
  const [cargas, setCargas] = useState<Carga[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [emitting, setEmitting] = useState(false);
  const [dataProgramada, setDataProgramada] = useState(new Date().toISOString().split('T')[0]);
  const [dataFiltro, setDataFiltro] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [scannerInput, setScannerInput] = useState('');
  const [historyOp, setHistoryOp] = useState<OPRow | null>(null);
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [editOp, setEditOp] = useState<OPRow | null>(null);
  const [editForm, setEditForm] = useState({ produto_nome: '', quantidade: 1, observacoes: '' });

  // ─── Data Loading ──────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    const [setoresResult, cargasData, opsResult] = await Promise.all([
      supabase.from('setores_produtivos').select('*').eq('ativo', true).order('ordem'),
      fetchCargas(),
      supabase
        .from('ops')
        .select('id, numero_op, produto_nome, quantidade, tempo_total, tempo_unitario, status_producao, carga_id, sequence_number, total_ops_at_generation, prazo_entrega, current_sector, data_programada, sequencia_programada, pedido_id, observacoes')
        .neq('status_producao', 'cancelado')
        .order('sequencia_programada', { ascending: true, nullsFirst: true }),
    ]);

    const setoresData = (setoresResult.data || []) as SetorComCapacidade[];
    setSetores(setoresData);
    setCargas(cargasData);
    const opsData = (opsResult.data || []) as OPRow[];

    const opIds = opsData.map(o => o.id);
    if (opIds.length > 0) {
      const [trackingResult, stepsResult] = await Promise.all([
        supabase.from('setor_rastreamento').select('op_id, setor_id, status, data_entrada, data_baixa').in('op_id', opIds),
        supabase.from('op_route_steps').select('op_id, setor_id, tempo_estimado').in('op_id', opIds),
      ]);

      opsData.forEach(op => {
        op.rastreamento = (trackingResult.data || [])
          .filter(t => t.op_id === op.id)
          .map(t => ({ setor_id: t.setor_id, status: t.status, data_entrada: t.data_entrada, data_baixa: t.data_baixa }));
      });
      setRouteSteps((stepsResult.data || []) as RouteStep[]);
    }

    setOps(opsData);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ─── Realtime ──────────────────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel('pcp-unified')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ops' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'setor_rastreamento' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cargas' }, () => loadData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadData]);

  // ─── Global Barcode Scanner ────────────────────────────────────────
  const handleScan = useCallback(async (code: string) => {
    const op = ops.find(o => o.numero_op === code || o.numero_op.toUpperCase() === code.toUpperCase());
    if (!op) {
      toast.error(`OP "${code}" não encontrada`);
      return;
    }

    // Find next pending/entrada sector for this OP
    for (const setor of setores) {
      const track = op.rastreamento?.find(t => t.setor_id === setor.id);
      if (!track || track.status === 'pendente') {
        const result = await handleSetorClick(op.id, setor.id, setores);
        if (result.error) toast.error(result.error);
        else toast.success(`📷 Scanner: ${code} → ${setor.nome} (${result.newStatus === 'entrada' ? '🟡 Entrada' : '🟢 Baixa'})`);
        await loadData();
        return;
      }
      if (track.status === 'entrada') {
        const result = await handleSetorClick(op.id, setor.id, setores);
        if (result.error) toast.error(result.error);
        else toast.success(`📷 Scanner: ${code} → ${setor.nome} (🟢 Baixa)`);
        await loadData();
        return;
      }
    }
    toast.info(`OP ${code}: todos os setores já finalizados`);
  }, [ops, setores, loadData]);

  useBarcodeScanner(handleScan);

  // ─── Capacity — FROM UNIFIED HOOK (same source as Dashboard + Setores) ──
  const capacidadePorSetor = useMemo(() => {
    if (!capUnificada) return [];
    return capUnificada.setores.map(s => ({
      id: s.id,
      nome: s.nome,
      capacidadeTotal: s.horas_disponiveis_mensal,
      horasOcupadas: s.horas_ocupadas,
      horasLivres: Math.max(0, s.horas_disponiveis_mensal - s.horas_ocupadas),
      percentual: s.carga_percent,
      capDiaria: s.capDiaria,
      diasGargalo: s.diasGargalo,
    }));
  }, [capUnificada]);

  // PCP 3.0 — Prazo de vendas (from unified source)
  const prazoVendasDias = capUnificada?.prazoVendasDias || 0;

  const setorGargaloDias = useMemo(() => {
    if (capacidadePorSetor.length === 0) return null;
    return capacidadePorSetor.reduce((max, s) => (s.diasGargalo || 0) > (max.diasGargalo || 0) ? s : max, capacidadePorSetor[0]);
  }, [capacidadePorSetor]);

  // Production tracking chart — ALL active OPs (carteira inteira)
  const chartProducao = useMemo(() => {
    return setores.map(setor => {
      // ALL non-finalized, non-cancelled OPs
      const opsAtivas = ops.filter(op =>
        op.status_producao !== 'Producao Finalizada' && op.status_producao !== 'cancelado'
      );
      const opIdsSet = new Set(opsAtivas.map(o => o.id));

      const totalHoras = routeSteps
        .filter(s => s.setor_id === setor.id && opIdsSet.has(s.op_id))
        .reduce((sum, s) => sum + Number(s.tempo_estimado), 0);

      // Fallback for OPs without route_steps
      const opsWithSteps = new Set(routeSteps.filter(s => opIdsSet.has(s.op_id)).map(s => s.op_id));
      const fallback = opsAtivas
        .filter(op => !opsWithSteps.has(op.id) && Number(op.tempo_total || 0) > 0)
        .reduce((sum, op) => sum + Number(op.tempo_total || 0) / Math.max(1, setores.length), 0);

      const totalProgramada = totalHoras + fallback;

      // Produzido = OPs com baixa neste setor
      const horasProduzidas = opsAtivas
        .filter(op => op.rastreamento?.find(t => t.setor_id === setor.id)?.status === 'baixa')
        .reduce((sum, op) => {
          const step = routeSteps.find(s => s.op_id === op.id && s.setor_id === setor.id);
          return sum + Number(step?.tempo_estimado || 0);
        }, 0);

      // Em Produção = OPs com entrada neste setor
      const horasEmProducao = opsAtivas
        .filter(op => op.rastreamento?.find(t => t.setor_id === setor.id)?.status === 'entrada')
        .reduce((sum, op) => {
          const step = routeSteps.find(s => s.op_id === op.id && s.setor_id === setor.id);
          return sum + Number(step?.tempo_estimado || 0);
        }, 0);

      const horasPendentes = Math.max(0, totalProgramada - horasProduzidas - horasEmProducao);

      return {
        setor: setor.nome.length > 10 ? setor.nome.substring(0, 10) + '…' : setor.nome,
        produzidas: Number(horasProduzidas.toFixed(1)),
        emProducao: Number(horasEmProducao.toFixed(1)),
        pendentes: Number(horasPendentes.toFixed(1)),
      };
    });
  }, [setores, ops, routeSteps]);

  const isOverCapacity = useCallback(() => {
    return capacidadePorSetor.some(s => s.percentual >= 100);
  }, [capacidadePorSetor]);

  // Colors: <50%=AZUL(Ocioso), 50-80%=VERDE(Normal), 80-95%=AMARELO(Atenção), 95-100%=LARANJA(Limite), >=100%=VERMELHO(Gargalo)
  const getCapacityColor = (pct: number) => {
    if (pct > 100) return { bg: 'bg-destructive/20', bar: 'bg-destructive', text: 'text-destructive', label: 'GARGALO' };
    if (pct >= 95) return { bg: 'bg-orange-400/20', bar: 'bg-orange-400', text: 'text-orange-400', label: 'NO LIMITE' };
    if (pct >= 80) return { bg: 'bg-warning/20', bar: 'bg-warning', text: 'text-warning', label: 'ATENÇÃO' };
    if (pct >= 50) return { bg: 'bg-success/20', bar: 'bg-success', text: 'text-success', label: 'NORMAL' };
    return { bg: 'bg-blue-500/20', bar: 'bg-blue-500', text: 'text-blue-400', label: 'OCIOSO' };
  };

  const getCapacityBarColor = (pct: number) => {
    if (pct > 100) return 'hsl(0, 72%, 51%)';
    if (pct >= 95) return 'hsl(25, 95%, 53%)';
    if (pct >= 80) return 'hsl(45, 93%, 47%)';
    if (pct >= 50) return 'hsl(145, 70%, 42%)';
    return 'hsl(210, 100%, 56%)';
  };

  const gargaloMax = useMemo(() => {
    if (capacidadePorSetor.length === 0) return null;
    return capacidadePorSetor.reduce((max, s) => s.percentual > max.percentual ? s : max, capacidadePorSetor[0]);
  }, [capacidadePorSetor]);

  // Montagem de Carga — apenas OPs programadas para HOJE vs capacidade DIÁRIA
  const chartCarga = useMemo(() => {
    const hoje = dataFiltro || new Date().toISOString().split('T')[0];
    const opsHoje = ops.filter(op =>
      op.data_programada === hoje &&
      op.status_producao !== 'Producao Finalizada' &&
      op.status_producao !== 'cancelado'
    );
    const opIdsHoje = new Set(opsHoje.map(o => o.id));
    const opsWithSteps = new Set(routeSteps.filter(s => opIdsHoje.has(s.op_id)).map(s => s.op_id));

    return setores.map(setor => {
      const maquinasDiaria = Math.max(setor.maquinas_automaticas, 1);
      const capacidadeDiaria = setor.mao_de_obra * maquinasDiaria * setor.horas_turno;

      const horasFromSteps = routeSteps
        .filter(s => s.setor_id === setor.id && opIdsHoje.has(s.op_id))
        .reduce((sum, s) => sum + Number(s.tempo_estimado), 0);

      // Fallback for OPs without route_steps
      const opsWithSteps = new Set(routeSteps.filter(s => opIdsHoje.has(s.op_id)).map(s => s.op_id));
      const fallback = opsHoje
        .filter(op => !opsWithSteps.has(op.id) && Number(op.tempo_total || 0) > 0)
        .reduce((sum, op) => sum + Number(op.tempo_total || 0) / Math.max(1, setores.length), 0);

      const programada = horasFromSteps + fallback;

      return {
        setor: setor.nome.length > 10 ? setor.nome.substring(0, 10) + '…' : setor.nome,
        programada: Number(programada.toFixed(1)),
        capacidadeMax: Number(capacidadeDiaria.toFixed(1)),
      };
    });
  }, [setores, ops, routeSteps, dataFiltro]);

  // ─── Validate OP fits capacity per sector ──────────────────────────
  const validateOpCapacity = useCallback((opId: string): { fits: boolean; blocker?: string } => {
    const opSteps = routeSteps.filter(s => s.op_id === opId);
    for (const step of opSteps) {
      const cap = capacidadePorSetor.find(c => c.id === step.setor_id);
      if (!cap) continue;
      const horasOp = Number(step.tempo_estimado);
      // Regra 3: OP não pode ter horas > capacidade diária do setor
      if (horasOp > cap.capacidadeTotal) {
        const setorNome = setores.find(s => s.id === step.setor_id)?.nome || 'Setor';
        return { fits: false, blocker: `OP excede capacidade diária do setor "${setorNome}" (${horasOp.toFixed(1)}h > ${cap.capacidadeTotal.toFixed(1)}h)` };
      }
      // Regra 5: horas_programadas + horas_OP <= capacidade
      if (cap.horasOcupadas + horasOp > cap.capacidadeTotal) {
        const setorNome = setores.find(s => s.id === step.setor_id)?.nome || 'Setor';
        return { fits: false, blocker: `Setor "${setorNome}" ficaria com ${(cap.horasOcupadas + horasOp).toFixed(1)}h (cap: ${cap.capacidadeTotal.toFixed(1)}h)` };
      }
    }
    return { fits: true };
  }, [routeSteps, capacidadePorSetor, setores]);

  // ─── Handlers ──────────────────────────────────────────────────────
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
    setEmitting(true);
    const ids = Array.from(selected);

    // Validate each OP fits capacity
    for (const id of ids) {
      const { fits, blocker } = validateOpCapacity(id);
      if (!fits) {
        const op = ops.find(o => o.id === id);
        toast.error(`🔴 OP ${op?.numero_op || ''}: ${blocker}`);
        setEmitting(false);
        return;
      }
      // Check OP not already in this carga date
      const existing = ops.find(o => o.id === id);
      if (existing?.data_programada === dataProgramada && existing?.status_producao === 'programada') {
        toast.error(`OP ${existing.numero_op} já está programada para esta data`);
        setEmitting(false);
        return;
      }
    }

    const existingProgrammed = ops.filter(o => o.data_programada === dataProgramada && o.sequencia_programada);
    const maxSeq = existingProgrammed.length > 0
      ? Math.max(...existingProgrammed.map(o => o.sequencia_programada || 0))
      : 0;

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

  // ─── TETRIS INDUSTRIAL – Auto-suggestion ──────────────────────────
  const handleSugerirCarga = async () => {
    const pending = ops.filter(o => !o.data_programada && (o.status_producao === 'aguardando'));
    if (pending.length === 0) {
      toast.info('Nenhuma OP pendente para sugerir');
      return;
    }

    const sorted = [...pending].sort((a, b) => {
      if (a.prazo_entrega && b.prazo_entrega) return a.prazo_entrega.localeCompare(b.prazo_entrega);
      if (a.prazo_entrega) return -1;
      if (b.prazo_entrega) return 1;
      return 0;
    });

    // Build capacity remaining per sector
    const capRestante: Record<string, number> = {};
    capacidadePorSetor.forEach(s => { capRestante[s.id] = s.horasLivres; });

    const autoSelected = new Set<string>();

    for (const op of sorted) {
      const opSteps = routeSteps.filter(s => s.op_id === op.id);
      if (opSteps.length === 0) {
        const perSetor = Number(op.tempo_total || 0) / Math.max(1, setores.length);
        // Check no sector exceeds capacity
        const fits = setores.every(s => {
          const capSetor = s.mao_de_obra * 8.8;
          return perSetor <= capSetor && (capRestante[s.id] || 0) >= perSetor;
        });
        if (fits) {
          autoSelected.add(op.id);
          setores.forEach(s => { capRestante[s.id] = (capRestante[s.id] || 0) - perSetor; });
        }
        continue;
      }

      // Check: OP hours per sector cannot exceed daily capacity
      const exceeds = opSteps.some(step => {
        const capSetor = setores.find(s => s.id === step.setor_id);
        return capSetor ? Number(step.tempo_estimado) > capSetor.mao_de_obra * 8.8 : false;
      });
      if (exceeds) continue; // Skip OPs that exceed sector capacity

      const fits = opSteps.every(step => (capRestante[step.setor_id] || 0) >= Number(step.tempo_estimado));
      if (fits) {
        autoSelected.add(op.id);
        opSteps.forEach(step => {
          capRestante[step.setor_id] = (capRestante[step.setor_id] || 0) - Number(step.tempo_estimado);
        });
      }
    }

    if (autoSelected.size === 0) {
      toast.warning('Nenhuma OP cabe na capacidade restante dos setores');
      return;
    }

    setSelected(autoSelected);
    toast.success(`🧩 Tetris: ${autoSelected.size} OPs sugeridas para a carga`);
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

  const handleMoveOp = async (opId: string, direction: 'up' | 'down') => {
    const idx = programmedOps.findIndex(o => o.id === opId);
    if (idx < 0) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= programmedOps.length) return;

    const seqA = programmedOps[idx].sequencia_programada || idx + 1;
    const seqB = programmedOps[swapIdx].sequencia_programada || swapIdx + 1;

    await Promise.all([
      supabase.from('ops').update({ sequencia_programada: seqB } as any).eq('id', programmedOps[idx].id),
      supabase.from('ops').update({ sequencia_programada: seqA } as any).eq('id', programmedOps[swapIdx].id),
    ]);
    await loadData();
  };

  const handleManualScan = () => {
    if (scannerInput.trim()) {
      handleScan(scannerInput.trim());
      setScannerInput('');
    }
  };

  // ─── Cancel OP ────────────────────────────────────────────────────
  const handleCancelOp = async (op: OPRow) => {
    if (op.status_producao === 'em_producao') {
      toast.error('Não é possível cancelar uma OP em produção');
      return;
    }
    if (op.status_producao === 'Producao Finalizada') {
      toast.error('OP já finalizada');
      return;
    }
    if (!window.confirm(`Cancelar OP ${op.numero_op}?`)) return;
    await supabase.from('ops').update({
      status_producao: 'cancelado',
      data_programada: null,
      sequencia_programada: null,
      carga_id: null,
    } as any).eq('id', op.id);
    toast.success(`OP ${op.numero_op} cancelada`);
    await loadData();
  };

  // ─── Edit OP ──────────────────────────────────────────────────────
  const openEditOp = (op: OPRow) => {
    setEditForm({ produto_nome: op.produto_nome, quantidade: op.quantidade, observacoes: op.observacoes || '' });
    setEditOp(op);
  };

  const handleSaveEdit = async () => {
    if (!editOp) return;
    const tempo_total = editForm.quantidade * editOp.tempo_unitario;
    await supabase.from('ops').update({
      produto_nome: editForm.produto_nome,
      quantidade: editForm.quantidade,
      tempo_total,
      observacoes: editForm.observacoes || null,
    } as any).eq('id', editOp.id);
    toast.success(`OP ${editOp.numero_op} atualizada`);
    setEditOp(null);
    await loadData();
  };

  // ─── Print Carga Relation ─────────────────────────────────────────
  const handlePrintCargaDia = () => {
    if (programmedOps.length === 0) {
      toast.info('Nenhuma OP programada para imprimir');
      return;
    }
    // Find carga_id from programmed ops
    const cargaId = programmedOps.find(o => o.carga_id)?.carga_id;
    if (cargaId) {
      imprimirCarga(cargaId);
    } else {
      // Print a simple relation
      const rows = programmedOps.map((op, i) => `<tr>
        <td style="padding:4px 8px;border:1px solid #ddd;text-align:center">${i + 1}</td>
        <td style="padding:4px 8px;border:1px solid #ddd;font-family:monospace;font-weight:bold">${op.numero_op}</td>
        <td style="padding:4px 8px;border:1px solid #ddd">${op.produto_nome}</td>
        <td style="padding:4px 8px;border:1px solid #ddd;text-align:center">${op.quantidade}</td>
        <td style="padding:4px 8px;border:1px solid #ddd;text-align:center">${Number(op.tempo_total || 0).toFixed(1)}h</td>
        <td style="padding:4px 8px;border:1px solid #ddd;text-align:center">${statusLabel(op.status_producao).label}</td>
      </tr>`).join('');

      const totalH = programmedOps.reduce((s, o) => s + Number(o.tempo_total || 0), 0);
      const html = `<html><head><title>Carga ${dataFiltro}</title>
        <style>body{font-family:Arial,sans-serif;padding:30px;color:#333}h1{font-size:20px}table{width:100%;border-collapse:collapse;font-size:12px;margin-top:16px}th{background:#f5f5f5;padding:6px 8px;border:1px solid #ddd;text-align:left;font-size:10px;text-transform:uppercase}.footer{margin-top:20px;font-size:10px;color:#999;border-top:1px solid #eee;padding-top:8px}@media print{body{padding:10px}}</style></head><body>
        <h1>RELAÇÃO DA CARGA — ${new Date(dataFiltro + 'T12:00:00').toLocaleDateString('pt-BR')}</h1>
        <p style="font-size:12px;color:#666">Total: ${programmedOps.length} OPs · ${totalH.toFixed(1)}h</p>
        <table><thead><tr><th>#</th><th>OP</th><th>Produto</th><th style="text-align:center">Qtd</th><th style="text-align:center">Horas</th><th style="text-align:center">Status</th></tr></thead><tbody>${rows}</tbody></table>
        <div class="footer">Impresso em ${new Date().toLocaleString('pt-BR')} | Sistema Industrial</div>
        </body></html>`;
      const win = window.open('', '_blank');
      if (win) { win.document.write(html); win.document.close(); win.print(); }
    }
  };

  // ─── Derived Data ──────────────────────────────────────────────────
  const getCellStatus = (op: OPRow, setorId: string): 'pendente' | 'entrada' | 'baixa' => {
    const track = op.rastreamento?.find(t => t.setor_id === setorId);
    if (!track || track.status === 'pendente') return 'pendente';
    return track.status as 'entrada' | 'baixa';
  };

  // REGRA 4: Grade mostra TODAS as OPs, apenas muda o status. Filtro opcional.
  const allGradeOps = ops.filter(o => o.status_producao !== 'cancelado');
  const filteredGradeOps = allGradeOps.filter(o => {
    if (gradeFilter !== 'all' && o.status_producao !== gradeFilter) return false;
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return o.numero_op.toLowerCase().includes(term) || o.produto_nome.toLowerCase().includes(term);
  });

  // Only PENDENTE ops are selectable for carga
  const selectableOps = filteredGradeOps.filter(o => o.status_producao === 'aguardando' && !o.data_programada);

  const programmedOps = ops.filter(o => {
    if (!o.data_programada) return false;
    if (dataFiltro && o.data_programada !== dataFiltro) return false;
    return true;
  }).sort((a, b) => (a.sequencia_programada || 999) - (b.sequencia_programada || 999));

  const totalHoras = ops.reduce((s, o) => s + Number(o.tempo_total || 0), 0);
  const opsPendentes = ops.filter(o => o.status_producao === 'aguardando').length;
  const opsEmProducao = ops.filter(o => o.status_producao === 'em_producao').length;
  const opsProgramadas = ops.filter(o => o.status_producao === 'programada').length;
  const opsFinalizadas = ops.filter(o => o.status_producao === 'Producao Finalizada').length;

  // ─── Render ────────────────────────────────────────────────────────
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
        {/* KPI Summary + Scanner */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border/30 bg-card/80">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Pendentes:</span>
            <span className="text-sm font-bold text-foreground">{opsPendentes}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border/30 bg-card/80">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground">Programadas:</span>
            <span className="text-sm font-bold text-foreground">{opsProgramadas}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border/30 bg-card/80">
            <Factory className="h-4 w-4 text-warning" />
            <span className="text-xs text-muted-foreground">Em Produção:</span>
            <span className="text-sm font-bold text-foreground">{opsEmProducao}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border/30 bg-card/80">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <span className="text-xs text-muted-foreground">Finalizadas:</span>
            <span className="text-sm font-bold text-foreground">{opsFinalizadas}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border/30 bg-card/80">
            <Clock className="h-4 w-4 text-cip" />
            <span className="text-xs text-muted-foreground">Total Horas:</span>
            <span className="text-sm font-bold text-cip">{totalHoras.toFixed(1)}h</span>
          </div>
          <div className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg border',
            prazoVendasDias > 25 ? 'border-destructive/50 bg-destructive/10' :
            prazoVendasDias > 15 ? 'border-orange-400/50 bg-orange-400/10' :
            prazoVendasDias > 8  ? 'border-success/50 bg-success/10' : 'border-blue-400/50 bg-blue-400/10'
          )}>
            <Gauge className="h-4 w-4" />
            <span className="text-xs text-muted-foreground">Prazo:</span>
            <span className={cn(
              'text-sm font-bold font-mono',
              prazoVendasDias > 25 ? 'text-destructive' :
              prazoVendasDias > 15 ? 'text-orange-400' :
              prazoVendasDias > 8  ? 'text-success' : 'text-blue-400'
            )}>
              {prazoVendasDias}d
            </span>
            <span className="text-[10px] text-muted-foreground">
              ({setorGargaloDias?.nome?.substring(0, 10) || '—'})
            </span>
          </div>

          {/* Manual scanner input */}
          <div className="flex items-center gap-1 ml-auto">
            <div className="relative">
              <ScanBarcode className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Scanner OP..."
                value={scannerInput}
                onChange={e => setScannerInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleManualScan()}
                className="pl-8 h-8 text-xs w-36"
              />
            </div>
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleManualScan}>
              <Zap className="h-3.5 w-3.5" />
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={loadData}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
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
                <div className="h-1.5 bg-secondary/50 rounded-full mt-1.5 overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all', colors.bar)}
                    style={{ width: `${Math.min(100, setor.percentual)}%` }}
                  />
                </div>
                <span className="text-[9px] text-muted-foreground mt-0.5 block">
                  {setor.diasGargalo.toFixed(1)}d · {setor.horasLivres.toFixed(0)}h livres
                </span>
              </div>
            );
          })}
        </div>

        {/* Recharts – Two charts side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Chart 1: Acompanhamento de Produção — 3 states */}
          <div className="rounded-xl border border-border/30 bg-card/80 p-4">
            <h4 className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
              <Gauge className="h-3.5 w-3.5 text-cip" /> Acompanhamento de Produção
            </h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartProducao} layout="vertical" margin={{ left: 70, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 18%, 22%)" horizontal vertical={false} />
                  <XAxis type="number" tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 10 }} axisLine={{ stroke: 'hsl(220, 18%, 22%)' }} unit="h" />
                  <YAxis type="category" dataKey="setor" tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 10 }} axisLine={{ stroke: 'hsl(220, 18%, 22%)' }} width={68} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(220, 20%, 14%)', border: '1px solid hsl(220, 18%, 22%)', borderRadius: '8px', fontSize: '11px' }}
                    formatter={(value: number, name: string) => {
                      if (name === 'produzidas') return [`${value}h`, '🟢 Produzido'];
                      if (name === 'emProducao') return [`${value}h`, '🟡 Em Produção'];
                      if (name === 'pendentes') return [`${value}h`, '⬜ Pendente'];
                      return [value, name];
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '10px' }}
                    formatter={(value) => value === 'produzidas' ? '🟢 Produzido' : value === 'emProducao' ? '🟡 Em Produção' : '⬜ Pendente'}
                  />
                  <Bar dataKey="produzidas" stackId="a" fill="hsl(145, 70%, 42%)" radius={[0, 0, 0, 0]} name="produzidas" />
                  <Bar dataKey="emProducao" stackId="a" fill="hsl(45, 93%, 47%)" radius={[0, 0, 0, 0]} name="emProducao" />
                  <Bar dataKey="pendentes" stackId="a" fill="hsl(220, 18%, 35%)" radius={[0, 4, 4, 0]} name="pendentes" />
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
                <ComposedChart data={chartCarga} layout="vertical" margin={{ left: 70, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 18%, 22%)" horizontal vertical={false} />
                  <XAxis type="number" tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 10 }} axisLine={{ stroke: 'hsl(220, 18%, 22%)' }} unit="h" />
                  <YAxis type="category" dataKey="setor" tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 10 }} axisLine={{ stroke: 'hsl(220, 18%, 22%)' }} width={68} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(220, 20%, 14%)', border: '1px solid hsl(220, 18%, 22%)', borderRadius: '8px', fontSize: '11px' }}
                    formatter={(value: number, name: string) => {
                      if (name === 'programada') return [`${value}h`, 'Carga Programada'];
                      if (name === 'capacidadeMax') return [`${value}h`, 'Capacidade Máx'];
                      return [value, name];
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px' }} formatter={(v) => v === 'programada' ? '📦 Programada' : '🔴 Cap. Máx'} />
                  <Bar dataKey="programada" name="programada" radius={[0, 4, 4, 0]}>
                    {chartCarga.map((entry, idx) => (
                      <Cell key={idx} fill={entry.programada > entry.capacidadeMax ? 'hsl(0, 72%, 51%)' : getCapacityBarColor((entry.programada / Math.max(1, entry.capacidadeMax)) * 100)} />
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

        {/* ZONA ESQUERDA – GRADE DE OPs (TODAS) */}
        <div className="lg:col-span-4 space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-display font-bold text-foreground flex items-center gap-1.5">
              <Package className="h-4 w-4 text-cip" /> Grade de OPs
              <Badge variant="outline" className="text-[10px] ml-1">{allGradeOps.length}</Badge>
            </h3>
          </div>

          {/* Search + Filter */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar OP ou produto..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-8 h-7 text-xs"
              />
            </div>
            <Select value={gradeFilter} onValueChange={setGradeFilter}>
              <SelectTrigger className="w-[120px] h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="aguardando">Pendente</SelectItem>
                <SelectItem value="programada">Programada</SelectItem>
                <SelectItem value="em_producao">Em Produção</SelectItem>
                <SelectItem value="Producao Finalizada">Finalizada</SelectItem>
              </SelectContent>
            </Select>
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
              disabled={emitting || selected.size === 0}
            >
              <PackagePlus className="h-3 w-3 mr-1" /> Montar ({selected.size})
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs border-cip/30 text-cip hover:bg-cip/10"
              onClick={handleSugerirCarga}
            >
              <Wand2 className="h-3 w-3 mr-1" /> Sugerir
            </Button>
          </div>

          {/* OP List – ALL OPs with status column */}
          <div className="rounded-xl border border-border/30 bg-card/80 max-h-[500px] overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 z-10 bg-secondary/80 backdrop-blur-sm">
                <tr className="border-b border-border/50">
                  <th className="py-2 px-2 w-7"></th>
                  <th className="text-left py-2 px-1 font-medium text-muted-foreground">Nº OP</th>
                  <th className="text-left py-2 px-1 font-medium text-muted-foreground">Produto</th>
                  <th className="text-center py-2 px-1 font-medium text-muted-foreground">Hrs</th>
                  <th className="text-center py-2 px-1 font-medium text-muted-foreground">Status</th>
                  <th className="text-center py-2 px-1 font-medium text-muted-foreground min-w-[90px]">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredGradeOps.length === 0 ? (
                  <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">
                    <CheckCircle2 className="h-6 w-6 mx-auto mb-2 opacity-30" />
                    {searchTerm ? 'Nenhuma OP encontrada' : 'Nenhuma OP'}
                  </td></tr>
                ) : filteredGradeOps.map(op => {
                  const mask = getOPDisplayMask(op.numero_op, op.sequence_number, op.total_ops_at_generation);
                  const isSelectable = op.status_producao === 'aguardando' && !op.data_programada;
                  const st = statusLabel(op.status_producao);
                  return (
                    <tr
                      key={op.id}
                      className={cn(
                        'border-b border-border/30 hover:bg-secondary/20',
                        isSelectable && 'cursor-pointer',
                        selected.has(op.id) && 'bg-cip/10'
                      )}
                      onClick={() => isSelectable && toggleSelect(op.id)}
                    >
                      <td className="py-1.5 px-2" onClick={e => e.stopPropagation()}>
                        {isSelectable && (
                          <Checkbox checked={selected.has(op.id)} onCheckedChange={() => toggleSelect(op.id)} />
                        )}
                      </td>
                      <td className="py-1.5 px-1 font-mono font-bold text-foreground text-[11px]">{mask}</td>
                      <td className="py-1.5 px-1 text-muted-foreground truncate max-w-[100px]">{op.produto_nome}</td>
                      <td className="text-center py-1.5 px-1 font-bold text-cip">{Number(op.tempo_total || 0).toFixed(1)}</td>
                      <td className="text-center py-1.5 px-1">
                        <Badge variant="outline" className={cn('text-[9px]', st.color)}>{st.label}</Badge>
                      </td>
                      <td className="text-center py-1 px-0.5" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => setHistoryOp(op)} className="text-muted-foreground hover:text-primary" title="Visualizar">
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => openEditOp(op)} className="text-muted-foreground hover:text-foreground" title="Editar" disabled={op.status_producao === 'em_producao' || op.status_producao === 'Producao Finalizada'}>
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => imprimirOP(op.id)} className="text-muted-foreground hover:text-foreground" title="Imprimir">
                            <Printer className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => handleCancelOp(op)} className="text-muted-foreground hover:text-destructive" title="Cancelar" disabled={op.status_producao === 'em_producao' || op.status_producao === 'Producao Finalizada'}>
                            <XCircle className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
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
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handlePrintCargaDia} title="Imprimir relação da carga">
                <ClipboardList className="h-3 w-3 mr-1" /> Imprimir Carga
              </Button>
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
              <span className="text-muted-foreground">Pendente</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-warning/30 border border-warning/50" />
              <span className="text-muted-foreground">Entrada 🟡</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-success/30 border border-success/50" />
              <span className="text-muted-foreground">Baixa 🟢</span>
            </div>
            <div className="flex items-center gap-1.5 ml-auto">
              <ScanBarcode className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">Scanner ativo (global)</span>
            </div>
          </div>

          {/* Tracking Grid */}
          <div className="rounded-xl border border-border/30 bg-card/80 max-h-[500px] overflow-y-auto overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 z-10 bg-secondary/80 backdrop-blur-sm">
                <tr className="border-b border-border/50">
                  <th className="text-left py-2 px-2 font-medium text-muted-foreground sticky left-0 bg-secondary/80 z-20 min-w-[130px]">OP / Produto</th>
                  <th className="text-center py-2 px-1 font-medium text-muted-foreground min-w-[40px]">
                    <ArrowUpDown className="h-3 w-3 mx-auto" />
                  </th>
                  <th className="text-center py-2 px-1 font-medium text-muted-foreground min-w-[35px]">Hrs</th>
                  {setores.map(s => (
                    <th key={s.id} className="text-center py-2 px-1 font-medium text-muted-foreground min-w-[50px]">
                      <span className="block truncate text-[10px]" title={s.nome}>{s.nome.substring(0, 7)}</span>
                    </th>
                  ))}
                  <th className="text-center py-2 px-1 font-medium text-muted-foreground w-20">Ações</th>
                </tr>
              </thead>
              <tbody>
                {programmedOps.length === 0 ? (
                  <tr><td colSpan={3 + setores.length + 1} className="py-8 text-center text-muted-foreground">
                    <Factory className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    Nenhuma OP programada para {new Date(dataFiltro + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </td></tr>
                ) : programmedOps.map((op, idx) => {
                  const mask = getOPDisplayMask(op.numero_op, op.sequence_number, op.total_ops_at_generation);
                  return (
                    <tr key={op.id} className="border-b border-border/30 hover:bg-secondary/20">
                      <td className="py-1.5 px-2 sticky left-0 bg-card/80 z-10">
                        <div className="font-mono font-bold text-foreground text-[11px]">{mask}</div>
                        <div className="text-muted-foreground truncate max-w-[120px]">{op.produto_nome}</div>
                      </td>
                      <td className="text-center py-1 px-0.5">
                        <div className="flex flex-col items-center gap-0.5">
                          <button
                            onClick={() => handleMoveOp(op.id, 'up')}
                            disabled={idx === 0}
                            className="text-muted-foreground hover:text-foreground disabled:opacity-20"
                          >
                            <ChevronUp className="h-3 w-3" />
                          </button>
                          <span className="text-[9px] font-bold text-primary">{op.sequencia_programada || '—'}</span>
                          <button
                            onClick={() => handleMoveOp(op.id, 'down')}
                            disabled={idx === programmedOps.length - 1}
                            className="text-muted-foreground hover:text-foreground disabled:opacity-20"
                          >
                            <ChevronDown className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
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
                          <button onClick={() => imprimirEtiqueta(op)} className="text-muted-foreground hover:text-foreground" title="Imprimir etiqueta">
                            <Tag className="h-3 w-3" />
                          </button>
                          <button onClick={() => setHistoryOp(op)} className="text-muted-foreground hover:text-foreground" title="Histórico">
                            <History className="h-3 w-3" />
                          </button>
                          {op.status_producao === 'programada' && (
                            <button onClick={() => handleRemoverDaCarga(op.id)} className="text-muted-foreground hover:text-destructive" title="Remover da carga">
                              <Trash2 className="h-3 w-3" />
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

      {/* ═══════════════════ MODAL – HISTÓRICO DA OP ═══════════════════ */}
      <Dialog open={!!historyOp} onOpenChange={() => setHistoryOp(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-4 w-4 text-cip" />
              Histórico – {historyOp?.numero_op}
            </DialogTitle>
          </DialogHeader>
          {historyOp && (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{historyOp.produto_nome}</span> · Qtd: {historyOp.quantidade}
              </div>
              <div className="rounded-lg border border-border/30 overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-secondary/50 border-b border-border/30">
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Setor</th>
                      <th className="text-center py-2 px-2 font-medium text-muted-foreground">Status</th>
                      <th className="text-center py-2 px-2 font-medium text-muted-foreground">Entrada</th>
                      <th className="text-center py-2 px-2 font-medium text-muted-foreground">Baixa</th>
                      <th className="text-center py-2 px-2 font-medium text-muted-foreground">Tempo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {setores.map(setor => {
                      const track = historyOp.rastreamento?.find(t => t.setor_id === setor.id);
                      const entrada = track?.data_entrada ? new Date(track.data_entrada) : null;
                      const baixa = track?.data_baixa ? new Date(track.data_baixa) : null;
                      const tempoMin = entrada && baixa ? Math.round((baixa.getTime() - entrada.getTime()) / 60000) : null;
                      return (
                        <tr key={setor.id} className="border-b border-border/20">
                          <td className="py-1.5 px-3 font-medium text-foreground">{setor.nome}</td>
                          <td className="text-center py-1.5 px-2">
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-[10px]',
                                track?.status === 'baixa' ? 'border-success/50 text-success' :
                                track?.status === 'entrada' ? 'border-warning/50 text-warning' :
                                'border-border/30 text-muted-foreground'
                              )}
                            >
                              {track?.status === 'baixa' ? '🟢 Baixa' : track?.status === 'entrada' ? '🟡 Entrada' : '— Pendente'}
                            </Badge>
                          </td>
                          <td className="text-center py-1.5 px-2 text-[10px] text-muted-foreground">
                            {entrada ? entrada.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}
                          </td>
                          <td className="text-center py-1.5 px-2 text-[10px] text-muted-foreground">
                            {baixa ? baixa.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}
                          </td>
                          <td className="text-center py-1.5 px-2 text-[10px] font-medium text-cip">
                            {tempoMin !== null ? `${Math.floor(tempoMin / 60)}h${String(tempoMin % 60).padStart(2, '0')}m` : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══════════════════ MODAL – EDITAR OP ═══════════════════ */}
      <Dialog open={!!editOp} onOpenChange={() => setEditOp(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-4 w-4 text-cip" />
              Editar OP – {editOp?.numero_op}
            </DialogTitle>
          </DialogHeader>
          {editOp && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Produto</label>
                <Input value={editForm.produto_nome} onChange={e => setEditForm(f => ({ ...f, produto_nome: e.target.value }))} className="h-8 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Quantidade</label>
                <Input type="number" min={1} value={editForm.quantidade} onChange={e => setEditForm(f => ({ ...f, quantidade: Number(e.target.value) || 1 }))} className="h-8 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Observações</label>
                <Input value={editForm.observacoes} onChange={e => setEditForm(f => ({ ...f, observacoes: e.target.value }))} className="h-8 text-sm" />
              </div>
              <div className="text-xs text-muted-foreground">
                Tempo total: <span className="font-bold text-cip">{(editForm.quantidade * editOp.tempo_unitario).toFixed(1)}h</span>
              </div>
              <Button className="w-full bg-cip hover:bg-cip/90" onClick={handleSaveEdit}>Salvar</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
