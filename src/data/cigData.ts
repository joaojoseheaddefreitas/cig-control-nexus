// CIG CONTROL - Dados da Carga MARCOBIN MÓVEIS
// Fonte única de verdade baseada na carga do Excel

export interface Product {
  codigo: string;
  descricao: string;
  quantidade: number;
  precoUnitario: number;
  valorTotal: number;
  percentual: number;
  categoria: 'mesa' | 'cadeira' | 'sofa' | 'rack' | 'estante' | 'bar' | 'poltrona' | 'cama' | 'roupeiro' | 'outros';
}

export interface Sector {
  nome: string;
  operadores: number;
  maquinas: number;
  eficiencia: number;
  horasDisponiveis: number;
  horasNecessarias: number;
  lotacao: number;
}

export interface ProductionData {
  linha: string;
  codigo: string;
  descricao: string;
  quantidade: number;
  precoVenda: number;
  tempoProducao: { [setor: string]: number };
}

// Produtos da carga - Vendas principais
export const products: Product[] = [
  { codigo: '4000', descricao: 'MESA FLORENÇA', quantidade: 411, precoUnitario: 98.00, valorTotal: 40278.00, percentual: 22, categoria: 'mesa' },
  { codigo: '4006', descricao: 'MESA FLORENÇA', quantidade: 138, precoUnitario: 89.00, valorTotal: 12282.00, percentual: 7, categoria: 'mesa' },
  { codigo: '4009', descricao: 'MESA FLORENÇA', quantidade: 14, precoUnitario: 115.60, valorTotal: 1618.40, percentual: 1, categoria: 'mesa' },
  { codigo: '4012', descricao: 'MESA VERONA', quantidade: 96, precoUnitario: 72.00, valorTotal: 6912.00, percentual: 4, categoria: 'mesa' },
  { codigo: '4014', descricao: 'MESA FIRENSE', quantidade: 20, precoUnitario: 88.00, valorTotal: 1760.00, percentual: 1, categoria: 'mesa' },
  { codigo: '4104', descricao: 'MESA FLORENÇA', quantidade: 12, precoUnitario: 112.00, valorTotal: 1344.00, percentual: 1, categoria: 'mesa' },
  { codigo: '4106', descricao: 'MESA VENEZA', quantidade: 10, precoUnitario: 120.00, valorTotal: 1200.00, percentual: 1, categoria: 'mesa' },
  { codigo: '4200', descricao: 'MESA TRENTO', quantidade: 20, precoUnitario: 120.00, valorTotal: 2400.00, percentual: 1, categoria: 'mesa' },
  { codigo: '6002', descricao: 'CADEIRA BERGAMO MADEIRA', quantidade: 1418, precoUnitario: 24.00, valorTotal: 34032.00, percentual: 19, categoria: 'cadeira' },
  { codigo: '6003', descricao: 'CADEIRA BERGAMO ESTOFADO', quantidade: 669, precoUnitario: 26.00, valorTotal: 17394.00, percentual: 10, categoria: 'cadeira' },
  { codigo: '6009', descricao: 'CADEIRA TRIESTE MADEIRA', quantidade: 840, precoUnitario: 22.00, valorTotal: 18480.00, percentual: 10, categoria: 'cadeira' },
  { codigo: '6010', descricao: 'CADEIRA TRIESTE ESTOFADO', quantidade: 408, precoUnitario: 24.00, valorTotal: 9792.00, percentual: 5, categoria: 'cadeira' },
  { codigo: '6014', descricao: 'CADEIRA BELLUNO', quantidade: 300, precoUnitario: 28.00, valorTotal: 8400.00, percentual: 5, categoria: 'cadeira' },
  { codigo: '6101', descricao: 'CADEIRA BERGAMO ESTOFADO', quantidade: 250, precoUnitario: 30.00, valorTotal: 7500.00, percentual: 4, categoria: 'cadeira' },
  { codigo: '6201', descricao: 'CADEIRA TRIESTE BRANCA', quantidade: 230, precoUnitario: 27.00, valorTotal: 6210.00, percentual: 3, categoria: 'cadeira' },
  { codigo: '6202', descricao: 'CADEIRA ROMA BRANCA', quantidade: 90, precoUnitario: 27.00, valorTotal: 2430.00, percentual: 1, categoria: 'cadeira' },
];

