// CIV CONTROL - Dados específicos da Central de Inteligência de Vendas
// Baseado na carga MARCOBIN MÓVEIS

export interface Lead {
  id: string;
  origem: string;
  canal: string;
  produto: string;
  valorEstimado: number;
  status: 'novo' | 'qualificado' | 'proposta' | 'negociacao' | 'convertido' | 'perdido';
  dataEntrada: string;
  responsavel: string;
}

export interface Loja {
  id: string;
  nome: string;
  tipo: 'propria' | 'parceira' | 'representante';
  regiao: string;
  vendedor: string;
  vendasMes: number;
  margemMedia: number;
  ticketMedio: number;
  status: 'ativa' | 'inativa';
}

export interface Pedido {
  id: string;
  cliente: string;
  loja: string;
  canal: string;
  produto: string;
  quantidade: number;
  valor: number;
  margem: number;
  prazoPrometido: string;
  prioridade: 'normal' | 'alta' | 'urgente';
  status: 'a_programar' | 'em_producao' | 'produzido' | 'faturado';
}

export interface Cliente {
  id: string;
  nome: string;
  tipo: 'varejo' | 'atacado' | 'projeto';
  cidade: string;
  estado: string;
  comprasTotal: number;
  ticketMedio: number;
  ultimaCompra: string;
  classificacao: 'A' | 'B' | 'C';
}

export interface ProdutoVenda {
  codigo: string;
  nome: string;
  categoria: string;
  precoBase: number;
  vendasMes: number;
  margem: number;
  ranking: number;
  estoque: number;
}

export interface ProjetoEspecial {
  id: string;
  cliente: string;
  descricao: string;
  valorEstimado: number;
  prazoSolicitado: string;
  prazoViavel: string;
  status: 'analise' | 'aprovado' | 'em_producao' | 'concluido' | 'cancelado';
  impactoCapacidade: number;
}

// Dados de Leads
export const leads: Lead[] = [
  { id: 'L001', origem: 'Site', canal: 'Digital', produto: 'Sofá Flex', valorEstimado: 29660, status: 'qualificado', dataEntrada: '2024-01-15', responsavel: 'Carlos Silva' },
  { id: 'L002', origem: 'Indicação', canal: 'Loja Própria', produto: 'Mesa Florença', valorEstimado: 4900, status: 'proposta', dataEntrada: '2024-01-16', responsavel: 'Ana Costa' },
  { id: 'L003', origem: 'Feira', canal: 'Eventos', produto: 'Cadeira Bergamo', valorEstimado: 12000, status: 'negociacao', dataEntrada: '2024-01-17', responsavel: 'Roberto Lima' },
  { id: 'L004', origem: 'Instagram', canal: 'Digital', produto: 'Sofá Royale', valorEstimado: 42000, status: 'novo', dataEntrada: '2024-01-18', responsavel: 'Maria Santos' },
  { id: 'L005', origem: 'Whatsapp', canal: 'Digital', produto: 'Mesa Verona', valorEstimado: 7200, status: 'qualificado', dataEntrada: '2024-01-19', responsavel: 'Carlos Silva' },
  { id: 'L006', origem: 'Loja', canal: 'Loja Parceira', produto: 'Conjunto Sala', valorEstimado: 85000, status: 'proposta', dataEntrada: '2024-01-20', responsavel: 'Ana Costa' },
  { id: 'L007', origem: 'Representante', canal: 'Representante', produto: 'Cadeira Trieste', valorEstimado: 18000, status: 'convertido', dataEntrada: '2024-01-10', responsavel: 'Pedro Souza' },
  { id: 'L008', origem: 'Site', canal: 'Digital', produto: 'Sofá Master', valorEstimado: 31600, status: 'perdido', dataEntrada: '2024-01-08', responsavel: 'Maria Santos' },
];

