import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Factory, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { imprimirOP } from '@/services/printService';
import {
  fetchSetores,
  fetchOPsComRastreamento,
  handleSetorClick,
  type SetorProdutivo,
} from '@/services/setorTrackingService';
import { getOPDisplayMask } from '@/services/aprovacaoService';

interface OPComRastreamento {
  id: string;
  numero_op: string;
  produto_nome: string;
  quantidade: number;
  tempo_total: number;
  status_producao: string;
  sequence_number: number | null;
  total_ops_at_generation: number | null;
  rastreamento: {
    setor_id: string;
    status: string;
  }[];
}

export function CIPGradeIndustrial() {
  const [setores, setSetores] = useState<SetorProdutivo[]>([]);
  const [ops, setOps] = useState<OPComRastreamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [setoresData, opsData] = await Promise.all([
      fetchSetores(),
      fetchOPsComRastreamento(),
    ]);
    setSetores(setoresData);
    setOps(opsData as OPComRastreamento[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCellClick = async (opId: string, setorId: string) => {
    setProcessing(`${opId}-${setorId}`);
    const result = await handleSetorClick(opId, setorId, setores);

    if (result.error) {
      toast.error(result.error);
    } else {
      const action = result.newStatus === 'entrada' ? '🟡 Entrada registrada' : '🟢 Baixa registrada';
      toast.success(action);
      await loadData();
    }
    setProcessing(null);
  };

  const getCellStatus = (op: OPComRastreamento, setorId: string): 'pendente' | 'entrada' | 'baixa' => {
    const track = op.rastreamento?.find((t) => t.setor_id === setorId);
    if (!track || track.status === 'pendente') return 'pendente';
    return track.status as 'entrada' | 'baixa';
  };

  const getCellClass = (status: 'pendente' | 'entrada' | 'baixa') => {
    switch (status) {
      case 'baixa':
        return 'bg-success/30 border-success/50 text-success cursor-default';
      case 'entrada':
        return 'bg-warning/30 border-warning/50 text-warning cursor-pointer hover:bg-warning/40';
      default:
        return 'bg-secondary/30 border-border/30 text-muted-foreground cursor-pointer hover:bg-secondary/50';
    }
  };

  const getCellLabel = (status: 'pendente' | 'entrada' | 'baixa') => {
    switch (status) {
      case 'baixa': return '✓';
      case 'entrada': return '▶';
      default: return '—';
    }
  };

  const cargaPorSetor = setores.map((s) => {
    const opsNoSetor = ops.filter((op) => {
      const track = op.rastreamento?.find((t) => t.setor_id === s.id);
      return track?.status === 'entrada';
    });
    const horasOcupadas = opsNoSetor.reduce((sum, op) => sum + Number(op.tempo_total || 0), 0);
    return { setorId: s.id, horas: horasOcupadas, opsCount: opsNoSetor.length };
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-cip" />
        <span className="ml-3 text-muted-foreground">Carregando grade industrial...</span>
      </div>
    );
  }

  if (ops.length === 0) {
    return (
      <div className="text-center py-16">
        <Factory className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
        <h3 className="text-xl font-bold text-foreground mb-2">Nenhuma OP em produção</h3>
        <p className="text-muted-foreground">Aprove pedidos no CIV para gerar OPs automaticamente.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg font-bold text-foreground">Grade Industrial — Apontamento por Setor</h3>
          <p className="text-xs text-muted-foreground">
            1º Clique = Entrada (🟡) → 2º Clique = Baixa (🟢) — Sequencial obrigatório
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-secondary/30 border border-border/30" />
          <span className="text-muted-foreground">Pendente</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-warning/30 border border-warning/50" />
          <span className="text-muted-foreground">Entrada</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-success/30 border border-success/50" />
          <span className="text-muted-foreground">Baixa</span>
        </div>
      </div>

      {/* Carga por setor */}
      <div className="flex gap-2 flex-wrap">
        {setores.map((s) => {
          const carga = cargaPorSetor.find((c) => c.setorId === s.id);
          return (
            <Badge key={s.id} variant="outline" className="text-xs">
              {s.nome.substring(0, 10)}: {carga?.opsCount || 0} OPs / {(carga?.horas || 0).toFixed(1)}h
            </Badge>
          );
        })}
      </div>

      {/* Grid */}
      <div className="overflow-x-auto rounded-xl border border-border/30 bg-card/80">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border/50 bg-secondary/30">
              <th className="text-left py-2.5 px-3 font-medium text-muted-foreground sticky left-0 bg-secondary/30 z-10 min-w-[160px]">
                OP / Produto
              </th>
              <th className="text-center py-2.5 px-1 font-medium text-muted-foreground min-w-[40px]">Qtd</th>
              <th className="text-center py-2.5 px-1 font-medium text-muted-foreground min-w-[40px]">Hrs</th>
              {setores.map((s) => (
                <th key={s.id} className="text-center py-2.5 px-1 font-medium text-muted-foreground min-w-[50px]">
                  <span className="block truncate" title={s.nome}>
                    {s.nome.substring(0, 6)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ops.map((op) => {
              const displayMask = getOPDisplayMask(
                op.numero_op,
                op.sequence_number,
                op.total_ops_at_generation
              );
              return (
                <tr key={op.id} className="border-b border-border/30 hover:bg-secondary/20">
                  <td className="py-2 px-3 sticky left-0 bg-card/80 z-10">
                    <div className="flex items-center gap-1">
                      <div className="font-mono font-bold text-foreground">{displayMask}</div>
                      <button onClick={() => imprimirOP(op.id)} className="text-muted-foreground hover:text-foreground" title="Imprimir OP">
                        <Printer className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="text-muted-foreground truncate max-w-[150px]">{op.produto_nome}</div>
                  </td>
                  <td className="text-center py-2 px-1 text-foreground font-bold">{op.quantidade}</td>
                  <td className="text-center py-2 px-1 text-cip font-bold">{Number(op.tempo_total).toFixed(1)}</td>
                  {setores.map((s) => {
                    const status = getCellStatus(op, s.id);
                    const isProcessing = processing === `${op.id}-${s.id}`;
                    return (
                      <td key={s.id} className="text-center py-1 px-0.5">
                        <button
                          onClick={() => status !== 'baixa' && handleCellClick(op.id, s.id)}
                          disabled={isProcessing || status === 'baixa'}
                          className={cn(
                            'w-10 h-8 rounded border text-xs font-bold transition-all',
                            getCellClass(status),
                            isProcessing && 'animate-pulse'
                          )}
                          title={`${displayMask} → ${s.nome}: ${status}`}
                        >
                          {isProcessing ? '...' : getCellLabel(status)}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