// Setores de produção da carga
export const sectors: Sector[] = [
  { nome: 'Corte da Estrutura', operadores: 4, maquinas: 0, eficiencia: 70, horasDisponiveis: 17.6, horasNecessarias: 0.92, lotacao: 95 },
  { nome: 'Montagem da Estrutura', operadores: 6, maquinas: 0, eficiencia: 70, horasDisponiveis: 15.4, horasNecessarias: 8.35, lotacao: 46 },
  { nome: 'Colocação de Percintas/Molas', operadores: 2, maquinas: 0, eficiencia: 80, horasDisponiveis: 52.8, horasNecessarias: 13.7, lotacao: 74 },
  { nome: 'Colagem de Espuma', operadores: 5, maquinas: 0, eficiencia: 70, horasDisponiveis: 17.6, horasNecessarias: 8.85, lotacao: 50 },
  { nome: 'Revestimento', operadores: 11, maquinas: 0, eficiencia: 70, horasDisponiveis: 44.0, horasNecessarias: 11.13, lotacao: 75 },
  { nome: 'Montagem', operadores: 2, maquinas: 0, eficiencia: 70, horasDisponiveis: 96.8, horasNecessarias: 22.28, lotacao: 77 },
  { nome: 'Colocação de Pé e Fundo', operadores: 1, maquinas: 0, eficiencia: 70, horasDisponiveis: 17.6, horasNecessarias: 6.85, lotacao: 61 },
  { nome: 'Embalagem', operadores: 3, maquinas: 0, eficiencia: 70, horasDisponiveis: 8.8, horasNecessarias: 2.5, lotacao: 71 },
  { nome: 'Risco do Tecido', operadores: 4, maquinas: 0, eficiencia: 70, horasDisponiveis: 26.4, horasNecessarias: 4.13, lotacao: 84 },
  { nome: 'Corte do Tecido', operadores: 2, maquinas: 0, eficiencia: 70, horasDisponiveis: 35.2, horasNecessarias: 10.25, lotacao: 71 },
  { nome: 'Costura', operadores: 11, maquinas: 3, eficiencia: 70, horasDisponiveis: 17.6, horasNecessarias: 7.18, lotacao: 59 },
  { nome: 'Laminação do Bloco', operadores: 2, maquinas: 1, eficiencia: 70, horasDisponiveis: 96.8, horasNecessarias: 30.95, lotacao: 68 },
  { nome: 'Montagem da Almofada', operadores: 0, maquinas: 0, eficiencia: 70, horasDisponiveis: 17.6, horasNecessarias: 1.13, lotacao: 94 },
  { nome: 'Corte Alm. Encosto', operadores: 2, maquinas: 0, eficiencia: 70, horasDisponiveis: 17.6, horasNecessarias: 7.88, lotacao: 55 },
  { nome: 'Montagem Alm. Encosto', operadores: 3, maquinas: 0, eficiencia: 70, horasDisponiveis: 26.4, horasNecessarias: 7.83, lotacao: 70 },
  { nome: 'Enchimento/Fechar', operadores: 1, maquinas: 0, eficiencia: 70, horasDisponiveis: 8.8, horasNecessarias: 1.42, lotacao: 84 },
  { nome: 'Encapar Alm. Enc./Ass.', operadores: 1, maquinas: 0, eficiencia: 70, horasDisponiveis: 8.8, horasNecessarias: 292.42, lotacao: -3223 },
  { nome: 'Marcenaria - Corte', operadores: 4, maquinas: 10, eficiencia: 70, horasDisponiveis: 35.2, horasNecessarias: 0.58, lotacao: 98 },
  { nome: 'Marcenaria - Montagem', operadores: 0, maquinas: 0, eficiencia: 70, horasDisponiveis: 26.4, horasNecessarias: 0.23, lotacao: 99 },
  { nome: 'Colagem de Lâmina', operadores: 3, maquinas: 0, eficiencia: 70, horasDisponiveis: 32.8, horasNecessarias: 0.42, lotacao: 99 },
  { nome: 'Acabamento', operadores: 4, maquinas: 0, eficiencia: 70, horasDisponiveis: 24.6, horasNecessarias: 0.0, lotacao: 100 },
  { nome: 'Pintura', operadores: 3, maquinas: 0, eficiencia: 70, horasDisponiveis: 8.2, horasNecessarias: 0.0, lotacao: 100 },
  { nome: 'Metalurgia - Corte', operadores: 1, maquinas: 1, eficiencia: 70, horasDisponiveis: 49.2, horasNecessarias: 0.0, lotacao: 100 },
  { nome: 'Metalurgia - Usinagem', operadores: 5, maquinas: 5, eficiencia: 70, horasDisponiveis: 8.2, horasNecessarias: 0.0, lotacao: 100 },
  { nome: 'Metalurgia - Acabamento', operadores: 2, maquinas: 2, eficiencia: 70, horasDisponiveis: 8.2, horasNecessarias: 0.0, lotacao: 100 },
];

