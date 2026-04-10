import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ModuleCard } from '@/components/ui/ModuleCard';
import { KPICard } from '@/components/ui/KPICard';
import {
  ClipboardList, AlertTriangle, ShoppingCart, CheckCircle2, RefreshCw,
  TrendingUp, Zap, AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchMateriais, type Material } from '@/services/materiaisService';
import { fetchPedidosCompra, criarPedidoCompra, type PedidoCompra } from '@/services/pedidoCompraService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function CICMRP() {
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [pedidosCompra, setPedidosCompra] = useState<PedidoCompra[]>([]);
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [fornecedorMateriais, setFornecedorMateriais] = useState<any[]>([]);
  const [contasPagar, setContasPagar] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const [mats, pcs, fornData, fmData, cpData] = await Promise.all([
      fetchMateriais(),
      fetchPedidosCompra(),
      supabase.from('fornecedores').select('*').eq('ativo', true).order('nome'),
      supabase.from('fornecedor_materiais').select('*').eq('status', 'ativo'),
      supabase.from('contas_pagar').select('*').eq('status', 'pendente'),
    ]);
    setMateriais(mats);
    setPedidosCompra(pcs);
    setFornecedores(fornData.data || []);
    setFornecedorMateriais(fmData.data || []);
    setContasPagar(cpData.data || []);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const hoje = new Date();
  const hojeStr = hoje.toISOString().split('T')[0];

  const necessidades = useMemo(() => {
    return materiais.map(m => {
      const pcAbertos = pedidosCompra
        .filter(p => p.material_id === m.id && !['recebido', 'cancelado'].includes(p.status))
        .reduce((s, p) => s + p.quantidade, 0);

      // Lead time priority: fornecedor preferencial > material padrão
      const fornPref = fornecedorMateriais.find(fm => fm.material_id === m.id && fm.fornecedor_preferencial);
      const leadTimeEfetivo = fornPref ? fornPref.lead_time_dias : m.lead_time_dias;
      const margem = (m.margem_seguranca_percentual || 20) / 100;

      const estoqueDisponivel = Math.max(0, m.estoque_atual - m.estoque_minimo);
      const coberturaDias = m.consumo_medio_diario > 0 ? m.estoque_atual / m.consumo_medio_diario : 999;
      const coberturaComPC = m.consumo_medio_diario > 0 ? (m.estoque_atual + pcAbertos) / m.consumo_medio_diario : 999;

      // PP calculation
      const pontoPedidoCalc = m.consumo_medio_diario * leadTimeEfetivo * (1 + margem);
      const necessidadeLeadTime = m.consumo_medio_diario * leadTimeEfetivo;

      // Necessidade de compra
      let necessidadeCompra = (m.consumo_medio_diario * leadTimeEfetivo * (1 + margem)) - (estoqueDisponivel + pcAbertos);
      if (necessidadeCompra < 0) necessidadeCompra = 0;
      const proposta = necessidadeCompra > 0 ? Math.max(necessidadeCompra, m.lote_economico) : 0;

      const coberturaPercent = necessidadeLeadTime > 0 ? ((m.estoque_atual + pcAbertos) / necessidadeLeadTime) * 100 : 999;

      // Status compra
      let statusCompra: 'COMPRAR' | 'OK' | 'COBERTO' = 'OK';
      if (estoqueDisponivel <= pontoPedidoCalc && necessidadeCompra > 0) {
        statusCompra = pcAbertos > 0 ? 'COBERTO' : 'COMPRAR';
      }

      // Duas gavetas: gaveta1 zerou = COMPRAR
      if (m.tipo_controle === 'DUAS_GAVETAS' && m.gaveta2_ativa) {
        statusCompra = 'COMPRAR';
      }

      // Data de ruptura
      let dataRuptura: Date | null = null;
      if (m.consumo_medio_diario > 0 && coberturaDias < 999) {
        dataRuptura = new Date(hoje);
        dataRuptura.setDate(dataRuptura.getDate() + Math.floor(coberturaDias));
      }

      // Risco
      let risco: 'alto' | 'medio' | 'ok' = 'ok';
      if (coberturaDias < leadTimeEfetivo || m.gaveta2_ativa) risco = 'alto';
      else if (coberturaDias < leadTimeEfetivo * 1.5) risco = 'medio';

      return {
        ...m, pcAbertos, coberturaDias, coberturaComPC, necessidadeLeadTime,
        pontoPedidoCalc, necessidadeCompra, proposta, coberturaPercent, dataRuptura, risco,
        statusCompra, leadTimeEfetivo, estoqueDisponivel, margem,
        fornPref,
      };
    }).sort((a, b) => {
      const riscoOrder = { alto: 0, medio: 1, ok: 2 };
      return riscoOrder[a.risco] - riscoOrder[b.risco] || a.coberturaDias - b.coberturaDias;
    });
  }, [materiais, pedidosCompra, fornecedorMateriais]);

  const riscoAlto = necessidades.filter(n => n.risco === 'alto');
  const riscoMedio = necessidades.filter(n => n.risco === 'medio');
  const comProposta = necessidades.filter(n => n.proposta > 0);
  const valorTotalPropostas = comProposta.reduce((s, n) => s + n.proposta * n.valor_unitario, 0);

  const handleGerarPedido = async (mat: typeof necessidades[0]) => {
    // Validação financeira: verificar pendências do fornecedor
    const fornId = mat.fornPref?.fornecedor_id || mat.fornecedor_id;
    if (fornId) {
      const pendencias = contasPagar.filter(cp => 
        cp.fornecedor_id === fornId && 
        cp.status === 'pendente' && 
        cp.data_vencimento < hojeStr
      );
      if (pendencias.length > 0) {
        const valorPendente = pendencias.reduce((s: number, c: any) => s + Number(c.valor), 0);
        toast.warning(`⚠️ Atenção: Fornecedor com ${pendencias.length} pagamento(s) vencido(s) (R$ ${valorPendente.toFixed(2)}). Pedido será criado mesmo assim.`);
      }
    }

    const forn = fornecedores.find(f => f.id === fornId);
    const precoForn = mat.fornPref?.preco_atual || mat.valor_unitario;
    const { error } = await criarPedidoCompra({
      material_id: mat.id,
      material_nome: mat.nome,
      fornecedor_id: fornId || undefined,
      fornecedor_nome: forn?.nome || mat.fornecedor_nome || 'A definir',
      quantidade: mat.proposta,
      valor_unitario: precoForn,
      data_previsao: (() => { const d = new Date(); d.setDate(d.getDate() + mat.leadTimeEfetivo); return d.toISOString().split('T')[0]; })(),
      observacoes: `Gerado pelo MRP — PP: ${mat.pontoPedidoCalc.toFixed(0)} | Déficit: ${mat.necessidadeCompra.toFixed(0)} | Tipo: ${mat.tipo_controle}`,
    });
    if (error) { toast.error(error); return; }
    toast.success(`Pedido de compra gerado: ${mat.nome}`);
    loadData();
  };

  const fmtDate = (d: Date | null) => d ? d.toLocaleDateString('pt-BR') : '—';

  return (
    <div className="space-y-4">
      <div className="p-3 rounded-lg bg-warning/10 border border-warning/30">
        <div className="flex items-start gap-3">
          <ClipboardList className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <strong className="text-warning">MRP — Material Requirements Planning + Ponto de Pedido</strong>
            <p className="text-muted-foreground mt-1">Cálculo automático de necessidades com PP = Consumo × Lead Time × (1 + Margem%). Lead Time prioriza fornecedor preferencial. Modo Duas Gavetas: dispara compra quando Gaveta 1 zera.</p>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard title="Risco Alto" value={riscoAlto.length} subtitle="Cobertura < Lead Time" icon={<AlertTriangle className="h-5 w-5" />} variant="cic" trend={riscoAlto.length > 0 ? 'down' : 'up'} trendValue={riscoAlto.length > 0 ? '🔴 CRÍTICO' : '🟢 OK'} />
        <KPICard title="Risco Médio" value={riscoMedio.length} subtitle="Cobertura < 1.5x LT" icon={<TrendingUp className="h-5 w-5" />} variant="cic" />
        <KPICard title="Propostas" value={comProposta.length} subtitle="Materiais com sugestão" icon={<ShoppingCart className="h-5 w-5" />} variant="cic" />
        <KPICard title="Valor Propostas" value={`R$ ${(valorTotalPropostas / 1000).toFixed(0)}k`} subtitle="Investimento necessário" icon={<Zap className="h-5 w-5" />} variant="cic" />
      </div>

      {/* Risk table */}
      <ModuleCard title="Análise de Necessidades — Ponto de Pedido Integrado" variant="cic">
        <div className="flex items-center gap-2 mb-3">
          <Button variant="ghost" size="sm" onClick={loadData}>
            <RefreshCw className={cn("h-4 w-4 mr-1", loading && "animate-spin")} />Atualizar
          </Button>
        </div>
        <ScrollArea className="max-h-[500px]">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border/50 bg-secondary/30 sticky top-0 z-10">
              <th className="text-left py-2 px-3 text-muted-foreground font-medium text-xs">Material</th>
              <th className="text-center py-2 px-2 text-muted-foreground font-medium text-xs">Tipo</th>
              <th className="text-center py-2 px-2 text-muted-foreground font-medium text-xs">Consumo/Dia</th>
              <th className="text-center py-2 px-2 text-muted-foreground font-medium text-xs">Lead Time</th>
              <th className="text-center py-2 px-2 text-muted-foreground font-medium text-xs">Pto Pedido</th>
              <th className="text-center py-2 px-2 text-muted-foreground font-medium text-xs">Estoque Disp.</th>
              <th className="text-center py-2 px-2 text-muted-foreground font-medium text-xs">PC Abertos</th>
              <th className="text-center py-2 px-2 text-muted-foreground font-medium text-xs">Necessidade</th>
              <th className="text-center py-2 px-2 text-muted-foreground font-medium text-xs">Cobertura (d)</th>
              <th className="text-center py-2 px-2 text-muted-foreground font-medium text-xs">Data Ruptura</th>
              <th className="text-center py-2 px-2 text-muted-foreground font-medium text-xs">Status</th>
              <th className="text-center py-2 px-2 text-muted-foreground font-medium text-xs">Risco</th>
              <th className="text-center py-2 px-2 text-muted-foreground font-medium text-xs">Ação</th>
            </tr></thead>
            <tbody>
              {necessidades.filter(n => n.consumo_medio_diario > 0).map(n => (
                <tr key={n.id} className={cn("border-b border-border/30 hover:bg-secondary/30",
                  n.risco === 'alto' ? "bg-destructive/5" : n.risco === 'medio' ? "bg-warning/5" : ""
                )}>
                  <td className="py-2 px-3 font-medium text-xs">
                    {n.nome}
                    {n.gaveta2_ativa && <span className="ml-1 text-[9px] text-destructive font-bold">(G2 ativa)</span>}
                  </td>
                  <td className="py-2 px-2 text-center">
                    <Badge className={cn("text-[9px]", n.tipo_controle === 'DUAS_GAVETAS' ? 'bg-purple-500/20 text-purple-400' : 'bg-secondary text-muted-foreground')}>
                      {n.tipo_controle === 'DUAS_GAVETAS' ? '2GAV' : 'MRP'}
                    </Badge>
                  </td>
                  <td className="py-2 px-2 text-center text-xs text-muted-foreground">{n.consumo_medio_diario}</td>
                  <td className="py-2 px-2 text-center text-xs">
                    {n.leadTimeEfetivo}d
                    {n.fornPref && <span className="text-[8px] text-success ml-0.5">★</span>}
                  </td>
                  <td className="py-2 px-2 text-center text-xs font-semibold">{n.pontoPedidoCalc.toFixed(0)}</td>
                  <td className="py-2 px-2 text-center text-xs">{n.estoqueDisponivel} {n.unidade}</td>
                  <td className="py-2 px-2 text-center text-xs">{n.pcAbertos || '—'}</td>
                  <td className="py-2 px-2 text-center text-xs">{n.necessidadeCompra > 0 ? n.necessidadeCompra.toFixed(0) : '—'}</td>
                  <td className={cn("py-2 px-2 text-center text-xs font-bold",
                    n.risco === 'alto' ? "text-destructive" : n.risco === 'medio' ? "text-warning" : "text-success"
                  )}>{n.coberturaDias < 999 ? n.coberturaDias.toFixed(1) : '∞'}</td>
                  <td className="py-2 px-2 text-center text-xs text-muted-foreground">{fmtDate(n.dataRuptura)}</td>
                  <td className="py-2 px-2 text-center">
                    <Badge className={cn("text-[9px]",
                      n.statusCompra === 'COMPRAR' ? 'bg-destructive/20 text-destructive' :
                      n.statusCompra === 'COBERTO' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-success/20 text-success'
                    )}>
                      {n.statusCompra}
                    </Badge>
                  </td>
                  <td className="py-2 px-2 text-center">
                    <Badge className={cn("text-[10px]",
                      n.risco === 'alto' ? "bg-destructive/20 text-destructive" :
                      n.risco === 'medio' ? "bg-warning/20 text-warning" : "bg-success/20 text-success"
                    )}>
                      {n.risco === 'alto' ? '🔴 ALTO' : n.risco === 'medio' ? '🟡 MÉDIO' : '🟢 OK'}
                    </Badge>
                  </td>
                  <td className="py-2 px-2 text-center">
                    {n.statusCompra === 'COMPRAR' && n.proposta > 0 && (
                      <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => handleGerarPedido(n)}>
                        Gerar PC
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollArea>
      </ModuleCard>
    </div>
  );
}
