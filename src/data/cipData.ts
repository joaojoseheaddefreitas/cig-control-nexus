// CIP CONTROL 360 - Dados de Produção Industrial
// Fonte: Carga MARCOBIN MÓVEIS + Lógica PCP Industrial

// Estados do pedido em produção - Rastreáveis Manual + Automático (Scanner/QR)
export type EstadoPedido = 
  | 'aguardando'       // Aguardando entrada no setor
  | 'em_espera'        // Em espera (fila do setor)
  | 'em_processo'      // Em execução ativa
  | 'pouco_processado' // Iniciado mas parado
  | 'concluido'        // Finalizado no setor atual
  | 'expedido';        // Saída final (baixa obrigatória)

export type OrigemRegistro = 'manual' | 'scanner' | 'qr_code' | 'sensor' | 'pcp' | 'erp' | 'sap';

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
  estadoAtual: EstadoPedido;
  origem: OrigemRegistro;
  horasNecessarias: number;
  horasRealizadas: number;
  prioridade: 'baixa' | 'normal' | 'alta' | 'urgente';
  cliente?: string;
  observacao?: string;
  // Rastreamento por setor
  historicoSetores: HistoricoSetor[];
  percentualConcluido: number;
  ultimaAtualizacao: string;
  origemUltimaAtualizacao: OrigemRegistro;
}

export interface HistoricoSetor {
  setorId: string;
  setorNome: string;
  entrada: string;
  saida?: string;
  estado: EstadoPedido;
  operador?: string;
  origemRegistro: OrigemRegistro;
  tempoGasto: number; // minutos
  consumoMaterial?: ConsumoMaterial[];
  retrabalho?: boolean;
  observacao?: string;
}

