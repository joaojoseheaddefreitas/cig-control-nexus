import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { fetchConfigCapacidade } from '@/services/capacidadeService';
import { fetchCarteiraHoras } from '@/services/carteiraService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { KPICard } from '@/components/ui/KPICard';
import { RefreshCw, ArrowUpDown, Clock, Factory, Package, BarChart3, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { imprimirOP } from '@/services/printService';

interface OPFila {
  id: string;
  numero_op: string;
  produto_nome: string;
  quantidade: number;
  tempo_unitario: number;
  tempo_total: number;
  status_producao: string;
  sequencia_fila: number;
  prazo_entrega: string | null;
  current_sector: string | null;
  pedido_id: string | null;
}

export function CIPFilaProducao() {
  const [ops, setOps] = useState<OPFila[]>([]);
  const [loading, setLoading] = useState(true);
  const [horasCarteira, setHorasCarteira] = useState(0);
  const [capacidadeDiaria, setCapacidadeDiaria] = useState(8);
  const [reordering, setReordering] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [opsResult, carteira, config] = await Promise.all([
      supabase
        .from("ops")
        .select("id, numero_op, produto_nome, quantidade, tempo_unitario, tempo_total, status_producao, sequencia_fila, prazo_entrega, current_sector, pedido_id")
        .neq("status_producao", "Producao Finalizada")
        .neq("status_producao", "cancelado")
        .order("sequencia_fila", { ascending: true }),
      fetchCarteiraHoras(),
      fetchConfigCapacidade(),
    ]);

    if (opsResult.data) {
      setOps(opsResult.data as any as OPFila[]);
    }
    setHorasCarteira(carteira);
    setCapacidadeDiaria(config.capacidade_produtiva_diaria);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalHoras = ops.reduce((s, op) => s + Number(op.tempo_total || 0), 0);
  const opsAguardando = ops.filter(o => o.status_producao === 'aguardando').length;
  const opsEmProducao = ops.filter(o => o.status_producao === 'em_producao').length;
  const diasEstimados = capacidadeDiaria > 0 ? Math.ceil(totalHoras / capacidadeDiaria) : 0;

  const handleMoveUp = async (index: number) => {
    if (index <= 0) return;
    const op = ops[index];
    const opAbove = ops[index - 1];

    setReordering(op.id);

    // Swap sequencia_fila values
    await Promise.all([
      supabase.from("ops").update({ sequencia_fila: opAbove.sequencia_fila } as any).eq("id", op.id),
      supabase.from("ops").update({ sequencia_fila: op.sequencia_fila } as any).eq("id", opAbove.id),
    ]);

    toast.success(`OP ${op.numero_op} movida para cima`);
    await loadData();
    setReordering(null);
  };

  const handleMoveDown = async (index: number) => {
    if (index >= ops.length - 1) return;
    const op = ops[index];
    const opBelow = ops[index + 1];

    setReordering(op.id);

    await Promise.all([
      supabase.from("ops").update({ sequencia_fila: opBelow.sequencia_fila } as any).eq("id", op.id),
      supabase.from("ops").update({ sequencia_fila: op.sequencia_fila } as any).eq("id", opBelow.id),
    ]);

    toast.success(`OP ${op.numero_op} movida para baixo`);
    await loadData();
    setReordering(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aguardando':
        return <Badge variant="outline" className="text-xs bg-secondary/30">Aberta</Badge>;
      case 'em_producao':
        return <Badge variant="outline" className="text-xs bg-warning/20 text-warning border-warning/30">Em Produção</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-cip" />
        <span className="ml-3 text-muted-foreground">Carregando fila de produção...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="Horas na Carteira" value={`${horasCarteira.toFixed(1)}h`} subtitle="Acumuladas" icon={<BarChart3 className="h-5 w-5" />} variant="cip" />
        <KPICard title="OPs na Fila" value={ops.length} subtitle={`${opsAguardando} abertas / ${opsEmProducao} em produção`} icon={<Package className="h-5 w-5" />} variant="cip" />
        <KPICard title="Horas Programadas" value={`${totalHoras.toFixed(1)}h`} subtitle="Total OPs ativas" icon={<Clock className="h-5 w-5" />} variant="cip" />
        <KPICard title="Dias Estimados" value={`${diasEstimados}d`} subtitle={`Capacidade: ${capacidadeDiaria}h/dia`} icon={<Factory className="h-5 w-5" />} variant="cip" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg font-bold text-foreground">Fila de Produção (FIFO)</h3>
          <p className="text-xs text-muted-foreground">
            Ordenada por sequência de aprovação. Reordene manualmente se necessário.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {ops.length === 0 ? (
        <div className="text-center py-16">
          <Factory className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-xl font-bold text-foreground mb-2">Fila vazia</h3>
          <p className="text-muted-foreground">Aprove pedidos no CIV para gerar OPs.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border/30 bg-card/80 overflow-hidden max-h-[600px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-secondary/30 sticky top-0 z-10">
                <th className="text-center py-2.5 px-2 text-muted-foreground font-medium w-12">#</th>
                <th className="text-left py-2.5 px-3 text-muted-foreground font-medium">OP</th>
                <th className="text-left py-2.5 px-3 text-muted-foreground font-medium hidden md:table-cell">Produto</th>
                <th className="text-center py-2.5 px-2 text-muted-foreground font-medium">Qtd</th>
                <th className="text-center py-2.5 px-2 text-muted-foreground font-medium">Horas</th>
                <th className="text-center py-2.5 px-2 text-muted-foreground font-medium hidden lg:table-cell">Prazo</th>
                <th className="text-center py-2.5 px-2 text-muted-foreground font-medium">Status</th>
                <th className="text-center py-2.5 px-2 text-muted-foreground font-medium hidden md:table-cell">Setor</th>
                <th className="text-center py-2.5 px-2 text-muted-foreground font-medium w-20">Ordem</th>
                <th className="text-center py-2.5 px-2 text-muted-foreground font-medium w-10">🖨</th>
              </tr>
            </thead>
            <tbody>
              {ops.map((op, index) => (
                <tr key={op.id} className="border-b border-border/30 hover:bg-secondary/20">
                  <td className="text-center py-2 px-2 text-muted-foreground font-mono text-xs">{index + 1}</td>
                  <td className="py-2 px-3 font-mono font-bold text-foreground">{op.numero_op}</td>
                  <td className="py-2 px-3 text-muted-foreground hidden md:table-cell truncate max-w-[150px]">{op.produto_nome}</td>
                  <td className="text-center py-2 px-2 text-foreground font-bold">{op.quantidade}</td>
                  <td className="text-center py-2 px-2 text-cip font-bold">{Number(op.tempo_total).toFixed(1)}</td>
                  <td className="text-center py-2 px-2 text-muted-foreground hidden lg:table-cell text-xs">
                    {op.prazo_entrega ? new Date(op.prazo_entrega).toLocaleDateString('pt-BR') : '—'}
                  </td>
                  <td className="text-center py-2 px-2">{getStatusBadge(op.status_producao)}</td>
                  <td className="text-center py-2 px-2 text-muted-foreground hidden md:table-cell text-xs">{op.current_sector || '—'}</td>
                  <td className="text-center py-2 px-2">
                    <div className="flex items-center justify-center gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        disabled={index === 0 || reordering === op.id}
                        onClick={() => handleMoveUp(index)}
                      >
                        <ArrowUpDown className="h-3 w-3 rotate-180" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        disabled={index === ops.length - 1 || reordering === op.id}
                        onClick={() => handleMoveDown(index)}
                      >
                        <ArrowUpDown className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                  <td className="text-center py-2 px-2">
                    <Button variant="ghost" size="icon" className="h-6 w-6" title="Imprimir OP" onClick={() => imprimirOP(op.id)}>
                      <Printer className="h-3 w-3" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
