import { supabase } from "@/integrations/supabase/client";

export interface OPMae {
  id: string;
  numero_op: string;
  pedido_id: string;
  total_fracoes: number;
  observacoes_especiais: string | null;
  desenho_url: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface OPFracao {
  id: string;
  op_mae_id: string;
  numero_fracao: number;
  modelo: string;
  dimensoes: string | null;
  medidas: string | null;
  quantidade_tecnica: number;
  observacoes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface FracaoInput {
  modelo: string;
  dimensoes?: string;
  medidas?: string;
  quantidade_tecnica: number;
  observacoes?: string;
}

// Gerar próximo número de OP sequencial
async function gerarNumeroOP(): Promise<string> {
  const { data } = await supabase
    .from("op_maes")
    .select("numero_op")
    .order("created_at", { ascending: false })
    .limit(1);

  if (data && data.length > 0) {
    const last = data[0].numero_op;
    const num = parseInt(last.replace(/\D/g, ""), 10) || 0;
    return `OP-${String(num + 1).padStart(4, "0")}`;
  }
  return "OP-0001";
}

// Criar OP Mãe + Frações automaticamente
export async function criarOPComFracoes(
  pedidoId: string,
  fracoes: FracaoInput[],
  observacoesEspeciais?: string
): Promise<{ opMae: OPMae | null; fracoesCriadas: OPFracao[]; error: string | null }> {
  const numeroOP = await gerarNumeroOP();
  const totalFracoes = fracoes.length;

  // 1. Inserir OP Mãe
  const { data: opData, error: opError } = await supabase
    .from("op_maes")
    .insert({
      numero_op: numeroOP,
      pedido_id: pedidoId,
      total_fracoes: totalFracoes,
      observacoes_especiais: observacoesEspeciais || null,
      status: "aguardando",
    })
    .select()
    .single();

  if (opError || !opData) {
    console.error("[OP] Erro ao criar OP Mãe:", opError?.message);
    return { opMae: null, fracoesCriadas: [], error: opError?.message || "Erro desconhecido" };
  }

  // 2. Inserir Frações Técnicas
  const fracoesInsert = fracoes.map((f, i) => ({
    op_mae_id: opData.id,
    numero_fracao: i + 1,
    modelo: f.modelo,
    dimensoes: f.dimensoes || null,
    medidas: f.medidas || null,
    quantidade_tecnica: f.quantidade_tecnica,
    observacoes: f.observacoes || null,
    status: "aguardando",
  }));

  const { data: fracoesData, error: fracoesError } = await supabase
    .from("op_fracoes")
    .insert(fracoesInsert)
    .select();

  if (fracoesError) {
    console.error("[OP] Erro ao criar frações:", fracoesError.message);
    return { opMae: opData as OPMae, fracoesCriadas: [], error: fracoesError.message };
  }

  // 3. Atualizar pedido com número da OP
  await supabase.from("pedidos").update({ op: numeroOP }).eq("id", pedidoId);

  // 4. Log
  await supabase.from("action_logs").insert({
    action: "create_op",
    entity: "op_maes",
    entity_id: opData.id,
    status: "success",
    details: { numero_op: numeroOP, total_fracoes: totalFracoes, pedido_id: pedidoId } as any,
  });

  console.log(`[OP] ✅ ${numeroOP} criada com ${totalFracoes} frações`);
  return {
    opMae: opData as OPMae,
    fracoesCriadas: (fracoesData || []) as OPFracao[],
    error: null,
  };
}

// Buscar OP Mãe por pedido
export async function fetchOPByPedido(pedidoId: string): Promise<{ data: OPMae | null; error: string | null }> {
  const { data, error } = await supabase
    .from("op_maes")
    .select("*")
    .eq("pedido_id", pedidoId)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  return { data: data as OPMae | null, error: null };
}

// Buscar frações de uma OP
export async function fetchFracoes(opMaeId: string): Promise<{ data: OPFracao[]; error: string | null }> {
  const { data, error } = await supabase
    .from("op_fracoes")
    .select("*")
    .eq("op_mae_id", opMaeId)
    .order("numero_fracao", { ascending: true });

  if (error) return { data: [], error: error.message };
  return { data: (data || []) as OPFracao[], error: null };
}

// Buscar todas as OPs com frações
export async function fetchAllOPs(): Promise<{ data: (OPMae & { fracoes: OPFracao[] })[]; error: string | null }> {
  const { data: ops, error } = await supabase
    .from("op_maes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !ops) return { data: [], error: error?.message || null };

  const result: (OPMae & { fracoes: OPFracao[] })[] = [];
  for (const op of ops) {
    const { data: fracoes } = await fetchFracoes(op.id);
    result.push({ ...(op as OPMae), fracoes });
  }

  return { data: result, error: null };
}
