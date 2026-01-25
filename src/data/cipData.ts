// CIP CONTROL 360 - Dados de Produção Industrial
// Fonte: Carga MARCOBIN MÓVEIS + Lógica PCP Industrial

export interface OrdemProducao {
  id: string;
  op: string;
  produto: string;
  descricao: string;
  quantidade: number;
  dataProgramada: string;
  prazoEntrega: string;
  setor: string;
  status: 'aguardando' | 'em_producao' | 'concluido' | 'atrasado' | 'bloqueado';
  origem: 'manual' | 'pcp' | 'erp' | 'sap';
  horasNecessarias: number;
  horasRealizadas: number;
  prioridade: 'baixa' | 'normal' | 'alta' | 'urgente';
  cliente?: string;
  observacao?: string;
}

export interface SetorProducao {
  id: string;
  nome: string;
  operadores: number;
  maquinas: number;
  eficiencia: number;
  horasDisponiveis: number;
  horasNecessarias: number;
  horasUtilizadas: number;
  capacidadePercentual: number;
  lotacao: number;
  status: 'verde' | 'amarelo' | 'vermelho';
  gargalo: boolean;
  turnosAtivos: number;
}

export interface CapacidadeDiaria {
  data: string;
  horasDisponiveis: number;
  horasProgramadas: number;
  horasRealizadas: number;
  ocupacaoPercentual: number;
  folga: number; // Sempre 15% fixo
  status: 'verde' | 'amarelo' | 'vermelho';
  diasEquivalentes: number;
}

export interface ProgramacaoDiaria {
  data: string;
  ops: OrdemProducao[];
  capacidadeTotal: number;
  capacidadeUtilizada: number;
  folga: number;
  ocupacaoPercentual: number;
  diasEquivalentes: number;
  status: 'verde' | 'amarelo' | 'vermelho';
  gargalos: string[];
}

// FOLGA FIXA - NÃO EDITÁVEL
export const FOLGA_PRODUCAO = 0.15; // 15%

// Setores de produção com cálculo de capacidade
export const setoresProducao: SetorProducao[] = [
  { 
    id: 'CRE', nome: 'Corte da Estrutura', 
    operadores: 4, maquinas: 0, eficiencia: 70,
    horasDisponiveis: 17.6, horasNecessarias: 0.92, horasUtilizadas: 0.92,
    capacidadePercentual: 95, lotacao: 95,
    status: 'vermelho', gargalo: true, turnosAtivos: 1
  },
  { 
    id: 'MOE', nome: 'Montagem da Estrutura', 
    operadores: 6, maquinas: 0, eficiencia: 70,
    horasDisponiveis: 15.4, horasNecessarias: 8.35, horasUtilizadas: 7.1,
    capacidadePercentual: 46, lotacao: 46,
    status: 'verde', gargalo: false, turnosAtivos: 1
  },
  { 
    id: 'PER', nome: 'Colocação de Percintas/Molas', 
    operadores: 2, maquinas: 0, eficiencia: 80,
    horasDisponiveis: 52.8, horasNecessarias: 13.7, horasUtilizadas: 39.1,
    capacidadePercentual: 74, lotacao: 74,
    status: 'amarelo', gargalo: false, turnosAtivos: 1
  },
  { 
    id: 'ESP', nome: 'Colagem de Espuma', 
    operadores: 5, maquinas: 0, eficiencia: 70,
    horasDisponiveis: 17.6, horasNecessarias: 8.85, horasUtilizadas: 8.8,
    capacidadePercentual: 50, lotacao: 50,
    status: 'verde', gargalo: false, turnosAtivos: 1
  },
  { 
    id: 'REV', nome: 'Revestimento', 
    operadores: 11, maquinas: 0, eficiencia: 70,
    horasDisponiveis: 44.0, horasNecessarias: 11.13, horasUtilizadas: 33.0,
    capacidadePercentual: 75, lotacao: 75,
    status: 'amarelo', gargalo: false, turnosAtivos: 1
  },
  { 
    id: 'MON', nome: 'Montagem Final', 
    operadores: 2, maquinas: 0, eficiencia: 70,
    horasDisponiveis: 96.8, horasNecessarias: 22.28, horasUtilizadas: 74.5,
    capacidadePercentual: 77, lotacao: 77,
    status: 'amarelo', gargalo: false, turnosAtivos: 1
  },
  { 
    id: 'PEF', nome: 'Colocação de Pé e Fundo', 
    operadores: 1, maquinas: 0, eficiencia: 70,
    horasDisponiveis: 17.6, horasNecessarias: 6.85, horasUtilizadas: 10.75,
    capacidadePercentual: 61, lotacao: 61,
    status: 'verde', gargalo: false, turnosAtivos: 1
  },
  { 
    id: 'EMB', nome: 'Embalagem', 
    operadores: 3, maquinas: 0, eficiencia: 70,
    horasDisponiveis: 8.8, horasNecessarias: 2.5, horasUtilizadas: 6.25,
    capacidadePercentual: 71, lotacao: 71,
    status: 'amarelo', gargalo: false, turnosAtivos: 1
  },
  { 
    id: 'RTE', nome: 'Risco do Tecido', 
    operadores: 4, maquinas: 0, eficiencia: 70,
    horasDisponiveis: 26.4, horasNecessarias: 4.13, horasUtilizadas: 22.2,
    capacidadePercentual: 84, lotacao: 84,
    status: 'vermelho', gargalo: true, turnosAtivos: 1
  },
  { 
    id: 'CTE', nome: 'Corte do Tecido', 
    operadores: 2, maquinas: 0, eficiencia: 70,
    horasDisponiveis: 35.2, horasNecessarias: 10.25, horasUtilizadas: 24.95,
    capacidadePercentual: 71, lotacao: 71,
    status: 'amarelo', gargalo: false, turnosAtivos: 1
  },
  { 
    id: 'COS', nome: 'Costura', 
    operadores: 11, maquinas: 3, eficiencia: 70,
    horasDisponiveis: 17.6, horasNecessarias: 7.18, horasUtilizadas: 10.42,
    capacidadePercentual: 59, lotacao: 59,
    status: 'verde', gargalo: false, turnosAtivos: 1
  },
  { 
    id: 'LAM', nome: 'Laminação do Bloco', 
    operadores: 2, maquinas: 1, eficiencia: 70,
    horasDisponiveis: 96.8, horasNecessarias: 30.95, horasUtilizadas: 65.85,
    capacidadePercentual: 68, lotacao: 68,
    status: 'amarelo', gargalo: false, turnosAtivos: 1
  },
  { 
    id: 'MAL', nome: 'Montagem da Almofada', 
    operadores: 0, maquinas: 0, eficiencia: 70,
    horasDisponiveis: 17.6, horasNecessarias: 1.13, horasUtilizadas: 16.47,
    capacidadePercentual: 94, lotacao: 94,
    status: 'vermelho', gargalo: true, turnosAtivos: 1
  },
  { 
    id: 'CAE', nome: 'Corte Alm. Encosto', 
    operadores: 2, maquinas: 0, eficiencia: 70,
    horasDisponiveis: 17.6, horasNecessarias: 7.88, horasUtilizadas: 9.72,
    capacidadePercentual: 55, lotacao: 55,
    status: 'verde', gargalo: false, turnosAtivos: 1
  },
  { 
    id: 'EAE', nome: 'Encapar Alm. Enc./Ass.', 
    operadores: 1, maquinas: 0, eficiencia: 70,
    horasDisponiveis: 8.8, horasNecessarias: 292.42, horasUtilizadas: 8.8,
    capacidadePercentual: -3223, lotacao: -3223,
    status: 'vermelho', gargalo: true, turnosAtivos: 1
  },
];

