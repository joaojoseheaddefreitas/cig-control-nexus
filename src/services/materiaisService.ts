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
  tipo_controle: string;
  margem_seguranca_percentual: number;
  // Manual overrides (CIC) — quando *_manual=true, usa *_override em vez do calculado
  ponto_pedido_manual?: boolean;
  ponto_pedido_override?: number | null;
  proposta_manual?: boolean;
  proposta_override?: number | null;
  cmm_manual?: boolean;
  cmm_override?: number | null;
  // Calculated
  alcance_estoque?: number;     // dias
  alcance_meses?: number;       // meses
  alcance_projetado?: number;
  valor_estoque?: number;
  proposta_compra?: number;
  status?: 'normal' | 'atencao' | 'critico';
  ponto_pedido_calculado?: number;
  estoque_seguranca_calculado?: number;
  cmm?: number;                 // Consumo Médio Mensal (efetivo: manual ou calc)
  cmd?: number;                 // Consumo Médio Diário (efetivo)
  // Origem dos valores (para badges na UI)
  pp_origem?: 'manual' | 'auto';
  proposta_origem?: 'manual' | 'auto';
  cmm_origem?: 'manual' | 'auto';
  gaveta1?: number;
  gaveta2?: number;
  gaveta2_ativa?: boolean;
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

/**
 * Status baseado em ALCANCE EM MESES (regra oficial):
 *   < 1.0 mês  → crítico (vermelho)
 *   < 1.5 mês  → atenção (amarelo)
 *   >= 1.5 mês → normal  (azul)
 */
function calcularStatusPorAlcance(alcanceMeses: number): 'normal' | 'atencao' | 'critico' {
  if (alcanceMeses < 1.0) return 'critico';
  if (alcanceMeses < 1.5) return 'atencao';
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
    // ── CMM/CMD: respeita override manual ──
    const cmmManual = !!mat.cmm_manual;
    const cmmOverride = Number(mat.cmm_override) || 0;
    const cmdBase = Number(mat.consumo_medio_diario) || 0;
    const cmm = cmmManual && cmmOverride > 0 ? cmmOverride : cmdBase * 30;
    const cmd = cmm / 30;

    const margem = (mat.margem_seguranca_percentual || 20) / 100;
    const leadTime = Number(mat.lead_time_dias) || 0;

    // ── PONTO DE PEDIDO: respeita override manual ──
    // Fórmula automática: PP = CMD × LeadTime × (1 + margem_segurança)
    const estoqueSegCalc = cmd * leadTime * margem;
    const pontoPedidoCalcAuto = cmd * leadTime * (1 + margem);
    const ppManual = !!mat.ponto_pedido_manual;
    const ppOverride = Number(mat.ponto_pedido_override) || 0;
    const pontoPedidoCalc = ppManual && ppOverride > 0 ? ppOverride : pontoPedidoCalcAuto;

    // Duas gavetas logic
    const isDuasGavetas = mat.tipo_controle === 'DUAS_GAVETAS';
    const gaveta2 = isDuasGavetas ? cmd * leadTime : 0;
    const gaveta1 = isDuasGavetas ? Math.max(0, mat.estoque_atual - gaveta2) : 0;
    const gaveta2Ativa = isDuasGavetas && gaveta1 <= 0;

    // ── PROPOSTA: respeita override manual ──
    // Auto: MAX(0; (PP - Estoque Atual) + Lote Econômico) — só se Estoque < PP
    const deficit = pontoPedidoCalc - mat.estoque_atual;
    const propostaAuto = deficit > 0
      ? Math.max(0, deficit + (mat.lote_economico || 0))
      : 0;
    const propostaManual = !!mat.proposta_manual;
    const propostaOverride = Number(mat.proposta_override) || 0;
    const proposta = propostaManual ? propostaOverride : propostaAuto;

    // ALCANCE = (Estoque Atual) / CMD (em dias) e CMM (em meses)
    const alcanceDias = calcularAlcance(mat.estoque_atual, cmd);
    const alcanceMeses = cmm > 0 ? mat.estoque_atual / cmm : 999;
    const alcanceProjetadoDias = calcularAlcance(mat.estoque_atual + proposta, cmd);

    // Status oficial baseado em alcance em meses
    let status = calcularStatusPorAlcance(alcanceMeses);
    if (gaveta2Ativa) status = 'critico';

    return {
      ...mat,
      cmm: Number(cmm.toFixed(2)),
      cmd: Number(cmd.toFixed(2)),
      alcance_estoque: Number(alcanceDias.toFixed(2)),
      alcance_meses: Number(alcanceMeses.toFixed(2)),
      alcance_projetado: Number(alcanceProjetadoDias.toFixed(2)),
      valor_estoque: mat.estoque_atual * mat.valor_unitario,
      proposta_compra: Number(proposta.toFixed(2)),
      status,
      ponto_pedido_calculado: Number(pontoPedidoCalc.toFixed(2)),
      estoque_seguranca_calculado: Number(estoqueSegCalc.toFixed(2)),
      pp_origem: ppManual && ppOverride > 0 ? 'manual' : 'auto',
      proposta_origem: propostaManual ? 'manual' : 'auto',
      cmm_origem: cmmManual && cmmOverride > 0 ? 'manual' : 'auto',
      gaveta1: Number(gaveta1.toFixed(2)),
      gaveta2: Number(gaveta2.toFixed(2)),
      gaveta2_ativa: gaveta2Ativa,
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
