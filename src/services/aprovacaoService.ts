import { supabase } from "@/integrations/supabase/client";
import {
  fetchConfigCapacidade,
  calcularDataEntrega,
} from "./capacidadeService";
import {
  fetchCarteiraHoras,
  adicionarHorasCarteira,
  subtrairHorasCarteira,
} from "./carteiraService";
import { verificarMateriaisPedido } from "./pedidoBomService";
import { calcularPrazoPorGargalo } from "./prazoGargaloService";

interface ItemPedido {
  id?: string;
  produto_nome: string;
  produto_id?: string;
  quantidade: number;
  tempo_unitario: number;
  valor_unitario: number;
  observacoes?: string;
  fraction_count?: number;
}

/**
 * Approve a pedido — complete industrial flow:
 * 1. Idempotency check
 * 2. Load/insert itens_pedido (never send tempo_total)
 * 3. Calculate deadline from carteira_producao + new load
 * 4. Create familia_op
 * 5. Create OPs with 1/N logic (never send tempo_total)
 * 6. Snapshot route to op_route_steps
 * 7. Create setor_rastreamento entries
 * 8. Update carteira_producao
 * 9. Update pedido status + prazo + data_aprovacao
 */
export async function aprovarPedido(
  pedidoId: string,
  itens: ItemPedido[]
): Promise<{ error: string | null; familiaNumero?: string; prazoEntrega?: string }> {
  try {
    // 0. Idempotency — prevent double approval
    const { data: existingOps } = await supabase
      .from("ops")
      .select("id")
      .eq("pedido_id", pedidoId)
      .limit(1);

    if (existingOps && existingOps.length > 0) {
      return { error: "Pedido já possui OPs geradas. Aprovação duplicada bloqueada." };
    }

    // 1. Fetch capacity config + carteira hours
    const config = await fetchConfigCapacidade();
    const horasCarteira = await fetchCarteiraHoras();

    // 2. Calculate total hours for this order
    const cargaNovoPedido = itens.reduce((sum, item) => {
      const tempo = (item.quantidade || 0) * (item.tempo_unitario || 0);
      return sum + (isNaN(tempo) ? 0 : tempo);
    }, 0);

    // 3. PRAZO PELO GARGALO
    //    Regra: prazo (dias úteis) = ⌈(fila do gargalo + carga novo pedido no gargalo) / cap. diária do gargalo⌉
    //    Não usa capacidade total da fábrica nem soma das capacidades.
    const prazoGargalo = await calcularPrazoPorGargalo(
      itens.map(i => ({
        produto_id: i.produto_id,
        produto_nome: i.produto_nome,
        quantidade: i.quantidade,
      })),
      config.considerar_sabado
    );
    const diasProducao = prazoGargalo.prazoDiasUteis;

    // 3b. Get max lead time from BOM materials for all items
    let maiorLeadTimeMateriais = 0;
    for (const item of itens) {
      if (item.produto_nome) {
        const checkMat = await verificarMateriaisPedido(item.produto_nome, item.quantidade);
        if (checkMat.maiorLeadTime > maiorLeadTimeMateriais) {
          maiorLeadTimeMateriais = checkMat.maiorLeadTime;
        }
      }
    }

    // Also check product-level lead_time_produto
    const produtoNomes = [...new Set(itens.map(i => i.produto_nome))];
    if (produtoNomes.length > 0) {
      const { data: produtosLT } = await supabase
        .from("produtos")
        .select("nome, lead_time_produto, lead_time_manual")
        .in("nome", produtoNomes);
      if (produtosLT) {
        for (const p of produtosLT) {
          const lt = Number(p.lead_time_produto) || 0;
          if (lt > maiorLeadTimeMateriais) {
            maiorLeadTimeMateriais = lt;
          }
        }
      }
    }

    const prazoTotalDias = diasProducao + maiorLeadTimeMateriais;
    const dataEntrega = calcularDataEntrega(new Date(), prazoTotalDias, config.considerar_sabado);
    const prazoEntregaStr = dataEntrega.toISOString().split("T")[0];
    console.log(
      `[Aprovação] Gargalo: ${prazoGargalo.setorGargalo} | Fila: ${prazoGargalo.filaGargaloHoras.toFixed(1)}h | ` +
      `Novo: ${prazoGargalo.cargaNovoPedidoHoras.toFixed(1)}h | Cap/dia: ${prazoGargalo.capacidadeDiariaGargalo.toFixed(1)}h | ` +
      `Prazo prod: ${diasProducao}d + LT mat: ${maiorLeadTimeMateriais}d = ${prazoTotalDias}d → ${prazoEntregaStr}`
    );

    // 4. Ensure itens_pedido exist in DB (never send tempo_total)
    let dbItens: Array<{
      id: string;
      produto_nome: string;
      produto_id: string | null;
      quantidade: number;
      tempo_unitario: number;
      valor_unitario: number;
      fraction_count: number;
    }>;

    const { data: existingItens } = await supabase
      .from("itens_pedido")
      .select("*")
      .eq("pedido_id", pedidoId);

    if (existingItens && existingItens.length > 0) {
      dbItens = existingItens.map((i) => ({
        id: i.id,
        produto_nome: i.produto_nome,
        produto_id: i.produto_id || null,
        quantidade: i.quantidade,
        tempo_unitario: Number(i.tempo_unitario),
        valor_unitario: Number(i.valor_unitario),
        fraction_count: (i as any).fraction_count || 1,
      }));
    } else {
      // Insert items — NO tempo_total in payload
      const itensToInsert = itens.map((item) => ({
        pedido_id: pedidoId,
        produto_nome: item.produto_nome,
        produto_id: item.produto_id || null,
        quantidade: item.quantidade,
        tempo_unitario: item.tempo_unitario,
        valor_unitario: item.valor_unitario,
        // valor_total é coluna GERADA pelo banco — NUNCA incluir no payload
        observacoes: item.observacoes || null,
        fraction_count: Math.max(1, item.fraction_count || 1),
      }));

      const { data: inserted, error: itensError } = await supabase
        .from("itens_pedido")
        .insert(itensToInsert)
        .select();

      if (itensError || !inserted) {
        return { error: `Erro ao inserir itens: ${itensError?.message}` };
      }

      dbItens = inserted.map((i) => ({
        id: i.id,
        produto_nome: i.produto_nome,
        produto_id: i.produto_id || null,
        quantidade: i.quantidade,
        tempo_unitario: Number(i.tempo_unitario),
        valor_unitario: Number(i.valor_unitario),
        fraction_count: (i as any).fraction_count || 1,
      }));
    }

    // 5. Get pedido codigo for OP numbering
    const { data: pedidoData, error: pedidoFetchError } = await supabase
      .from("pedidos")
      .select("codigo")
      .eq("id", pedidoId)
      .single();

    if (pedidoFetchError || !pedidoData) {
      return { error: `Erro ao buscar pedido: ${pedidoFetchError?.message}` };
    }

    const codigoPedido = pedidoData.codigo;

    // 6. Calculate total OPs (sum of all fraction_counts)
    const totalOPsPedido = dbItens.reduce((sum, item) => sum + item.fraction_count, 0);

    // 7. Create familia_op
    const { data: familia, error: familiaError } = await supabase
      .from("familia_op")
      .insert({
        numero_familia: codigoPedido,
        pedido_id: pedidoId,
        total_ops: totalOPsPedido,
        tempo_total_familia: cargaNovoPedido,
        status: "aberta",
      })
      .select()
      .single();

    if (familiaError || !familia) {
      return { error: `Erro ao criar família OP: ${familiaError?.message}` };
    }

    // 8. Create OPs — 1/N logic. NEVER include tempo_total.
    // Numbering: single OP = order number, multiple = order-A, order-B, etc.
    let globalSequence = 0;
    const opsToInsert: Array<{
      familia_op_id: string;
      item_pedido_id: string;
      pedido_id: string;
      sequence_number: number;
      total_ops_at_generation: number;
      numero_op: string;
      produto_nome: string;
      quantidade: number;
      tempo_unitario: number;
      prazo_entrega: string;
      status_producao: string;
      status_faturamento: string;
    }> = [];

    for (const item of dbItens) {
      const fractions = Math.max(1, item.fraction_count);
      const baseQty = Math.floor(item.quantidade / fractions);
      const remainder = item.quantidade - baseQty * fractions;

      for (let f = 0; f < fractions; f++) {
        globalSequence++;
        let qtyThisOp = baseQty;
        if (f === fractions - 1) {
          qtyThisOp += remainder;
        }

        // Dynamic mask: single OP = order number, multiple = order 1/N, 2/N...
        const numeroOp = totalOPsPedido === 1
          ? codigoPedido
          : `${codigoPedido} ${globalSequence}/${totalOPsPedido}`;

        opsToInsert.push({
          familia_op_id: familia.id,
          item_pedido_id: item.id,
          pedido_id: pedidoId,
          sequence_number: globalSequence,
          total_ops_at_generation: totalOPsPedido,
          numero_op: numeroOp,
          produto_nome: item.produto_nome,
          quantidade: qtyThisOp,
          tempo_unitario: item.tempo_unitario,
          prazo_entrega: prazoEntregaStr,
          status_producao: "aguardando",
          status_faturamento: "pendente",
          // sequencia_fila auto-assigned by database sequence
          // tempo_total NEVER sent — GENERATED column
        });
      }
    }

    const { data: insertedOps, error: opsError } = await supabase
      .from("ops")
      .insert(opsToInsert)
      .select();

    if (opsError) {
      return { error: `Erro ao criar OPs: ${opsError.message}` };
    }

    // 9. Snapshot: copy active setores as route for each OP
    const { data: setoresAtivos } = await supabase
      .from("setores_produtivos")
      .select("id, ordem")
      .eq("ativo", true)
      .order("ordem", { ascending: true });

    if (setoresAtivos && insertedOps) {
      // Fetch produto_setor_tempos for per-sector time allocation
      const produtoIds = dbItens.map(i => i.produto_id).filter(Boolean) as string[];
      let temposPorSetor: Array<{ produto_id: string; setor_id: string; tempo_horas: number }> = [];
      if (produtoIds.length > 0) {
        const { data: temposData } = await supabase
          .from("produto_setor_tempos")
          .select("produto_id, setor_id, tempo_horas")
          .in("produto_id", produtoIds);
        temposPorSetor = (temposData || []) as any;
      }

      // Map item_pedido_id -> produto_id for lookup
      const itemProdutoMap: Record<string, string | null> = {};
      dbItens.forEach(i => { itemProdutoMap[i.id] = i.produto_id; });

      const routeSteps = insertedOps.flatMap((op) => {
        const produtoId = itemProdutoMap[op.item_pedido_id];
        return setoresAtivos.map((setor) => {
          // Try to find specific sector time from produto_setor_tempos
          const tempoSetor = produtoId
            ? temposPorSetor.find(t => t.produto_id === produtoId && t.setor_id === setor.id)
            : null;
          // horas_OP_setor = tempo_setor × quantidade
          const tempoEstimado = tempoSetor
            ? Number(tempoSetor.tempo_horas) * Number(op.quantidade)
            : (Number(op.quantidade) * Number(op.tempo_unitario)) / setoresAtivos.length;
          return {
            op_id: op.id,
            setor_id: setor.id,
            ordem: setor.ordem,
            tempo_estimado: tempoEstimado,
          };
        });
      });

      if (routeSteps.length > 0) {
        await supabase.from("op_route_steps").insert(routeSteps);
      }

      // Create setor_rastreamento entries for tracking
      const rastreamentoEntries = insertedOps.flatMap((op) =>
        setoresAtivos.map((setor) => ({
          op_id: op.id,
          setor_id: setor.id,
          status: "pendente",
        }))
      );

      if (rastreamentoEntries.length > 0) {
        await supabase.from("setor_rastreamento").insert(rastreamentoEntries);
      }
    }

    // 10. Update carteira_producao — add new load
    await adicionarHorasCarteira(cargaNovoPedido);

    // 11. Update pedido — mark as programado + lock + data_aprovacao
    const { error: pedidoError } = await supabase
      .from("pedidos")
      .update({
        status: "programado",
        status_producao: "programado",
        prazo_entrega: prazoEntregaStr,
        prazo_calculado_dias: prazoTotalDias,
        op: codigoPedido,
        data_aprovacao: new Date().toISOString(),
      } as any)
      .eq("id", pedidoId);

    if (pedidoError) {
      return { error: `Erro ao atualizar pedido: ${pedidoError.message}` };
    }

    // 12. Log action
    await supabase.from("action_logs").insert({
      action: "aprovar_pedido",
      entity: "pedidos",
      entity_id: pedidoId,
      status: "success",
      details: {
        familia: codigoPedido,
        total_ops: totalOPsPedido,
        carga_horas: cargaNovoPedido,
        prazo_dias: prazoTotalDias,
        lead_time_materiais: maiorLeadTimeMateriais,
        dias_producao: diasProducao,
        prazo_entrega: prazoEntregaStr,
        horas_carteira_antes: horasCarteira,
        horas_carteira_depois: horasCarteira + cargaNovoPedido,
      } as any,
    });

    return { error: null, familiaNumero: codigoPedido, prazoEntrega: prazoEntregaStr };
  } catch (e: any) {
    return { error: e.message || "Erro desconhecido na aprovação" };
  }
}

