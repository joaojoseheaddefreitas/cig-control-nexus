// CIC CONTROL - Dados de Materiais, Estoques e Status Financeiro de Clientes
// Fonte: Dados operacionais para conexão CIV ↔ CIC

export interface Material {
  id: string;
  nome: string;
  categoria: 'madeira' | 'tecido' | 'espuma' | 'metal' | 'cola' | 'embalagem' | 'acessorio';
  unidade: string;
  estoqueAtual: number;
  estoqueMinimo: number;
  status: 'normal' | 'atencao' | 'critico';
  leadTimeCompra: number; // dias
  fornecedorPrincipal: string;
  custoUnitario: number;
}

export const materiaisMock: Material[] = [
  { id: 'MAT-001', nome: 'Madeira Pinus Tratada', categoria: 'madeira', unidade: 'm³', estoqueAtual: 45, estoqueMinimo: 20, status: 'normal', leadTimeCompra: 7, fornecedorPrincipal: 'Madeireira Sul', custoUnitario: 850 },
  { id: 'MAT-002', nome: 'Madeira MDF 15mm', categoria: 'madeira', unidade: 'chapa', estoqueAtual: 120, estoqueMinimo: 50, status: 'normal', leadTimeCompra: 5, fornecedorPrincipal: 'Duratex', custoUnitario: 95 },
  { id: 'MAT-003', nome: 'Tecido Suede', categoria: 'tecido', unidade: 'm', estoqueAtual: 35, estoqueMinimo: 30, status: 'atencao', leadTimeCompra: 12, fornecedorPrincipal: 'Têxtil Paraná', custoUnitario: 28 },
  { id: 'MAT-004', nome: 'Tecido Linho Natural', categoria: 'tecido', unidade: 'm', estoqueAtual: 85, estoqueMinimo: 40, status: 'normal', leadTimeCompra: 10, fornecedorPrincipal: 'Têxtil Sul', custoUnitario: 42 },
  { id: 'MAT-005', nome: 'Espuma D28', categoria: 'espuma', unidade: 'bloco', estoqueAtual: 8, estoqueMinimo: 15, status: 'critico', leadTimeCompra: 14, fornecedorPrincipal: 'Espumabras', custoUnitario: 120 },
  { id: 'MAT-006', nome: 'Espuma D33', categoria: 'espuma', unidade: 'bloco', estoqueAtual: 25, estoqueMinimo: 10, status: 'normal', leadTimeCompra: 14, fornecedorPrincipal: 'Espumabras', custoUnitario: 145 },
  { id: 'MAT-007', nome: 'Mola Espiral Nº5', categoria: 'metal', unidade: 'un', estoqueAtual: 500, estoqueMinimo: 200, status: 'normal', leadTimeCompra: 8, fornecedorPrincipal: 'Metalúrgica ABC', custoUnitario: 3.5 },
  { id: 'MAT-008', nome: 'Percinta Elástica', categoria: 'metal', unidade: 'm', estoqueAtual: 180, estoqueMinimo: 150, status: 'atencao', leadTimeCompra: 6, fornecedorPrincipal: 'Elásticos PR', custoUnitario: 8 },
  { id: 'MAT-009', nome: 'Cola PVA Industrial', categoria: 'cola', unidade: 'lt', estoqueAtual: 60, estoqueMinimo: 20, status: 'normal', leadTimeCompra: 3, fornecedorPrincipal: 'Henkel', custoUnitario: 22 },
  { id: 'MAT-010', nome: 'Cola de Contato', categoria: 'cola', unidade: 'lt', estoqueAtual: 42, estoqueMinimo: 15, status: 'normal', leadTimeCompra: 3, fornecedorPrincipal: 'Cascola', custoUnitario: 35 },
  { id: 'MAT-011', nome: 'Papelão Ondulado', categoria: 'embalagem', unidade: 'un', estoqueAtual: 300, estoqueMinimo: 100, status: 'normal', leadTimeCompra: 5, fornecedorPrincipal: 'Klabin', custoUnitario: 12 },
  { id: 'MAT-012', nome: 'Pé de Plástico 5cm', categoria: 'acessorio', unidade: 'un', estoqueAtual: 800, estoqueMinimo: 300, status: 'normal', leadTimeCompra: 4, fornecedorPrincipal: 'Plásticos Ideal', custoUnitario: 2.5 },
  { id: 'MAT-013', nome: 'Parafuso Madeira 4x25', categoria: 'acessorio', unidade: 'cx', estoqueAtual: 50, estoqueMinimo: 20, status: 'normal', leadTimeCompra: 3, fornecedorPrincipal: 'Ciser', custoUnitario: 18 },
];