// Dados de Lojas e Canais
export const lojas: Loja[] = [
  { id: 'LJ001', nome: 'Marcobin Centro', tipo: 'propria', regiao: 'Centro', vendedor: 'Carlos Silva', vendasMes: 125000, margemMedia: 22, ticketMedio: 2800, status: 'ativa' },
  { id: 'LJ002', nome: 'Marcobin Shopping', tipo: 'propria', regiao: 'Shopping', vendedor: 'Ana Costa', vendasMes: 98000, margemMedia: 20, ticketMedio: 3200, status: 'ativa' },
  { id: 'LJ003', nome: 'Móveis Bela Vista', tipo: 'parceira', regiao: 'Sul', vendedor: 'Roberto Lima', vendasMes: 67000, margemMedia: 18, ticketMedio: 2100, status: 'ativa' },
  { id: 'LJ004', nome: 'Casa & Conforto', tipo: 'parceira', regiao: 'Norte', vendedor: 'Maria Santos', vendasMes: 45000, margemMedia: 16, ticketMedio: 1800, status: 'ativa' },
  { id: 'LJ005', nome: 'Rep. João Moreira', tipo: 'representante', regiao: 'Interior', vendedor: 'João Moreira', vendasMes: 89000, margemMedia: 15, ticketMedio: 4500, status: 'ativa' },
  { id: 'LJ006', nome: 'Rep. Pedro Souza', tipo: 'representante', regiao: 'Litoral', vendedor: 'Pedro Souza', vendasMes: 72000, margemMedia: 14, ticketMedio: 3800, status: 'ativa' },
  { id: 'LJ007', nome: 'E-commerce', tipo: 'propria', regiao: 'Nacional', vendedor: 'Equipe Digital', vendasMes: 156000, margemMedia: 25, ticketMedio: 2400, status: 'ativa' },
  { id: 'LJ008', nome: 'Marketplace', tipo: 'parceira', regiao: 'Nacional', vendedor: 'Equipe Digital', vendasMes: 34000, margemMedia: 12, ticketMedio: 1600, status: 'ativa' },
];

// Carteira de Pedidos
export const carteiraPedidos: Pedido[] = [
  { id: 'PD001', cliente: 'Móveis Luxo Ltda', loja: 'Representante', canal: 'B2B', produto: 'Sofá Flex 2L', quantidade: 20, valor: 29660, margem: 22, prazoPrometido: '2024-02-15', prioridade: 'alta', status: 'em_producao' },
  { id: 'PD002', cliente: 'Casa Nova Decorações', loja: 'Loja Centro', canal: 'Varejo', produto: 'Mesa Florença', quantidade: 50, valor: 4900, margem: 18, prazoPrometido: '2024-02-10', prioridade: 'normal', status: 'a_programar' },
  { id: 'PD003', cliente: 'Hotel Premium', loja: 'Projetos', canal: 'Projeto', produto: 'Cadeira Bergamo', quantidade: 200, valor: 5200, margem: 15, prazoPrometido: '2024-03-01', prioridade: 'urgente', status: 'em_producao' },
  { id: 'PD004', cliente: 'Construtora ABC', loja: 'Projetos', canal: 'Projeto', produto: 'Conjunto Sala', quantidade: 15, valor: 85000, margem: 20, prazoPrometido: '2024-02-28', prioridade: 'alta', status: 'a_programar' },
  { id: 'PD005', cliente: 'Loja Conforto', loja: 'Parceira', canal: 'B2B', produto: 'Sofá Royale', quantidade: 5, valor: 10500, margem: 16, prazoPrometido: '2024-02-20', prioridade: 'normal', status: 'produzido' },
  { id: 'PD006', cliente: 'Decoração Express', loja: 'E-commerce', canal: 'Digital', produto: 'Mesa Trento', quantidade: 10, valor: 1200, margem: 24, prazoPrometido: '2024-02-08', prioridade: 'normal', status: 'faturado' },
  { id: 'PD007', cliente: 'Arquiteto Silva', loja: 'Projetos', canal: 'Projeto', produto: 'Projeto Especial', quantidade: 1, valor: 45000, margem: 28, prazoPrometido: '2024-03-15', prioridade: 'alta', status: 'a_programar' },
  { id: 'PD008', cliente: 'Rede Móveis SP', loja: 'Representante', canal: 'B2B', produto: 'Cadeira Trieste', quantidade: 500, valor: 11000, margem: 14, prazoPrometido: '2024-02-25', prioridade: 'urgente', status: 'em_producao' },
];