/**
 * Check if a pedido can be edited (all OPs still "aguardando").
 */
export async function verificarEdicaoPedido(pedidoId: string): Promise<{
  podeEditar: boolean;
  motivo?: string;
}> {
  const { data: ops } = await supabase
    .from("ops")
    .select("id, status_producao")
    .eq("pedido_id", pedidoId);

  if (!ops || ops.length === 0) {
    return { podeEditar: true };
  }

  const todasAbertas = ops.every((op) => op.status_producao === "aguardando");
  if (todasAbertas) {
    return { podeEditar: true };
  }

  return {
    podeEditar: false,
    motivo: "Existem OPs em produção ou finalizadas. Edição bloqueada.",
  };
}

/**
 * Anular (cancel) a pedido and its OPs.
 */
export async function anularPedido(pedidoId: string): Promise<{ error: string | null }> {
  try {
    const { data: ops } = await supabase
      .from("ops")
      .select("id, status_producao")
      .eq("pedido_id", pedidoId);

    if (!ops || ops.length === 0) {
      // No OPs, just cancel the pedido
      await supabase
        .from("pedidos")
        .update({ status: "cancelado", status_producao: "cancelado" })
        .eq("id", pedidoId);
      return { error: null };
    }

    const algumIniciada = ops.some(
      (op) => op.status_producao !== "aguardando" && op.status_producao !== "cancelado"
    );

    if (algumIniciada) {
      return { error: "Existem OPs já iniciadas. Anulação total bloqueada. Use encerramento administrativo." };
    }

    // All OPs are "aguardando" — cancel them and subtract hours from carteira
    const { data: itens } = await supabase
      .from("itens_pedido")
      .select("quantidade, tempo_unitario")
      .eq("pedido_id", pedidoId);

    const horasTotal = (itens || []).reduce(
      (sum, i) => sum + Number(i.quantidade) * Number(i.tempo_unitario),
      0
    );

    // Cancel OPs
    await supabase
      .from("ops")
      .update({ status_producao: "cancelado" })
      .eq("pedido_id", pedidoId);

    // Subtract from carteira
    await subtrairHorasCarteira(horasTotal);

    // Cancel pedido
    await supabase
      .from("pedidos")
      .update({ status: "cancelado", status_producao: "cancelado" })
      .eq("id", pedidoId);

    await supabase.from("action_logs").insert({
      action: "anular_pedido",
      entity: "pedidos",
      entity_id: pedidoId,
      status: "success",
      details: { horas_removidas: horasTotal } as any,
    });

    return { error: null };
  } catch (e: any) {
    return { error: e.message };
  }
}