// Linhas de produção (sofás) da carga
export const productionLines: ProductionData[] = [
  { linha: 'ANCORA', codigo: '111482', descricao: '02 LUGARES', quantidade: 1, precoVenda: 1650.00, tempoProducao: { 'Corte': 2.80, 'Montagem': 0.80, 'Revestimento': 0.70 } },
  { linha: 'ANCORA', codigo: '111483', descricao: '03 LUGARES', quantidade: 0, precoVenda: 1171.00, tempoProducao: { 'Corte': 2.19, 'Montagem': 0.75, 'Revestimento': 0.50 } },
  { linha: 'ASTOR', codigo: '111010', descricao: '02 LUGARES', quantidade: 0, precoVenda: 1470.00, tempoProducao: { 'Corte': 3.04, 'Montagem': 1.23, 'Revestimento': 0.93 } },
  { linha: 'ASTOR', codigo: '111011', descricao: '03 LUGARES', quantidade: 1, precoVenda: 1700.00, tempoProducao: { 'Corte': 2.80, 'Montagem': 1.10, 'Revestimento': 0.74 } },
  { linha: 'ATENAS', codigo: '111967', descricao: '01 LUGAR ASSENTO SOLTO', quantidade: 0, precoVenda: 1630.00, tempoProducao: { 'Corte': 3.50, 'Montagem': 1.60, 'Revestimento': 0.47 } },
  { linha: 'FLEX', codigo: '112401', descricao: '02 LUGARES 3 MECANISMOS', quantidade: 20, precoVenda: 1483.00, tempoProducao: { 'Corte': 10.0, 'Montagem': 0.80, 'Revestimento': 0.83 } },
  { linha: 'ROYALE', codigo: '110670', descricao: '02 LUGARES', quantidade: 0, precoVenda: 2100.00, tempoProducao: { 'Corte': 4.67, 'Montagem': 1.33, 'Revestimento': 0.84 } },
  { linha: 'MASTER', codigo: '110676', descricao: '02 LUGARES', quantidade: 0, precoVenda: 1580.00, tempoProducao: { 'Corte': 5.00, 'Montagem': 1.67, 'Revestimento': 1.09 } },
];

// KPIs Executivos calculados da carga
export const executiveKPIs = {
  // CIG - Geral
  cig: {
    lotacaoGeral: 73,
    operadoresTotal: 82,
    eficienciaMedia: 70,
    horasDisponiveisTotal: 244.2,
    horasNecessariasTotal: 65.27,
  },
  // CIV - Vendas
  civ: {
    faturamentoTotal: 179188.40,
    metaMensal: 1000000.00,
    variacaoMeta: -963700.00,
    pedidosAtivos: 746,
    ticketMedio: 240.00,
    pontosTotal: 1000,
  },
  // CIP - Produção
  cip: {
    capacidadeTotal: 244.2,
    utilizacao: 65.27,
    disponibilidade: 73,
    setoresGargalo: ['Encapar Alm. Enc./Ass.', 'Montagem da Estrutura'],
    producaoDiaria: 36465,
    turnosAtivos: 1,
  },
  // CIC - Compras/Materiais
  cic: {
    materiaisCriticos: 12,
    comprasPendentes: 45,
    estoqueTotal: 892450.00,
    riscoRuptura: 8,
    consumoMensal: 156780.00,
  },
  // CIF - Financeiro
  cif: {
    faturamentoProgramado: 1650.00,
    faturamentoDia: 1650.00,
    resultadoOperacional: 36300.00,
    margemLiquida: 18.5,
    custoOperacional: 142888.40,
  },
};

