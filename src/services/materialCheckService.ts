import { supabase } from "@/integrations/supabase/client";

export interface MaterialNecessidade {
  material_id: string;
  material_nome: string;
  material_codigo: string;
  necessidade: number;
  estoque_atual: number;
  deficit: number;
  lead_time_dias: number;
  unidade: string;
  situacao: "falta" | "pouco" | "normal" | "elevado";
}

function getSituacao(
  estoque: number,
  minimo: number,
  maximo: number
): "falta" | "pouco" | "normal" | "elevado" {
  if (estoque <= 0) return "falta";
  if (estoque <= minimo) return "pouco";
  if (estoque > maximo && maximo > 0) return "elevado";
  return "normal";
}

/**
 * Check material availability for an OP before production start.
 * Returns list of materials needed, their stock status, and purchase needs.
 */
export async function verificarMateriaisOP(
  opId: string
): Promise<{
  disponivel: boolean;
  materiais: MaterialNecessidade[];
  maiorLeadTime: number;
}> {
  // Get OP details
  const { data: op } = await supabase
    .from("ops")
    .select("produto_nome, quantidade")
    .eq("id", opId)
    .single();

  if (!op) return { disponivel: true, materiais: [], maiorLeadTime: 0 };

  // Find product
  const { data: produtos } = await supabase
    .from("produtos")
    .select("id")
    .eq("nome", op.produto_nome)
    .limit(1);

  if (!produtos || produtos.length === 0) {
    return { disponivel: true, materiais: [], maiorLeadTime: 0 };
  }

  const produtoId = produtos[0].id;

  // Get BOM
  const { data: bom } = await supabase
    .from("bom_produto")
    .select("material_id, quantidade_por_unidade, lead_time_dias, unidade")
    .eq("produto_id", produtoId);

  if (!bom || bom.length === 0) {
    return { disponivel: true, materiais: [], maiorLeadTime: 0 };
  }

  // Get materials
  const materialIds = bom.map((b) => b.material_id);
  const { data: mats } = await supabase
    .from("materiais")
    .select("id, nome, codigo, estoque_atual, estoque_minimo, estoque_maximo, lead_time_dias, unidade")
    .in("id", materialIds);

  const materiais: MaterialNecessidade[] = [];
  let maiorLeadTime = 0;
  let disponivel = true;

  for (const item of bom) {
    const mat = (mats || []).find((m) => m.id === item.material_id);
    if (!mat) continue;

    const necessidade = Number(item.quantidade_por_unidade) * op.quantidade;
    const estoque = Number(mat.estoque_atual);
    const deficit = Math.max(0, necessidade - estoque);
    const lt = Number(item.lead_time_dias) || Number(mat.lead_time_dias) || 0;

    const situacao = getSituacao(estoque, Number(mat.estoque_minimo), Number(mat.estoque_maximo));

    materiais.push({
      material_id: mat.id,
      material_nome: mat.nome,
      material_codigo: mat.codigo,
      necessidade,
      estoque_atual: estoque,
      deficit,
      lead_time_dias: lt,
      unidade: item.unidade || mat.unidade,
      situacao,
    });

    if (deficit > 0) {
      disponivel = false;
      if (lt > maiorLeadTime) maiorLeadTime = lt;
    }
  }

  return { disponivel, materiais, maiorLeadTime };
}

/**
 * Calculate purchase needs for all OPs with status "aguardando" or "programado".
 */
export async function calcularNecessidadesCompra(): Promise<MaterialNecessidade[]> {
  const { data: ops } = await supabase
    .from("ops")
    .select("id, produto_nome, quantidade")
    .in("status_producao", ["aguardando", "programado"]);

  if (!ops || ops.length === 0) return [];

  // Aggregate needs by product
  const produtoQtds: Record<string, number> = {};
  for (const op of ops) {
    produtoQtds[op.produto_nome] = (produtoQtds[op.produto_nome] || 0) + op.quantidade;
  }

  // Get all products
  const nomes = Object.keys(produtoQtds);
  const { data: produtos } = await supabase
    .from("produtos")
    .select("id, nome")
    .in("nome", nomes);

  if (!produtos || produtos.length === 0) return [];

  const produtoIds = produtos.map((p) => p.id);
  const { data: allBom } = await supabase
    .from("bom_produto")
    .select("produto_id, material_id, quantidade_por_unidade, lead_time_dias, unidade")
    .in("produto_id", produtoIds);

  if (!allBom || allBom.length === 0) return [];

  // Aggregate material needs
  const materialNeeds: Record<string, { necessidade: number; lead_time: number; unidade: string }> = {};
  for (const bomItem of allBom) {
    const prod = produtos.find((p) => p.id === bomItem.produto_id);
    if (!prod) continue;
    const qty = produtoQtds[prod.nome] || 0;
    const need = Number(bomItem.quantidade_por_unidade) * qty;
    const matId = bomItem.material_id;
    if (!materialNeeds[matId]) {
      materialNeeds[matId] = { necessidade: 0, lead_time: Number(bomItem.lead_time_dias), unidade: bomItem.unidade };
    }
    materialNeeds[matId].necessidade += need;
    if (Number(bomItem.lead_time_dias) > materialNeeds[matId].lead_time) {
      materialNeeds[matId].lead_time = Number(bomItem.lead_time_dias);
    }
  }

  const matIds = Object.keys(materialNeeds);
  const { data: mats } = await supabase
    .from("materiais")
    .select("id, nome, codigo, estoque_atual, estoque_minimo, estoque_maximo, lead_time_dias, unidade")
    .in("id", matIds);

  const result: MaterialNecessidade[] = [];
  for (const [matId, need] of Object.entries(materialNeeds)) {
    const mat = (mats || []).find((m) => m.id === matId);
    if (!mat) continue;
    const estoque = Number(mat.estoque_atual);
    const deficit = Math.max(0, need.necessidade - estoque);
    const situacao = getSituacao(estoque, Number(mat.estoque_minimo), Number(mat.estoque_maximo));

    result.push({
      material_id: matId,
      material_nome: mat.nome,
      material_codigo: mat.codigo,
      necessidade: need.necessidade,
      estoque_atual: estoque,
      deficit,
      lead_time_dias: need.lead_time || Number(mat.lead_time_dias),
      unidade: need.unidade || mat.unidade,
      situacao,
    });
  }

  return result.sort((a, b) => b.deficit - a.deficit);
}