// Clientes
export const clientes: Cliente[] = [
  { id: 'C001', nome: 'Móveis Luxo Ltda', tipo: 'atacado', cidade: 'São Paulo', estado: 'SP', comprasTotal: 450000, ticketMedio: 15000, ultimaCompra: '2024-01-18', classificacao: 'A' },
  { id: 'C002', nome: 'Casa Nova Decorações', tipo: 'varejo', cidade: 'Curitiba', estado: 'PR', comprasTotal: 125000, ticketMedio: 4200, ultimaCompra: '2024-01-20', classificacao: 'B' },
  { id: 'C003', nome: 'Hotel Premium', tipo: 'projeto', cidade: 'Rio de Janeiro', estado: 'RJ', comprasTotal: 280000, ticketMedio: 28000, ultimaCompra: '2024-01-15', classificacao: 'A' },
  { id: 'C004', nome: 'Construtora ABC', tipo: 'projeto', cidade: 'Belo Horizonte', estado: 'MG', comprasTotal: 520000, ticketMedio: 52000, ultimaCompra: '2024-01-22', classificacao: 'A' },
  { id: 'C005', nome: 'Loja Conforto', tipo: 'varejo', cidade: 'Porto Alegre', estado: 'RS', comprasTotal: 89000, ticketMedio: 3500, ultimaCompra: '2024-01-19', classificacao: 'B' },
  { id: 'C006', nome: 'Decoração Express', tipo: 'varejo', cidade: 'Florianópolis', estado: 'SC', comprasTotal: 45000, ticketMedio: 1800, ultimaCompra: '2024-01-21', classificacao: 'C' },
  { id: 'C007', nome: 'Rede Móveis SP', tipo: 'atacado', cidade: 'São Paulo', estado: 'SP', comprasTotal: 680000, ticketMedio: 22000, ultimaCompra: '2024-01-23', classificacao: 'A' },
  { id: 'C008', nome: 'Arquiteto Silva', tipo: 'projeto', cidade: 'Brasília', estado: 'DF', comprasTotal: 95000, ticketMedio: 9500, ultimaCompra: '2024-01-17', classificacao: 'B' },
];

// Produtos
export const produtosVenda: ProdutoVenda[] = [
  { codigo: '4000', nome: 'Mesa Florença', categoria: 'Mesa', precoBase: 98.00, vendasMes: 411, margem: 22, ranking: 1, estoque: 45 },
  { codigo: '6002', nome: 'Cadeira Bergamo Madeira', categoria: 'Cadeira', precoBase: 24.00, vendasMes: 1418, margem: 18, ranking: 2, estoque: 320 },
  { codigo: '6009', nome: 'Cadeira Trieste Madeira', categoria: 'Cadeira', precoBase: 22.00, vendasMes: 840, margem: 16, ranking: 3, estoque: 180 },
  { codigo: '6003', nome: 'Cadeira Bergamo Estofado', categoria: 'Cadeira', precoBase: 26.00, vendasMes: 669, margem: 20, ranking: 4, estoque: 95 },
  { codigo: '6010', nome: 'Cadeira Trieste Estofado', categoria: 'Cadeira', precoBase: 24.00, vendasMes: 408, margem: 17, ranking: 5, estoque: 75 },
  { codigo: '112401', nome: 'Sofá Flex 2L', categoria: 'Sofá', precoBase: 1483.00, vendasMes: 20, margem: 25, ranking: 6, estoque: 8 },
  { codigo: '4006', nome: 'Mesa Florença 6L', categoria: 'Mesa', precoBase: 89.00, vendasMes: 138, margem: 21, ranking: 7, estoque: 28 },
  { codigo: '6014', nome: 'Cadeira Belluno', categoria: 'Cadeira', precoBase: 28.00, vendasMes: 300, margem: 19, ranking: 8, estoque: 65 },
];

// Projetos Especiais
export const projetosEspeciais: ProjetoEspecial[] = [
  { id: 'PE001', cliente: 'Hotel Premium', descricao: 'Mobiliário completo 50 suítes', valorEstimado: 450000, prazoSolicitado: '2024-04-15', prazoViavel: '2024-05-01', status: 'aprovado', impactoCapacidade: 35 },
  { id: 'PE002', cliente: 'Construtora ABC', descricao: 'Áreas comuns empreendimento', valorEstimado: 280000, prazoSolicitado: '2024-03-30', prazoViavel: '2024-04-10', status: 'analise', impactoCapacidade: 25 },
  { id: 'PE003', cliente: 'Arquiteto Silva', descricao: 'Projeto residencial alto padrão', valorEstimado: 95000, prazoSolicitado: '2024-03-15', prazoViavel: '2024-03-20', status: 'em_producao', impactoCapacidade: 12 },
  { id: 'PE004', cliente: 'Rede Hoteleira XYZ', descricao: 'Renovação 3 hotéis', valorEstimado: 1200000, prazoSolicitado: '2024-06-01', prazoViavel: '2024-07-15', status: 'analise', impactoCapacidade: 65 },
];

// KPIs do CIV
export const civKPIs = {
  totalVendido: 179188.40,
  faturamento: 179188.40,
  pedidosAberto: 746,
  ticketMedio: 240,
  margemMedia: 18.5,
  leadsAtivos: 5,
  conversaoLeads: 42,
  clientesAtivos: 156,
  projetosAndamento: 3,
};