// Dados para gráficos
export const chartData = {
  vendasPorCategoria: [
    { categoria: 'Cadeiras', valor: 96038, quantidade: 4305, color: '#3b82f6' },
    { categoria: 'Mesas', valor: 67794.40, quantidade: 721, color: '#22c55e' },
    { categoria: 'Sofás', valor: 15356, quantidade: 22, color: '#f97316' },
  ],
  lotacaoPorSetor: sectors.map(s => ({
    setor: s.nome.substring(0, 15),
    lotacao: Math.max(0, Math.min(100, s.lotacao)),
    horasDisp: s.horasDisponiveis,
    horasNec: s.horasNecessarias,
  })),
  faturamentoPeriodo: [
    { mes: 'Jan', valor: 145000, meta: 166667 },
    { mes: 'Fev', valor: 158000, meta: 166667 },
    { mes: 'Mar', valor: 172000, meta: 166667 },
    { mes: 'Abr', valor: 168000, meta: 166667 },
    { mes: 'Mai', valor: 179188, meta: 166667 },
    { mes: 'Jun', valor: 185000, meta: 166667 },
  ],
  producaoPorLinha: productionLines.map(p => ({
    linha: p.linha,
    quantidade: p.quantidade,
    valor: p.quantidade * p.precoVenda,
  })),
  eficienciaPorTurno: [
    { turno: '1º Turno', eficiencia: 75, meta: 70 },
    { turno: '2º Turno', eficiencia: 68, meta: 70 },
    { turno: '3º Turno', eficiencia: 62, meta: 70 },
  ],
  materiaisCriticos: [
    { material: 'Espuma D28', estoque: 450, minimo: 500, unidade: 'kg' },
    { material: 'Tecido Suede', estoque: 280, minimo: 400, unidade: 'm²' },
    { material: 'Madeira Pinus', estoque: 1200, minimo: 1000, unidade: 'un' },
    { material: 'Percinta', estoque: 150, minimo: 200, unidade: 'm' },
    { material: 'Cola PVA', estoque: 85, minimo: 100, unidade: 'L' },
  ],
  fluxoCaixa: [
    { semana: 'Sem 1', entradas: 45000, saidas: 38000 },
    { semana: 'Sem 2', entradas: 52000, saidas: 41000 },
    { semana: 'Sem 3', entradas: 48000, saidas: 44000 },
    { semana: 'Sem 4', entradas: 55000, saidas: 39000 },
  ],
};

// Tipos para navegação
export type ModuleType = 'CIG' | 'CIV' | 'CIP' | 'CIC' | 'CIF';

export interface ModuleInfo {
  id: ModuleType;
  nome: string;
  descricao: string;
  cor: string;
  icon: string;
}

export const modules: ModuleInfo[] = [
  { id: 'CIG', nome: 'Central de Inteligência Geral', descricao: 'Governança e Visão Executiva', cor: 'cig', icon: 'LayoutDashboard' },
  { id: 'CIV', nome: 'Central de Inteligência de Vendas', descricao: 'Gestão Comercial', cor: 'civ', icon: 'TrendingUp' },
  { id: 'CIP', nome: 'Central de Inteligência da Produção', descricao: 'Gestão Industrial', cor: 'cip', icon: 'Factory' },
  { id: 'CIC', nome: 'Central de Inteligência de Compras', descricao: 'Materiais e Suprimentos', cor: 'cic', icon: 'Package' },
  { id: 'CIF', nome: 'Central de Inteligência Financeira', descricao: 'Gestão Financeira', cor: 'cif', icon: 'Wallet' },
];
