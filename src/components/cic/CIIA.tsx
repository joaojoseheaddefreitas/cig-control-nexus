import { useState, useEffect, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ModuleCard } from '@/components/ui/ModuleCard';
import { KPICard } from '@/components/ui/KPICard';
import { Button } from '@/components/ui/button';
import {
  Brain, Zap, AlertTriangle, TrendingUp, TrendingDown, ShieldCheck,
  ShoppingCart, Package, RefreshCw, CheckCircle2, OctagonAlert, Ban,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchMateriais, type Material } from '@/services/materiaisService';
import { fetchPedidosCompra, type PedidoCompra } from '@/services/pedidoCompraService';

interface Insight {
  tipo: 'comprar' | 'evitar' | 'risco' | 'oportunidade' | 'info';
  titulo: string;
  descricao: string;
  urgencia: 'alta' | 'media' | 'baixa';
  material?: string;
}

export function CIIA() {
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [pedidosCompra, setPedidosCompra] = useState<PedidoCompra[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const [mats, pcs] = await Promise.all([fetchMateriais(), fetchPedidosCompra()]);
    setMateriais(mats);
    setPedidosCompra(pcs);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const insights = useMemo<Insight[]>(() => {
    const result: Insight[] = [];
    const hoje = new Date();

    // Materials below reorder point
    materiais.filter(m => m.estoque_atual < m.ponto_pedido && m.consumo_medio_diario > 0).forEach(m => {
      const cobertura = m.estoque_atual / m.consumo_medio_diario;
      const hasPCAberto = pedidosCompra.some(p => p.material_id === m.id && !['recebido', 'cancelado'].includes(p.status));
      if (!hasPCAberto) {
        result.push({
          tipo: 'comprar',
          titulo: `Comprar: ${m.nome}`,
          descricao: `Estoque em ${m.estoque_atual} ${m.unidade} (ponto pedido: ${m.ponto_pedido}). Cobertura de apenas ${cobertura.toFixed(1)} dias. Sem pedido de compra em aberto.`,
          urgencia: cobertura < m.lead_time_dias ? 'alta' : 'media',
          material: m.nome,
        });
      }
    });

    // Stoppage risk
    materiais.filter(m => m.consumo_medio_diario > 0).forEach(m => {
      const pcAbertos = pedidosCompra
        .filter(p => p.material_id === m.id && !['recebido', 'cancelado'].includes(p.status))
        .reduce((s, p) => s + p.quantidade, 0);
      const cobertura = (m.estoque_atual + pcAbertos) / m.consumo_medio_diario;
      if (cobertura < m.lead_time_dias) {
        result.push({
          tipo: 'risco',
          titulo: `⚠ Risco de Parada: ${m.nome}`,
          descricao: `Cobertura de ${cobertura.toFixed(1)} dias (lead time: ${m.lead_time_dias}d). Mesmo com ${pcAbertos} un. em pedidos, o estoque não cobre o prazo de reposição.`,
          urgencia: 'alta',
          material: m.nome,
        });
      }
    });

    // Overstock
    materiais.filter(m => m.estoque_maximo > 0 && m.estoque_atual > m.estoque_maximo).forEach(m => {
      result.push({
        tipo: 'evitar',
        titulo: `Excesso: ${m.nome}`,
        descricao: `Estoque em ${m.estoque_atual} ${m.unidade}, acima do máximo (${m.estoque_maximo}). Valor parado: R$ ${((m.estoque_atual - m.estoque_maximo) * m.valor_unitario).toLocaleString('pt-BR')}.`,
        urgencia: 'baixa',
        material: m.nome,
      });
    });

    // Late POs
    const lateCount = pedidosCompra.filter(p => p.data_previsao && p.data_previsao < hoje.toISOString().split('T')[0] && !['recebido', 'cancelado'].includes(p.status)).length;
    if (lateCount > 0) {
      result.push({
        tipo: 'risco',
        titulo: `${lateCount} Pedidos de Compra Atrasados`,
        descricao: `Existem ${lateCount} pedidos com previsão vencida. Risco de desabastecimento se não forem cobrados ou substituídos.`,
        urgencia: lateCount > 3 ? 'alta' : 'media',
      });
    }

    // Good coverage
    const matsBons = materiais.filter(m => m.consumo_medio_diario > 0 && (m.estoque_atual / m.consumo_medio_diario) > m.lead_time_dias * 2);
    if (matsBons.length > 5) {
      result.push({
        tipo: 'oportunidade',
        titulo: `${matsBons.length} Materiais com Boa Cobertura`,
        descricao: `Materiais com cobertura superior a 2x o lead time. Oportunidade de negociar melhores preços com fornecedores em compras programadas.`,
        urgencia: 'baixa',
      });
    }

    // Zero consumption
    const zeroCons = materiais.filter(m => m.consumo_medio_diario === 0 && m.estoque_atual > 0);
    if (zeroCons.length > 0) {
      const valorParado = zeroCons.reduce((s, m) => s + (m.valor_estoque || 0), 0);
      result.push({
        tipo: 'info',
        titulo: `${zeroCons.length} Materiais Sem Consumo`,
        descricao: `Materiais com estoque mas sem consumo registrado. Valor parado: R$ ${valorParado.toLocaleString('pt-BR')}. Verificar se são obsoletos ou sazonais.`,
        urgencia: 'baixa',
      });
    }

    return result.sort((a, b) => {
      const urgOrder = { alta: 0, media: 1, baixa: 2 };
      return urgOrder[a.urgencia] - urgOrder[b.urgencia];
    });
  }, [materiais, pedidosCompra]);

  const iconMap = {
    comprar: <ShoppingCart className="h-5 w-5" />,
    evitar: <Ban className="h-5 w-5" />,
    risco: <OctagonAlert className="h-5 w-5" />,
    oportunidade: <TrendingUp className="h-5 w-5" />,
    info: <Package className="h-5 w-5" />,
  };

  const colorMap = {
    comprar: 'border-warning/50 bg-warning/10',
    evitar: 'border-blue-500/50 bg-blue-500/10',
    risco: 'border-destructive/50 bg-destructive/10',
    oportunidade: 'border-success/50 bg-success/10',
    info: 'border-muted/50 bg-secondary/30',
  };

  const textColorMap = {
    comprar: 'text-warning',
    evitar: 'text-blue-400',
    risco: 'text-destructive',
    oportunidade: 'text-success',
    info: 'text-muted-foreground',
  };

  const altas = insights.filter(i => i.urgencia === 'alta');
  const medias = insights.filter(i => i.urgencia === 'media');

  return (
    <div className="space-y-4">
      <div className="p-3 rounded-lg bg-cic/10 border border-cic/30">
        <div className="flex items-center gap-3">
          <Brain className="h-5 w-5 text-cic" />
          <div className="text-sm">
            <strong className="text-cic">Inteligência Artificial — CIC CONTROL</strong>
            <p className="text-muted-foreground mt-1">Insights automáticos baseados em dados reais de estoque, consumo, pedidos de compra e lead time dos fornecedores.</p>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard title="Alertas Críticos" value={altas.length} subtitle="Urgência alta" icon={<AlertTriangle className="h-5 w-5" />} variant="cic" trend={altas.length > 0 ? 'down' : 'up'} trendValue={altas.length > 0 ? 'Atenção' : 'OK'} />
        <KPICard title="Alertas Médios" value={medias.length} subtitle="Urgência média" icon={<TrendingDown className="h-5 w-5" />} variant="cic" />
        <KPICard title="Total Insights" value={insights.length} subtitle="Gerados pela IA" icon={<Zap className="h-5 w-5" />} variant="cic" />
        <KPICard title="Status" value={altas.length === 0 ? 'NORMAL' : 'ALERTA'} subtitle={altas.length === 0 ? '🟢 Operação segura' : '🔴 Ação necessária'} icon={<ShieldCheck className="h-5 w-5" />} variant="cic" />
      </div>

      {/* Insights */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">Painel de Insights</h3>
        <Button variant="ghost" size="sm" onClick={loadData}>
          <RefreshCw className={cn("h-4 w-4 mr-1", loading && "animate-spin")} />Atualizar
        </Button>
      </div>

      <ScrollArea className="max-h-[500px]">
        <div className="space-y-3">
          {insights.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-success opacity-50" />
              <p className="text-lg font-medium text-success">Operação Normal</p>
              <p className="text-sm mt-1">Nenhum alerta ou sugestão no momento.</p>
            </div>
          ) : insights.map((insight, i) => (
            <div key={i} className={cn("p-4 rounded-xl border-2", colorMap[insight.tipo])}>
              <div className="flex items-start gap-3">
                <div className={textColorMap[insight.tipo]}>{iconMap[insight.tipo]}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className={cn("font-bold text-sm", textColorMap[insight.tipo])}>{insight.titulo}</p>
                    <Badge className={cn("text-[9px]",
                      insight.urgencia === 'alta' ? 'bg-destructive/20 text-destructive' :
                      insight.urgencia === 'media' ? 'bg-warning/20 text-warning' : 'bg-secondary text-muted-foreground'
                    )}>{insight.urgencia.toUpperCase()}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{insight.descricao}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
