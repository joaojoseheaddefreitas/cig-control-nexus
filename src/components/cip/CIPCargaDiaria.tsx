import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
  RefreshCw, Factory, Printer, PackagePlus, Zap, AlertTriangle,
  CheckCircle2, PlayCircle, Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { getOPDisplayMask } from '@/services/aprovacaoService';
import {
  fetchCargas, calcularGargalo, emitirCargaManual, emitirCargaAutomatica,
  imprimirCarga, type Carga, type GargaloResult,
} from '@/services/cargaService';

interface OPRow {
  id: string;
  numero_op: string;
  produto_nome: string;
  quantidade: number;
  tempo_total: number;
  status_producao: string;
  carga_id: string | null;
  sequence_number: number | null;
  total_ops_at_generation: number | null;
  prazo_entrega: string | null;
}

export function CIPCargaDiaria() {
  const [ops, setOps] = useState<OPRow[]>([]);
  const [cargas, setCargas] = useState<Carga[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [gargalo, setGargalo] = useState<GargaloResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [emitting, setEmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [cargasData, opsRes] = await Promise.all([
      fetchCargas(),
      supabase
        .from('ops')
        .select('id, numero_op, produto_nome, quantidade, tempo_total, status_producao, carga_id, sequence_number, total_ops_at_generation, prazo_entrega')
        .neq('status_producao', 'Producao Finalizada')
        .order('sequencia_fila'),
    ]);
    setCargas(cargasData);
    setOps((opsRes.data || []) as OPRow[]);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Realtime subscription for cargas
  useEffect(() => {
    const channel = supabase
      .channel('cargas-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cargas' }, () => {
        loadData();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadData]);

  // Update gargalo when selection changes
  useEffect(() => {
    if (selected.size > 0) {
      calcularGargalo(Array.from(selected)).then(setGargalo);
    } else {
      setGargalo([]);
    }
  }, [selected]);

  const toggleSelect = (opId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(opId)) next.delete(opId);
      else next.add(opId);
      return next;
    });
  };

  const selectAll = () => {
    const pending = ops.filter((o) => !o.carga_id);
    if (selected.size === pending.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(pending.map((o) => o.id)));
    }
  };

  const handleEmitirManual = async () => {
    const overLimit = gargalo.some((g) => g.percentual >= 100);
    if (overLimit) {
      toast.error('Emissão bloqueada: capacidade excedida em pelo menos um setor');
      return;
    }
    setEmitting(true);
    const result = await emitirCargaManual(Array.from(selected));
    if (result.error) toast.error(result.error);
    else {
      toast.success(`Carga emitida com ${selected.size} OPs`);
      setSelected(new Set());
      await loadData();
    }
    setEmitting(false);
  };

  const handleEmitirAuto = async () => {
    setEmitting(true);
    const result = await emitirCargaAutomatica();
    if (result.error) toast.error(result.error);
    else {
      toast.success(`Carga automática emitida com ${result.opsCount} OPs`);
      await loadData();
    }
    setEmitting(false);
  };

  const getCargaStatusBadge = (status: string) => {
    switch (status) {
      case 'EM_EXECUCAO':
        return <Badge className="bg-warning/20 text-warning text-[10px]"><PlayCircle className="h-3 w-3 mr-1" />Em Execução</Badge>;
      case 'FINALIZADA':
        return <Badge className="bg-success/20 text-success text-[10px]"><CheckCircle2 className="h-3 w-3 mr-1" />Finalizada</Badge>;
      default:
        return <Badge className="bg-primary/20 text-primary text-[10px]"><Clock className="h-3 w-3 mr-1" />Planejada</Badge>;
    }
  };

  const pendingOps = ops.filter((o) => !o.carga_id);
  const linkedOps = ops.filter((o) => o.carga_id);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-cip" />
        <span className="ml-3 text-muted-foreground">Carregando motor de carga...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="font-display text-lg font-bold text-foreground">Motor de Carga Diária</h3>
          <p className="text-xs text-muted-foreground">
            Agrupe OPs em cargas respeitando capacidade setorial. Gargalo = setor mais restritivo.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-1" /> Atualizar
          </Button>
          <Button size="sm" variant="outline" onClick={handleEmitirAuto} disabled={emitting}>
            <Zap className="h-4 w-4 mr-1" /> Carga Automática
          </Button>
          <Button
            size="sm"
            className="bg-cip hover:bg-cip/90"
            onClick={handleEmitirManual}
            disabled={emitting || selected.size === 0}
          >
            <PackagePlus className="h-4 w-4 mr-1" /> Emitir Carga ({selected.size})
          </Button>
        </div>
      </div>

      {/* Gargalo Analysis */}
      {gargalo.length > 0 && (
        <div className="rounded-xl border border-border/30 bg-card/80 p-4 space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> Análise de Gargalo — {selected.size} OPs selecionadas
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {gargalo.map((g) => (
              <div key={g.setor_id} className="p-3 rounded-lg border border-border/30 bg-secondary/20">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium truncate">{g.setor_nome}</span>
                  <span className={cn(
                    "text-xs font-bold",
                    g.percentual >= 100 ? "text-destructive" : g.percentual >= 80 ? "text-warning" : "text-success"
                  )}>
                    {g.percentual.toFixed(0)}%
                  </span>
                </div>
                <Progress
                  value={Math.min(g.percentual, 100)}
                  className={cn(
                    "h-2",
                    g.percentual >= 100 ? "[&>div]:bg-destructive" : g.percentual >= 80 ? "[&>div]:bg-warning" : "[&>div]:bg-success"
                  )}
                />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>{g.horas_necessarias.toFixed(1)}h necessárias</span>
                  <span>{g.capacidade_liquida.toFixed(1)}h cap.</span>
                </div>
              </div>
            ))}
          </div>
          {gargalo.some((g) => g.percentual >= 100) && (
            <p className="text-xs text-destructive font-medium">
              🔴 Emissão bloqueada — reduza OPs ou aumente capacidade do setor restritivo.
            </p>
          )}
        </div>
      )}

      {/* Cargas ativas */}
      {cargas.filter((c) => c.status !== 'FINALIZADA').length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-muted-foreground">Cargas Ativas</h4>
          <div className="flex gap-2 flex-wrap">
            {cargas.filter((c) => c.status !== 'FINALIZADA').map((c) => {
              const cargaOps = linkedOps.filter((o) => o.carga_id === c.id);
              return (
                <div key={c.id} className="flex items-center gap-2 p-2 rounded-lg border border-border/30 bg-card/80">
                  {getCargaStatusBadge(c.status)}
                  <span className="text-xs text-muted-foreground">
                    {new Date(c.data_emissao).toLocaleDateString('pt-BR')} — {cargaOps.length} OPs
                  </span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => imprimirCarga(c.id)}>
                    <Printer className="h-3 w-3" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* OPs Grid */}
      <div className="rounded-xl border border-border/30 bg-card/80 max-h-[500px] overflow-y-auto overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 z-10 bg-secondary/80 backdrop-blur-sm">
            <tr className="border-b border-border/50">
              <th className="py-2.5 px-2 w-8">
                <Checkbox
                  checked={pendingOps.length > 0 && selected.size === pendingOps.length}
                  onCheckedChange={selectAll}
                />
              </th>
              <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">OP / Produto</th>
              <th className="text-center py-2.5 px-2 font-medium text-muted-foreground">Qtd</th>
              <th className="text-center py-2.5 px-2 font-medium text-muted-foreground">Hrs</th>
              <th className="text-center py-2.5 px-2 font-medium text-muted-foreground">Prazo</th>
              <th className="text-center py-2.5 px-2 font-medium text-muted-foreground">Status Carga</th>
            </tr>
          </thead>
          <tbody>
            {ops.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-muted-foreground">
                  <Factory className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  Nenhuma OP em produção
                </td>
              </tr>
            ) : ops.map((op) => {
              const displayMask = getOPDisplayMask(op.numero_op, op.sequence_number, op.total_ops_at_generation);
              const carga = op.carga_id ? cargas.find((c) => c.id === op.carga_id) : null;
              const isPending = !op.carga_id;

              return (
                <tr key={op.id} className={cn(
                  "border-b border-border/30 hover:bg-secondary/20 transition-colors",
                  selected.has(op.id) && "bg-cip/5"
                )}>
                  <td className="py-2 px-2">
                    {isPending ? (
                      <Checkbox
                        checked={selected.has(op.id)}
                        onCheckedChange={() => toggleSelect(op.id)}
                      />
                    ) : (
                      <span className="text-muted-foreground text-[10px]">—</span>
                    )}
                  </td>
                  <td className="py-2 px-3">
                    <div className="font-mono font-bold text-foreground">{displayMask}</div>
                    <div className="text-muted-foreground truncate max-w-[200px]">{op.produto_nome}</div>
                  </td>
                  <td className="text-center py-2 px-2 font-bold text-foreground">{op.quantidade}</td>
                  <td className="text-center py-2 px-2 font-bold text-cip">{Number(op.tempo_total).toFixed(1)}</td>
                  <td className="text-center py-2 px-2 text-muted-foreground text-[11px]">
                    {op.prazo_entrega ? new Date(op.prazo_entrega).toLocaleDateString('pt-BR') : '—'}
                  </td>
                  <td className="text-center py-2 px-2">
                    {carga ? getCargaStatusBadge(carga.status) : (
                      <Badge variant="outline" className="text-[10px]">Sem carga</Badge>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