// Ordens de Produção
export const ordensProducao: OrdemProducao[] = [
  {
    id: 'OP001',
    op: '2025-001245',
    produto: '112401',
    descricao: 'SOFÁ FLEX 02 LUGARES',
    quantidade: 20,
    dataProgramada: '2025-01-27',
    prazoEntrega: '2025-02-05',
    setor: 'Montagem da Estrutura',
    status: 'em_producao',
    origem: 'pcp',
    horasNecessarias: 16.0,
    horasRealizadas: 4.5,
    prioridade: 'alta',
    cliente: 'Móveis Paraná',
  },
  {
    id: 'OP002',
    op: '2025-001246',
    produto: '111482',
    descricao: 'SOFÁ ANCORA 02 LUGARES',
    quantidade: 1,
    dataProgramada: '2025-01-27',
    prazoEntrega: '2025-02-03',
    setor: 'Revestimento',
    status: 'aguardando',
    origem: 'manual',
    horasNecessarias: 4.3,
    horasRealizadas: 0,
    prioridade: 'normal',
    cliente: 'Decorações Sul',
  },
  {
    id: 'OP003',
    op: '2025-001247',
    produto: '6002',
    descricao: 'CADEIRA BERGAMO MADEIRA',
    quantidade: 200,
    dataProgramada: '2025-01-28',
    prazoEntrega: '2025-02-10',
    setor: 'Corte da Estrutura',
    status: 'aguardando',
    origem: 'erp',
    horasNecessarias: 24.0,
    horasRealizadas: 0,
    prioridade: 'alta',
    cliente: 'Atacadão Móveis',
  },
  {
    id: 'OP004',
    op: '2025-001248',
    produto: '4000',
    descricao: 'MESA FLORENÇA',
    quantidade: 50,
    dataProgramada: '2025-01-27',
    prazoEntrega: '2025-02-01',
    setor: 'Embalagem',
    status: 'em_producao',
    origem: 'sap',
    horasNecessarias: 8.5,
    horasRealizadas: 6.2,
    prioridade: 'urgente',
    cliente: 'Casa & Conforto',
  },
  {
    id: 'OP005',
    op: '2025-001249',
    produto: '6003',
    descricao: 'CADEIRA BERGAMO ESTOFADO',
    quantidade: 100,
    dataProgramada: '2025-01-29',
    prazoEntrega: '2025-02-12',
    setor: 'Costura',
    status: 'aguardando',
    origem: 'pcp',
    horasNecessarias: 18.0,
    horasRealizadas: 0,
    prioridade: 'normal',
    cliente: 'Lojas Lar',
  },
  {
    id: 'OP006',
    op: '2025-001250',
    produto: '111011',
    descricao: 'SOFÁ ASTOR 03 LUGARES',
    quantidade: 1,
    dataProgramada: '2025-01-30',
    prazoEntrega: '2025-02-08',
    setor: 'Colagem de Espuma',
    status: 'bloqueado',
    origem: 'manual',
    horasNecessarias: 4.64,
    horasRealizadas: 0,
    prioridade: 'alta',
    observacao: 'Aguardando material - Espuma D28',
  },
];

