import { supabase } from "@/integrations/supabase/client";
import {
  fetchConfigCapacidade,
  fetchCargaCarteira,
  calcularDiasProducao,
  calcularDataEntrega,
} from "./capacidadeService";

interface ItemPedido {
  id?: string; // existing item id (when loading from DB)
  produto_nome: string;
  produto_id?: string;
  quantidade: number;
  tempo_unitario: number;
  valor_unitario: number;
  observacoes?: string;
  fraction_count?: number; // how many OPs to split this item into (>=1)
}

/**
 * Approve a pedido:
 * 1. Load or insert itens_pedido
 * 2. Create familia_op
 * 3. Create OPs per item respecting fraction_count
 * 4. Calculate prazo from finite capacity
 * 5. Create op_route_steps snapshot
 * 6. Update pedido status + prazo
 * 7. Lock the pedido (immutable after OP generation)
 */
export async function aprovarPedido(
  pedidoId: string,
  itens: ItemPedido[]
): Promise<{ error: string | null; familiaNumero?: string; prazoEntrega?: string }> {
  try {
    // 0. Idempotency check — prevent double-approval
    const { data: existingOps } = await supabase
      .from("ops")
      .select("id")
      .eq("pedido_id", pedidoId)
      .limit(1);

    if (existingOps && existingOps.length > 0) {
      return { error: "Pedido já possui OPs geradas. Aprovação duplicada bloqueada." };
    }

    // 1. Fetch capacity config
    const config = await fetchConfigCapacidade();
    const cargaCarteira = await fetchCargaCarteira();

    // 2. Calculate total hours for new order
    const cargaNovoPedido = itens.reduce((sum, item) => {
      const tempo = (item.quantidade || 0) * (item.tempo_unitario || 0);
      return sum + (isNaN(tempo) ? 0 : tempo);
    }, 0);

    // 3. Calculate deadline
    const cargaTotal = cargaCarteira + cargaNovoPedido;
    const diasProducao = calcularDiasProducao(cargaTotal, config.capacidade_produtiva_diaria);
    const dataEntrega = calcularDataEntrega(new Date(), diasProducao, config.considerar_sabado);
    const prazoEntregaStr = dataEntrega.toISOString().split("T")[0];

    // 4. Ensure itens_pedido exist in DB
    let dbItens: Array<{
      id: string;
      produto_nome: string;
      produto_id: string | null;
      quantidade: number;
      tempo_unitario: number;
      valor_unitario: number;
      tempo_total: number | null;
      fraction_count: number;
    }>;

    // Check if items already exist
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
        tempo_total: Number(i.tempo_total) || i.quantidade * Number(i.tempo_unitario),
        fraction_count: (i as any).fraction_count || 1,
      }));
    } else {
      // Insert items
      const itensToInsert = itens.map((item) => ({
        pedido_id: pedidoId,
        produto_nome: item.produto_nome,
        produto_id: item.produto_id || null,
        quantidade: item.quantidade,
        tempo_unitario: item.tempo_unitario,
        valor_unitario: item.valor_unitario,
        tempo_total: item.quantidade * item.tempo_unitario,
        valor_total: item.quantidade * item.valor_unitario,
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
        tempo_total: Number(i.tempo_total) || i.quantidade * Number(i.tempo_unitario),
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

    // 6. Calculate total OPs across all items (sum of all fraction_counts)
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

    // 8. Create OPs — 1/N logic with fraction_count
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
      let remainder = item.quantidade - baseQty * fractions;

      for (let f = 0; f < fractions; f++) {
        globalSequence++;
        // Last fraction gets the remainder
        let qtyThisOp = baseQty;
        if (f === fractions - 1) {
          qtyThisOp += remainder;
        }

        // tempo_total is GENERATED by the database (quantidade * tempo_unitario)
        // NEVER include it in the insert payload

        // Dynamic mask: single OP = just order number, multiple = order-seq/total
        const numeroOp = totalOPsPedido === 1
          ? codigoPedido
          : `${codigoPedido}-${globalSequence}/${totalOPsPedido}`;

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

    // 9. Create op_route_steps snapshot (copy current setores as route for each OP)
    const { data: setoresAtivos } = await supabase
      .from("setores_produtivos")
      .select("id, ordem")
      .eq("ativo", true)
      .order("ordem", { ascending: true });

    if (setoresAtivos && insertedOps) {
      const routeSteps = insertedOps.flatMap((op) =>
        setoresAtivos.map((setor) => ({
          op_id: op.id,
          setor_id: setor.id,
          ordem: setor.ordem,
          tempo_estimado: (Number(op.quantidade) * Number(op.tempo_unitario)) / setoresAtivos.length,
        }))
      );

      if (routeSteps.length > 0) {
        await supabase.from("op_route_steps").insert(routeSteps);
      }

      // Also create setor_rastreamento entries for tracking
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

    // 10. Update pedido — mark as programado + lock
    const { error: pedidoError } = await supabase
      .from("pedidos")
      .update({
        status: "programado",
        status_producao: "programado",
        prazo_entrega: prazoEntregaStr,
        prazo_calculado_dias: diasProducao,
        op: codigoPedido,
      })
      .eq("id", pedidoId);

    if (pedidoError) {
      return { error: `Erro ao atualizar pedido: ${pedidoError.message}` };
    }

    // 11. Log action
    await supabase.from("action_logs").insert({
      action: "aprovar_pedido",
      entity: "pedidos",
      entity_id: pedidoId,
      status: "success",
      details: {
        familia: codigoPedido,
        total_ops: totalOPsPedido,
        carga_horas: cargaNovoPedido,
        prazo_dias: diasProducao,
        prazo_entrega: prazoEntregaStr,
      } as any,
    });

    return { error: null, familiaNumero: codigoPedido, prazoEntrega: prazoEntregaStr };
  } catch (e: any) {
    return { error: e.message || "Erro desconhecido na aprovação" };
  }
}

/**
 * Check if all OPs for a pedido are finalized and auto-close the pedido.
 * Called after every setor baixa.
 */
export async function verificarFechamentoPedido(opId: string): Promise<void> {
  try {
    // Get pedido_id from OP
    const { data: op } = await supabase
      .from("ops")
      .select("pedido_id, familia_op_id")
      .eq("id", opId)
      .single();

    if (!op?.pedido_id) return;

    // Check all OPs for this pedido
    const { data: allOps } = await supabase
      .from("ops")
      .select("id, status_producao")
      .eq("pedido_id", op.pedido_id);

    if (!allOps || allOps.length === 0) return;

    const allFinalized = allOps.every(
      (o) => o.status_producao === "Producao Finalizada"
    );

    if (allFinalized) {
      // Auto-close the pedido
      await supabase
        .from("pedidos")
        .update({
          status: "finalizado",
          status_producao: "finalizado",
        })
        .eq("id", op.pedido_id);

      // Update familia_op status
      if (op.familia_op_id) {
        await supabase
          .from("familia_op")
          .update({ status: "finalizada" })
          .eq("id", op.familia_op_id);
      }

      // Log
      await supabase.from("action_logs").insert({
        action: "pedido_auto_finalizado",
        entity: "pedidos",
        entity_id: op.pedido_id,
        status: "success",
        details: { total_ops: allOps.length } as any,
      });
    }
  } catch (e) {
    console.error("[AUTO_CLOSE] Erro:", e);
  }
}

/**
 * Generate the display mask for an OP.
 * - If total_ops == 1: show just the order number "1025"
 * - If total_ops > 1: show "1025-1/3" format
 */
export function getOPDisplayMask(
  numeroOp: string,
  sequenceNumber: number | null,
  totalOps: number | null
): string {
  // numero_op is already stored with the correct mask from generation
  // Single OP: "1025", Multiple: "1025-1/3"
  return numeroOp;
}
