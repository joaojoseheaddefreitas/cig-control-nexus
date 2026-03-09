import { supabase } from "@/integrations/supabase/client";

export interface Material {
  id: string;
  codigo: string;
  nome: string;
  categoria: string;
  unidade: string;
  estoque_atual: number;
  estoque_minimo: number;
  estoque_maximo: number;
  estoque_seguranca: number;
  ponto_pedido: number;
  lote_economico: number;
  consumo_medio_diario: number;
  lead_time_dias: number;
  valor_unitario: number;
  fornecedor_id: string | null;
  fornecedor_nome: string | null;
  ultima_entrada: string | null;
  ativo: boolean;
  // Calculated
  alcance_estoque?: number;
  alcance_projetado?: number;
  valor_estoque?: number;
  proposta_compra?: number;
  status?: 'normal' | 'atencao' | 'critico';
}

export interface MovimentacaoMaterial {
  id: string;
  material_id: string;
  tipo: string;
  quantidade: number;
  valor_total: number;
  op_id: string | null;
  nota_fiscal: string | null;
  motivo: string | null;
  usuario: string | null;
  created_at: string;
}

function calcularAlcance(estoque: number, consumoDiario: number): number {
  if (consumoDiario <= 0) return 999;
  return estoque / consumoDiario;
}

function calcularStatus(mat: Material): 'normal' | 'atencao' | 'critico' {
  const alcance = calcularAlcance(mat.estoque_atual, mat.consumo_medio_diario);
  if (alcance < 1 || mat.estoque_atual < mat.ponto_pedido) return 'critico';
  if (mat.estoque_atual < mat.estoque_seguranca) return 'atencao';
  return 'normal';
}

export async function fetchMateriais(): Promise<Material[]> {
  const { data, error } = await (supabase as any)
    .from("materiais")
    .select("*")
    .eq("ativo", true)
    .order("nome");

  if (error || !data) return [];

  return (data as Material[]).map(mat => {
    const alcance = calcularAlcance(mat.estoque_atual, mat.consumo_medio_diario);
    const deficit = Math.max(0, mat.ponto_pedido - mat.estoque_atual);
    const proposta = deficit > 0 ? Math.max(deficit, mat.lote_economico) : 0;
    const alcanceProjetado = calcularAlcance(mat.estoque_atual + proposta, mat.consumo_medio_diario);

    return {
      ...mat,
      alcance_estoque: Number(alcance.toFixed(2)),
      alcance_projetado: Number(alcanceProjetado.toFixed(2)),
      valor_estoque: mat.estoque_atual * mat.valor_unitario,
      proposta_compra: proposta,
      status: calcularStatus(mat),
    };
  });
}

export async function fetchMovimentacoesMateriais(limit = 50): Promise<MovimentacaoMaterial[]> {
  const { data, error } = await (supabase as any)
    .from("movimentacoes_materiais")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data as MovimentacaoMaterial[];
}

export async function registrarEntradaMaterial(
  materialId: string,
  quantidade: number,
  valorUnitario: number,
  notaFiscal?: string,
  motivo?: string
): Promise<{ error: string | null }> {
  // Insert movement
  const { error: movErr } = await (supabase as any)
    .from("movimentacoes_materiais")
    .insert({
      material_id: materialId,
      tipo: "entrada",
      quantidade,
      valor_total: quantidade * valorUnitario,
      nota_fiscal: notaFiscal || null,
      motivo: motivo || "Entrada de estoque",
      usuario: "Admin",
    });
  if (movErr) return { error: movErr.message };

  // Update stock
  const { data: mat } = await (supabase as any)
    .from("materiais")
    .select("estoque_atual, valor_unitario")
    .eq("id", materialId)
    .single();
  if (!mat) return { error: "Material não encontrado" };

  const novoEstoque = Number(mat.estoque_atual) + quantidade;
  const { error: upErr } = await (supabase as any)
    .from("materiais")
    .update({
      estoque_atual: novoEstoque,
      valor_unitario: valorUnitario,
      ultima_entrada: new Date().toISOString().split("T")[0],
    })
    .eq("id", materialId);
  if (upErr) return { error: upErr.message };

  return { error: null };
}

export async function registrarConsumoMaterial(
  materialId: string,
  quantidade: number,
  opId?: string,
  motivo?: string
): Promise<{ error: string | null }> {
  const { data: mat } = await (supabase as any)
    .from("materiais")
    .select("estoque_atual, valor_unitario")
    .eq("id", materialId)
    .single();
  if (!mat) return { error: "Material não encontrado" };

  const { error: movErr } = await (supabase as any)
    .from("movimentacoes_materiais")
    .insert({
      material_id: materialId,
      tipo: opId ? "consumo_op" : "saida",
      quantidade,
      valor_total: quantidade * Number(mat.valor_unitario),
      op_id: opId || null,
      motivo: motivo || "Consumo de produção",
      usuario: "Admin",
    });
  if (movErr) return { error: movErr.message };

  const novoEstoque = Math.max(0, Number(mat.estoque_atual) - quantidade);
  const { error: upErr } = await (supabase as any)
    .from("materiais")
    .update({ estoque_atual: novoEstoque })
    .eq("id", materialId);
  if (upErr) return { error: upErr.message };

  return { error: null };
}

/** Check if all materials for an OP's product are available */
export async function verificarDisponibilidadeMateriais(
  produtoId: string,
  quantidade: number
): Promise<{ disponivel: boolean; faltantes: { material: string; deficit: number }[] }> {
  const { data: bom } = await (supabase as any)
    .from("bom_produto")
    .select("material_id, quantidade_por_unidade")
    .eq("produto_id", produtoId);

  if (!bom || bom.length === 0) return { disponivel: true, faltantes: [] };

  const materialIds = bom.map((b: any) => b.material_id);
  const { data: materiais } = await (supabase as any)
    .from("materiais")
    .select("id, nome, estoque_atual")
    .in("id", materialIds);

  const faltantes: { material: string; deficit: number }[] = [];
  for (const item of bom) {
    const mat = (materiais || []).find((m: any) => m.id === item.material_id);
    if (!mat) continue;
    const necessidade = item.quantidade_por_unidade * quantidade;
    if (mat.estoque_atual < necessidade) {
      faltantes.push({ material: mat.nome, deficit: necessidade - mat.estoque_atual });
    }
  }

  return { disponivel: faltantes.length === 0, faltantes };
}