// Capacidade por dia
export const capacidadeDiaria: CapacidadeDiaria[] = [
  { data: '2025-01-27', horasDisponiveis: 244.2, horasProgramadas: 178.5, horasRealizadas: 142.3, ocupacaoPercentual: 73, folga: 15, status: 'amarelo', diasEquivalentes: 1 },
  { data: '2025-01-28', horasDisponiveis: 244.2, horasProgramadas: 195.0, horasRealizadas: 0, ocupacaoPercentual: 80, folga: 15, status: 'vermelho', diasEquivalentes: 1 },
  { data: '2025-01-29', horasDisponiveis: 244.2, horasProgramadas: 156.8, horasRealizadas: 0, ocupacaoPercentual: 64, folga: 15, status: 'verde', diasEquivalentes: 1 },
  { data: '2025-01-30', horasDisponiveis: 244.2, horasProgramadas: 189.2, horasRealizadas: 0, ocupacaoPercentual: 77, folga: 15, status: 'amarelo', diasEquivalentes: 1 },
  { data: '2025-01-31', horasDisponiveis: 244.2, horasProgramadas: 145.0, horasRealizadas: 0, ocupacaoPercentual: 59, folga: 15, status: 'verde', diasEquivalentes: 1 },
];

// KPIs do CIP
export const cipKPIs = {
  capacidadeTotal: 244.2,
  capacidadeUtilizada: 178.5,
  ocupacaoPercentual: 73,
  folga: 15,
  opsAtivas: 6,
  opsConcluidas: 142,
  opsAtrasadas: 3,
  gargalos: 4,
  turnosAtivos: 1,
  eficienciaMedia: 70,
  diasProgramados: 5,
  horasParaDias: 8, // 8 horas = 1 dia
};

// Funções utilitárias
export function calcularDiasEquivalentes(horas: number): number {
  return Math.ceil(horas / cipKPIs.horasParaDias);
}

export function calcularCapacidadeComFolga(capacidadeTotal: number): number {
  return capacidadeTotal * (1 - FOLGA_PRODUCAO);
}

export function getStatusCor(ocupacao: number): 'verde' | 'amarelo' | 'vermelho' {
  if (ocupacao >= 85) return 'vermelho';
  if (ocupacao >= 70) return 'amarelo';
  return 'verde';
}

export function getStatusLabel(status: 'verde' | 'amarelo' | 'vermelho'): string {
  switch (status) {
    case 'verde': return 'Dentro da capacidade';
    case 'amarelo': return 'Atenção - Próximo do limite';
    case 'vermelho': return 'Crítico - Capacidade excedida';
  }
}

// Dados para gráficos
export const cipChartData = {
  ocupacaoPorDia: capacidadeDiaria.map(d => ({
    dia: new Date(d.data).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }),
    ocupacao: d.ocupacaoPercentual,
    folga: d.folga,
    limite: 85,
  })),
  capacidadePorSetor: setoresProducao.slice(0, 10).map(s => ({
    setor: s.nome.substring(0, 12),
    utilizada: Math.min(100, Math.max(0, s.lotacao)),
    disponivel: 100 - Math.min(100, Math.max(0, s.lotacao)),
  })),
  producaoPorStatus: [
    { status: 'Em Produção', quantidade: 2, cor: '#3b82f6' },
    { status: 'Aguardando', quantidade: 3, cor: '#f59e0b' },
    { status: 'Bloqueado', quantidade: 1, cor: '#ef4444' },
    { status: 'Concluído', quantidade: 142, cor: '#22c55e' },
  ],
  evolucaoProducao: [
    { semana: 'Sem 1', planejado: 850, realizado: 780 },
    { semana: 'Sem 2', planejado: 920, realizado: 875 },
    { semana: 'Sem 3', planejado: 880, realizado: 910 },
    { semana: 'Sem 4', planejado: 950, realizado: 920 },
  ],
  gargalosPorSetor: setoresProducao.filter(s => s.gargalo).map(s => ({
    setor: s.nome,
    impacto: Math.abs(Math.min(0, 100 - s.lotacao)),
    horasDeficit: s.horasNecessarias - s.horasDisponiveis,
  })),
};