/**
 * Check if all OPs for a pedido are finalized and auto-close the pedido.
 */
export async function verificarFechamentoPedido(opId: string): Promise<void> {
  try {
    const { data: op } = await supabase
      .from("ops")
      .select("pedido_id, familia_op_id")
      .eq("id", opId)
      .single();

    if (!op?.pedido_id) return;

    const { data: allOps } = await supabase
      .from("ops")
      .select("id, status_producao")
      .eq("pedido_id", op.pedido_id);

    if (!allOps || allOps.length === 0) return;

    const allFinalized = allOps.every(
      (o) => o.status_producao === "Producao Finalizada"
    );

    if (allFinalized) {
      await supabase
        .from("pedidos")
        .update({ status: "finalizado", status_producao: "finalizado" })
        .eq("id", op.pedido_id);

      if (op.familia_op_id) {
        await supabase
          .from("familia_op")
          .update({ status: "finalizada" })
          .eq("id", op.familia_op_id);
      }

      // Subtract hours from carteira (production complete)
      const { data: itens } = await supabase
        .from("itens_pedido")
        .select("quantidade, tempo_unitario")
        .eq("pedido_id", op.pedido_id);

      const horasTotal = (itens || []).reduce(
        (sum, i) => sum + Number(i.quantidade) * Number(i.tempo_unitario),
        0
      );
      await subtrairHorasCarteira(horasTotal);

      await supabase.from("action_logs").insert({
        action: "pedido_auto_finalizado",
        entity: "pedidos",
        entity_id: op.pedido_id,
        status: "success",
        details: { total_ops: allOps.length, horas_liberadas: horasTotal } as any,
      });
    }
  } catch (e) {
    console.error("[AUTO_CLOSE] Erro:", e);
  }
}

/**
 * Display mask for an OP (already stored correctly).
 */
export function getOPDisplayMask(
  numeroOp: string,
  _sequenceNumber: number | null,
  _totalOps: number | null
): string {
  return numeroOp;
}