export interface ConsumoMaterial {
  materialId: string;
  nome: string;
  quantidade: number;
  unidade: string;
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
  status: 'verde' | 'amarelo' | 'vermelho' | 'azul'; // azul = ocioso
  gargalo: boolean;
  turnosAtivos: number;
  ativo: boolean; // Pode ativar/desativar
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
    status: 'vermelho', gargalo: true, turnosAtivos: 1, ativo: true
  },
  { 
    id: 'MOE', nome: 'Montagem da Estrutura', 
    operadores: 6, maquinas: 0, eficiencia: 70,
    horasDisponiveis: 15.4, horasNecessarias: 8.35, horasUtilizadas: 7.1,
    capacidadePercentual: 46, lotacao: 46,
    status: 'verde', gargalo: false, turnosAtivos: 1, ativo: true
  },
  { 
    id: 'PER', nome: 'Colocação de Percintas/Molas', 
    operadores: 2, maquinas: 0, eficiencia: 80,
    horasDisponiveis: 52.8, horasNecessarias: 13.7, horasUtilizadas: 39.1,
    capacidadePercentual: 74, lotacao: 74,
    status: 'amarelo', gargalo: false, turnosAtivos: 1, ativo: true
  },
  { 
    id: 'ESP', nome: 'Colagem de Espuma', 
    operadores: 5, maquinas: 0, eficiencia: 70,
    horasDisponiveis: 17.6, horasNecessarias: 8.85, horasUtilizadas: 8.8,
    capacidadePercentual: 50, lotacao: 50,
    status: 'verde', gargalo: false, turnosAtivos: 1, ativo: true
  },
  { 
    id: 'REV', nome: 'Revestimento', 
    operadores: 11, maquinas: 0, eficiencia: 70,
    horasDisponiveis: 44.0, horasNecessarias: 11.13, horasUtilizadas: 33.0,
    capacidadePercentual: 75, lotacao: 75,
    status: 'amarelo', gargalo: false, turnosAtivos: 1, ativo: true
  },
  { 
    id: 'MON', nome: 'Montagem Final', 
    operadores: 2, maquinas: 0, eficiencia: 70,
    horasDisponiveis: 96.8, horasNecessarias: 22.28, horasUtilizadas: 74.5,
    capacidadePercentual: 77, lotacao: 77,
    status: 'amarelo', gargalo: false, turnosAtivos: 1, ativo: true
  },
  { 
    id: 'PEF', nome: 'Colocação de Pé e Fundo', 
    operadores: 1, maquinas: 0, eficiencia: 70,
    horasDisponiveis: 17.6, horasNecessarias: 6.85, horasUtilizadas: 10.75,
    capacidadePercentual: 61, lotacao: 61,
    status: 'verde', gargalo: false, turnosAtivos: 1, ativo: true
  },
  { 
    id: 'EMB', nome: 'Embalagem', 
    operadores: 3, maquinas: 0, eficiencia: 70,
    horasDisponiveis: 8.8, horasNecessarias: 2.5, horasUtilizadas: 6.25,
    capacidadePercentual: 71, lotacao: 71,
    status: 'amarelo', gargalo: false, turnosAtivos: 1, ativo: true
  },
  { 
    id: 'RTE', nome: 'Risco do Tecido', 
    operadores: 4, maquinas: 0, eficiencia: 70,
    horasDisponiveis: 26.4, horasNecessarias: 4.13, horasUtilizadas: 22.2,
    capacidadePercentual: 84, lotacao: 84,
    status: 'vermelho', gargalo: true, turnosAtivos: 1, ativo: true
  },
  { 
    id: 'CTE', nome: 'Corte do Tecido', 
    operadores: 2, maquinas: 0, eficiencia: 70,
    horasDisponiveis: 35.2, horasNecessarias: 10.25, horasUtilizadas: 24.95,
    capacidadePercentual: 71, lotacao: 71,
    status: 'amarelo', gargalo: false, turnosAtivos: 1, ativo: true
  },
  { 
    id: 'COS', nome: 'Costura', 
    operadores: 11, maquinas: 3, eficiencia: 70,
    horasDisponiveis: 17.6, horasNecessarias: 7.18, horasUtilizadas: 10.42,
    capacidadePercentual: 59, lotacao: 59,
    status: 'verde', gargalo: false, turnosAtivos: 1, ativo: true
  },
  { 
    id: 'LAM', nome: 'Laminação do Bloco', 
    operadores: 2, maquinas: 1, eficiencia: 70,
    horasDisponiveis: 96.8, horasNecessarias: 30.95, horasUtilizadas: 65.85,
    capacidadePercentual: 68, lotacao: 68,
    status: 'amarelo', gargalo: false, turnosAtivos: 1, ativo: true
  },
  { 
    id: 'MAL', nome: 'Montagem da Almofada', 
    operadores: 0, maquinas: 0, eficiencia: 70,
    horasDisponiveis: 17.6, horasNecessarias: 1.13, horasUtilizadas: 16.47,
    capacidadePercentual: 94, lotacao: 94,
    status: 'vermelho', gargalo: true, turnosAtivos: 1, ativo: true
  },
  { 
    id: 'CAE', nome: 'Corte Alm. Encosto', 
    operadores: 2, maquinas: 0, eficiencia: 70,
    horasDisponiveis: 17.6, horasNecessarias: 7.88, horasUtilizadas: 9.72,
    capacidadePercentual: 55, lotacao: 55,
    status: 'verde', gargalo: false, turnosAtivos: 1, ativo: true
  },
  { 
    id: 'EAE', nome: 'Encapar Alm. Enc./Ass.', 
    operadores: 1, maquinas: 0, eficiencia: 70,
    horasDisponiveis: 8.8, horasNecessarias: 292.42, horasUtilizadas: 8.8,
    capacidadePercentual: 100, lotacao: 100,
    status: 'vermelho', gargalo: true, turnosAtivos: 1, ativo: true
  },
  { 
    id: 'EXP', nome: 'Expedição', 
    operadores: 3, maquinas: 0, eficiencia: 85,
    horasDisponiveis: 24.0, horasNecessarias: 12.0, horasUtilizadas: 10.5,
    capacidadePercentual: 44, lotacao: 44,
    status: 'verde', gargalo: false, turnosAtivos: 1, ativo: true
  },
];