// Mapeamento: categoria do produto → materiais necessários
export const categoriaMateriais: Record<string, string[]> = {
  sofa: ['MAT-001', 'MAT-003', 'MAT-005', 'MAT-007', 'MAT-008', 'MAT-009', 'MAT-010', 'MAT-011', 'MAT-012'],
  cadeira_madeira: ['MAT-001', 'MAT-002', 'MAT-009', 'MAT-011', 'MAT-013'],
  cadeira_estofado: ['MAT-001', 'MAT-003', 'MAT-006', 'MAT-009', 'MAT-011', 'MAT-012'],
  mesa: ['MAT-001', 'MAT-002', 'MAT-009', 'MAT-011', 'MAT-013', 'MAT-012'],
  poltrona: ['MAT-001', 'MAT-003', 'MAT-005', 'MAT-008', 'MAT-009', 'MAT-011', 'MAT-012'],
};

// Mapeia código do produto para categoria de material
export function getCategoriaMaterialProduto(produtoCodigo: string): string {
  if (['112401', '111482', '111011'].includes(produtoCodigo)) return 'sofa';
  if (['6002', '6009'].includes(produtoCodigo)) return 'cadeira_madeira';
  if (['6003', '6010', '6014'].includes(produtoCodigo)) return 'cadeira_estofado';
  if (['4000', '4006'].includes(produtoCodigo)) return 'mesa';
  return 'mesa';
}

// Retorna os materiais necessários para um produto
export function getMateriaisPorProduto(produtoCodigo: string): Material[] {
  const categoria = getCategoriaMaterialProduto(produtoCodigo);
  const ids = categoriaMateriais[categoria] || [];
  return ids.map(id => materiaisMock.find(m => m.id === id)).filter(Boolean) as Material[];
}

// Verifica se há materiais em estado crítico ou atenção para um produto
export function verificarAlertasMateriais(produtoCodigo: string): { alertas: Material[]; temFalta: boolean } {
  const materiais = getMateriaisPorProduto(produtoCodigo);
  const alertas = materiais.filter(m => m.status === 'critico' || m.status === 'atencao');
  return { alertas, temFalta: alertas.length > 0 };
}

// Status financeiro de clientes
export interface ClienteFinanceiro {
  clienteNome: string;
  statusFinanceiro: 'liberado' | 'bloqueado';
  motivoBloqueio?: string;
  limiteCredito: number;
  saldoDevedor: number;
  diasAtraso: number;
}

export const clientesFinanceiro: ClienteFinanceiro[] = [
  { clienteNome: 'Móveis Silva', statusFinanceiro: 'liberado', limiteCredito: 50000, saldoDevedor: 12500, diasAtraso: 0 },
  { clienteNome: 'Loja do Conforto', statusFinanceiro: 'bloqueado', motivoBloqueio: 'Inadimplência superior a 90 dias', limiteCredito: 30000, saldoDevedor: 28000, diasAtraso: 95 },
  { clienteNome: 'Decor House', statusFinanceiro: 'liberado', limiteCredito: 80000, saldoDevedor: 15000, diasAtraso: 0 },
  { clienteNome: 'Casa & Estilo', statusFinanceiro: 'liberado', limiteCredito: 40000, saldoDevedor: 5200, diasAtraso: 0 },
  { clienteNome: 'Móveis Paraná', statusFinanceiro: 'liberado', limiteCredito: 100000, saldoDevedor: 25000, diasAtraso: 0 },
  { clienteNome: 'Design Interior', statusFinanceiro: 'bloqueado', motivoBloqueio: 'Limite de crédito excedido', limiteCredito: 20000, saldoDevedor: 22000, diasAtraso: 15 },
  { clienteNome: 'Móveis Luxo Ltda', statusFinanceiro: 'liberado', limiteCredito: 200000, saldoDevedor: 45000, diasAtraso: 0 },
  { clienteNome: 'Casa Nova Decorações', statusFinanceiro: 'liberado', limiteCredito: 60000, saldoDevedor: 8900, diasAtraso: 0 },
  { clienteNome: 'Hotel Premium', statusFinanceiro: 'liberado', limiteCredito: 500000, saldoDevedor: 85000, diasAtraso: 0 },
  { clienteNome: 'Construtora ABC', statusFinanceiro: 'liberado', limiteCredito: 300000, saldoDevedor: 120000, diasAtraso: 0 },
  { clienteNome: 'Loja Conforto', statusFinanceiro: 'liberado', limiteCredito: 45000, saldoDevedor: 10500, diasAtraso: 0 },
  { clienteNome: 'Decoração Express', statusFinanceiro: 'liberado', limiteCredito: 25000, saldoDevedor: 3200, diasAtraso: 0 },
  { clienteNome: 'Rede Móveis SP', statusFinanceiro: 'liberado', limiteCredito: 400000, saldoDevedor: 95000, diasAtraso: 0 },
  { clienteNome: 'Arquiteto Silva', statusFinanceiro: 'liberado', limiteCredito: 150000, saldoDevedor: 45000, diasAtraso: 0 },
];

// Busca status financeiro de um cliente pelo nome
export function getStatusFinanceiroCliente(clienteNome: string): ClienteFinanceiro | undefined {
  return clientesFinanceiro.find(c => c.clienteNome === clienteNome);
}