// Dados para gráficos do CIV
export const civChartData = {
  vendasPeriodo: [
    { mes: 'Jan', vendas: 145000, meta: 166667 },
    { mes: 'Fev', vendas: 158000, meta: 166667 },
    { mes: 'Mar', vendas: 172000, meta: 166667 },
    { mes: 'Abr', vendas: 168000, meta: 166667 },
    { mes: 'Mai', vendas: 179188, meta: 166667 },
    { mes: 'Jun', vendas: 185000, meta: 166667 },
  ],
  faturamentoPorCanal: [
    { canal: 'Loja Própria', valor: 223000, color: '#22c55e' },
    { canal: 'E-commerce', valor: 156000, color: '#3b82f6' },
    { canal: 'Representantes', valor: 161000, color: '#f97316' },
    { canal: 'Lojas Parceiras', valor: 146000, color: '#8b5cf6' },
    { canal: 'Projetos', valor: 420000, color: '#14b8a6' },
  ],
  pipelineFunil: [
    { etapa: 'Lead', quantidade: 85, valor: 425000 },
    { etapa: 'Proposta', quantidade: 38, valor: 228000 },
    { etapa: 'Negociação', quantidade: 24, valor: 192000 },
    { etapa: 'Aprovado', quantidade: 15, valor: 135000 },
    { etapa: 'Perdido', quantidade: 12, valor: 98000 },
  ],
  origemLeads: [
    { origem: 'Site', quantidade: 45, conversao: 38 },
    { origem: 'Indicação', quantidade: 28, conversao: 52 },
    { origem: 'Feira', quantidade: 15, conversao: 45 },
    { origem: 'Instagram', quantidade: 35, conversao: 28 },
    { origem: 'Whatsapp', quantidade: 22, conversao: 42 },
  ],
  demandaVsCapacidade: [
    { mes: 'Jan', demanda: 145, capacidade: 160 },
    { mes: 'Fev', demanda: 158, capacidade: 160 },
    { mes: 'Mar', demanda: 172, capacidade: 165 },
    { mes: 'Abr', demanda: 168, capacidade: 165 },
    { mes: 'Mai', demanda: 185, capacidade: 170 },
    { mes: 'Jun', demanda: 195, capacidade: 175 },
  ],
  vendasPorCliente: [
    { cliente: 'Rede Móveis SP', valor: 680000 },
    { cliente: 'Construtora ABC', valor: 520000 },
    { cliente: 'Móveis Luxo', valor: 450000 },
    { cliente: 'Hotel Premium', valor: 280000 },
    { cliente: 'Casa Nova', valor: 125000 },
  ],
  curvaABC: [
    { classe: 'A', clientes: 12, percentual: 68 },
    { classe: 'B', clientes: 35, percentual: 24 },
    { classe: 'C', clientes: 109, percentual: 8 },
  ],
  tendenciaDemanda: [
    { mes: 'Jul', projecao: 205000, historico: null },
    { mes: 'Ago', projecao: 215000, historico: null },
    { mes: 'Set', projecao: 235000, historico: null },
    { mes: 'Out', projecao: 250000, historico: null },
    { mes: 'Nov', projecao: 280000, historico: null },
    { mes: 'Dez', projecao: 320000, historico: null },
  ],
  sazonalidade: [
    { mes: 'Jan', indice: 85 },
    { mes: 'Fev', indice: 78 },
    { mes: 'Mar', indice: 92 },
    { mes: 'Abr', indice: 88 },
    { mes: 'Mai', indice: 95 },
    { mes: 'Jun', indice: 90 },
    { mes: 'Jul', indice: 82 },
    { mes: 'Ago', indice: 88 },
    { mes: 'Set', indice: 105 },
    { mes: 'Out', indice: 115 },
    { mes: 'Nov', indice: 125 },
    { mes: 'Dez', indice: 140 },
  ],
};

// Alertas IA
export const alertasIA = [
  { tipo: 'risco', mensagem: 'Demanda prevista para Jun/Jul excede capacidade em 15%', prioridade: 'alta' },
  { tipo: 'oportunidade', mensagem: 'Cadeira Bergamo com crescimento de 28% - considerar aumento de produção', prioridade: 'media' },
  { tipo: 'tendencia', mensagem: 'Queda de conversão no canal digital - revisar estratégia', prioridade: 'alta' },
  { tipo: 'alerta', mensagem: 'Cliente Rede Móveis SP sem pedido há 45 dias', prioridade: 'media' },
  { tipo: 'sugestao', mensagem: 'Mix atual concentrado em cadeiras - diversificar para sofás', prioridade: 'baixa' },
];
