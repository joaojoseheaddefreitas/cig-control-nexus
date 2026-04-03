import { supabase } from "@/integrations/supabase/client";

export interface MaterialFaltante {
  material_nome: string;
  material_codigo: string;
  necessidade: number;
  estoque_atual: number;
  deficit: number;
  lead_time_dias: number;
  unidade: string;
}

/**
 * Check material availability for an order based on BOM.
 * Returns shortage info if materials are insufficient.
 */
export async function verificarMateriaisPedido(
  produtoNome: string,
  quantidade: number
): Promise<{ disponivel: boolean; faltantes: MaterialFaltante[]; maiorLeadTime: number }> {
  // Find product by name
  const { data: produtos } = await supabase
    .from("produtos")
    .select("id")
    .eq("nome", produtoNome)
    .limit(1);

  if (!produtos || produtos.length === 0) {
    return { disponivel: true, faltantes: [], maiorLeadTime: 0 };
  }

  const produtoId = produtos[0].id;

  // Get BOM
  const { data: bom } = await supabase
    .from("bom_produto")
    .select("material_id, quantidade_por_unidade")
    .eq("produto_id", produtoId);

  if (!bom || bom.length === 0) {
    return { disponivel: true, faltantes: [], maiorLeadTime: 0 };
  }

  // Get materials
  const materialIds = bom.map(b => b.material_id);
  const { data: materiais } = await supabase
    .from("materiais")
    .select("id, nome, codigo, estoque_atual, lead_time_dias, unidade")
    .in("id", materialIds);

  const faltantes: MaterialFaltante[] = [];
  let maiorLeadTime = 0;

  for (const item of bom) {
    const mat = (materiais || []).find(m => m.id === item.material_id);
    if (!mat) continue;

    const necessidade = Number(item.quantidade_por_unidade) * quantidade;
    const estoque = Number(mat.estoque_atual);

    if (estoque < necessidade) {
      const deficit = necessidade - estoque;
      faltantes.push({
        material_nome: mat.nome,
        material_codigo: mat.codigo,
        necessidade,
        estoque_atual: estoque,
        deficit,
        lead_time_dias: mat.lead_time_dias,
        unidade: mat.unidade,
      });
      if (mat.lead_time_dias > maiorLeadTime) {
        maiorLeadTime = mat.lead_time_dias;
      }
    }
  }

  return { disponivel: faltantes.length === 0, faltantes, maiorLeadTime };
}

/**
 * Perform automatic BOM-based stock deduction when an order is confirmed/closed.
 */
export async function baixaAutomaticaBOM(
  produtoNome: string,
  quantidade: number,
  pedidoId?: string
): Promise<{ error: string | null; faltantes: MaterialFaltante[] }> {
  // Check availability first
  const check = await verificarMateriaisPedido(produtoNome, quantidade);

  if (!check.disponivel) {
    return { error: "Materiais insuficientes", faltantes: check.faltantes };
  }

  // Find product
  const { data: produtos } = await supabase
    .from("produtos")
    .select("id")
    .eq("nome", produtoNome)
    .limit(1);

  if (!produtos || produtos.length === 0) {
    return { error: null, faltantes: [] };
  }

  const produtoId = produtos[0].id;

  // Get BOM
  const { data: bom } = await supabase
    .from("bom_produto")
    .select("material_id, quantidade_por_unidade")
    .eq("produto_id", produtoId);

  if (!bom || bom.length === 0) {
    return { error: null, faltantes: [] };
  }

  // Deduct each material
  for (const item of bom) {
    const consumo = Number(item.quantidade_por_unidade) * quantidade;

    // Get current stock
    const { data: mat } = await supabase
      .from("materiais")
      .select("estoque_atual, valor_unitario")
      .eq("id", item.material_id)
      .single();

    if (!mat) continue;

    // Record movement
    await (supabase as any).from("movimentacoes_materiais").insert({
      material_id: item.material_id,
      tipo: "consumo_op",
      quantidade: consumo,
      valor_total: consumo * Number(mat.valor_unitario),
      op_id: null,
      motivo: `Baixa automática BOM - Pedido ${pedidoId || 'N/A'}`,
      usuario: "Sistema",
    });

    // Update stock
    const novoEstoque = Math.max(0, Number(mat.estoque_atual) - consumo);
    await supabase
      .from("materiais")
      .update({ estoque_atual: novoEstoque })
      .eq("id", item.material_id);
  }

  return { error: null, faltantes: [] };
}

/**
 * Calculate final delivery deadline including material lead times.
 * prazoFinal = (cargaTotal / capacidadeDiaria) + maiorLeadTime dos faltantes
 */
export async function calcularPrazoComMateriais(
  produtoNome: string,
  quantidade: number,
  tempoUnitario: number,
  capacidadeDiaria: number
): Promise<{ diasProducao: number; diasLeadTime: number; prazoTotal: number }> {
  const cargaHoras = tempoUnitario * quantidade;
  const diasProducao = capacidadeDiaria > 0 ? Math.ceil(cargaHoras / capacidadeDiaria) : 0;

  const check = await verificarMateriaisPedido(produtoNome, quantidade);
  const diasLeadTime = check.maiorLeadTime;

  return {
    diasProducao,
    diasLeadTime,
    prazoTotal: diasProducao + diasLeadTime,
  };
}