// Ordens de Produção com estados rastreáveis
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
    estadoAtual: 'em_processo',
    origem: 'pcp',
    horasNecessarias: 16.0,
    horasRealizadas: 4.5,
    prioridade: 'alta',
    cliente: 'Móveis Paraná',
    percentualConcluido: 28,
    ultimaAtualizacao: '2025-01-27T14:30:00',
    origemUltimaAtualizacao: 'scanner',
    historicoSetores: [
      {
        setorId: 'CRE', setorNome: 'Corte da Estrutura',
        entrada: '2025-01-27T08:00:00', saida: '2025-01-27T10:30:00',
        estado: 'concluido', operador: 'José Silva',
        origemRegistro: 'scanner', tempoGasto: 150
      },
      {
        setorId: 'MOE', setorNome: 'Montagem da Estrutura',
        entrada: '2025-01-27T10:45:00',
        estado: 'em_processo', operador: 'Carlos Souza',
        origemRegistro: 'scanner', tempoGasto: 225
      }
    ]
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
    estadoAtual: 'em_espera',
    origem: 'manual',
    horasNecessarias: 4.3,
    horasRealizadas: 0,
    prioridade: 'normal',
    cliente: 'Decorações Sul',
    percentualConcluido: 0,
    ultimaAtualizacao: '2025-01-27T08:00:00',
    origemUltimaAtualizacao: 'manual',
    historicoSetores: []
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
    status: 'em_producao',
    estadoAtual: 'pouco_processado',
    origem: 'erp',
    horasNecessarias: 24.0,
    horasRealizadas: 3.5,
    prioridade: 'alta',
    cliente: 'Atacadão Móveis',
    percentualConcluido: 15,
    ultimaAtualizacao: '2025-01-28T09:15:00',
    origemUltimaAtualizacao: 'qr_code',
    historicoSetores: [
      {
        setorId: 'CRE', setorNome: 'Corte da Estrutura',
        entrada: '2025-01-28T08:00:00',
        estado: 'pouco_processado', operador: 'Marcos Lima',
        origemRegistro: 'qr_code', tempoGasto: 75,
        observacao: 'Aguardando ajuste na máquina de corte'
      }
    ]
  },
  {
    id: 'OP004',
    op: '2025-001248',
    produto: '4000',
    descricao: 'MESA FLORENÇA',
    quantidade: 50,
    dataProgramada: '2025-01-27',
    prazoEntrega: '2025-02-01',
    setor: 'Expedição',
    status: 'em_producao',
    estadoAtual: 'em_processo',
    origem: 'sap',
    horasNecessarias: 8.5,
    horasRealizadas: 6.2,
    prioridade: 'urgente',
    cliente: 'Casa & Conforto',
    percentualConcluido: 85,
    ultimaAtualizacao: '2025-01-27T15:00:00',
    origemUltimaAtualizacao: 'scanner',
    historicoSetores: [
      {
        setorId: 'CRE', setorNome: 'Corte da Estrutura',
        entrada: '2025-01-26T08:00:00', saida: '2025-01-26T10:00:00',
        estado: 'concluido', origemRegistro: 'scanner', tempoGasto: 120
      },
      {
        setorId: 'MON', setorNome: 'Montagem Final',
        entrada: '2025-01-26T10:30:00', saida: '2025-01-27T11:00:00',
        estado: 'concluido', origemRegistro: 'scanner', tempoGasto: 480
      },
      {
        setorId: 'EMB', setorNome: 'Embalagem',
        entrada: '2025-01-27T11:30:00', saida: '2025-01-27T14:00:00',
        estado: 'concluido', origemRegistro: 'scanner', tempoGasto: 150
      },
      {
        setorId: 'EXP', setorNome: 'Expedição',
        entrada: '2025-01-27T14:15:00',
        estado: 'em_processo', origemRegistro: 'scanner', tempoGasto: 45
      }
    ]
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
    estadoAtual: 'aguardando',
    origem: 'pcp',
    horasNecessarias: 18.0,
    horasRealizadas: 0,
    prioridade: 'normal',
    cliente: 'Lojas Lar',
    percentualConcluido: 0,
    ultimaAtualizacao: '2025-01-27T08:00:00',
    origemUltimaAtualizacao: 'pcp',
    historicoSetores: []
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
    estadoAtual: 'em_espera',
    origem: 'manual',
    horasNecessarias: 4.64,
    horasRealizadas: 0,
    prioridade: 'alta',
    observacao: 'Aguardando material - Espuma D28',
    percentualConcluido: 0,
    ultimaAtualizacao: '2025-01-27T09:00:00',
    origemUltimaAtualizacao: 'manual',
    historicoSetores: []
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

export function getStatusCor(ocupacao: number): 'verde' | 'amarelo' | 'vermelho' | 'azul' {
  if (ocupacao >= 85) return 'vermelho';
  if (ocupacao >= 70) return 'amarelo';
  if (ocupacao <= 30) return 'azul'; // Ocioso
  return 'verde';
}

export function getStatusLabel(status: 'verde' | 'amarelo' | 'vermelho' | 'azul'): string {
  switch (status) {
    case 'verde': return 'Dentro da capacidade';
    case 'amarelo': return 'Atenção - Próximo do limite';
    case 'vermelho': return 'Crítico - Capacidade excedida';
    case 'azul': return 'Ocioso - Baixa utilização';
  }
}

export function getEstadoPedidoLabel(estado: EstadoPedido): string {
  switch (estado) {
    case 'aguardando': return 'Aguardando';
    case 'em_espera': return 'Em Espera';
    case 'em_processo': return 'Em Processo';
    case 'pouco_processado': return 'Pouco Processado';
    case 'concluido': return 'Concluído';
    case 'expedido': return 'Expedido';
  }
}

export function getEstadoPedidoCor(estado: EstadoPedido): string {
  switch (estado) {
    case 'aguardando': return '#6b7280';
    case 'em_espera': return '#f59e0b';
    case 'em_processo': return '#3b82f6';
    case 'pouco_processado': return '#f97316';
    case 'concluido': return '#22c55e';
    case 'expedido': return '#14b8a6';
  }
}

export function getOrigemRegistroLabel(origem: OrigemRegistro): string {
  switch (origem) {
    case 'manual': return 'Manual';
    case 'scanner': return 'Scanner';
    case 'qr_code': return 'QR Code';
    case 'sensor': return 'Sensor';
    case 'pcp': return 'PCP';
    case 'erp': return 'ERP';
    case 'sap': return 'SAP';
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
  capacidadePorSetor: setoresProducao.filter(s => s.ativo).slice(0, 10).map(s => ({
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
  producaoPorEstado: [
    { estado: 'Aguardando', quantidade: 2, cor: '#6b7280' },
    { estado: 'Em Espera', quantidade: 2, cor: '#f59e0b' },
    { estado: 'Em Processo', quantidade: 2, cor: '#3b82f6' },
    { estado: 'Pouco Processado', quantidade: 1, cor: '#f97316' },
  ],
  evolucaoProducao: [
    { semana: 'Sem 1', planejado: 850, realizado: 780 },
    { semana: 'Sem 2', planejado: 920, realizado: 875 },
    { semana: 'Sem 3', planejado: 880, realizado: 910 },
    { semana: 'Sem 4', planejado: 950, realizado: 920 },
  ],
  gargalosPorSetor: setoresProducao.filter(s => s.gargalo && s.ativo).map(s => ({
    setor: s.nome,
    impacto: Math.abs(Math.min(0, 100 - s.lotacao)),
    horasDeficit: s.horasNecessarias - s.horasDisponiveis,
  })),
};
