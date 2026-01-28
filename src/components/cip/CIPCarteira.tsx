import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Package, 
  TrendingUp, 
  Calendar, 
  AlertTriangle, 
  Filter, 
  Search,
  ChevronDown,
  Clock,
  CheckCircle,
  AlertCircle,
  Play,
  Pause
} from 'lucide-react';

// Dados de setores para carga
const setoresCarteira = [
  { 
    nome: 'Corte', 
    carga: 34, 
    saldo: '+430.5h', 
    maoObra: '4/2', 
    capacidade: 650, 
    necessidade: 220, 
    diasCarteira: 7.1,
    gargalo: false 
  },
  { 
    nome: 'Montagem Estrutura', 
    carga: 38, 
    saldo: '+291.2h', 
    maoObra: '3/1', 
    capacidade: 471, 
    necessidade: 180, 
    diasCarteira: 8,
    gargalo: false 
  },
  { 
    nome: 'Montagem Base', 
    carga: 37, 
    saldo: '+296.2h', 
    maoObra: '3/1', 
    capacidade: 471, 
    necessidade: 175, 
    diasCarteira: 7.8,
    gargalo: false 
  },
  { 
    nome: 'Corte Tecido', 
    carga: 53, 
    saldo: '+143.1h', 
    maoObra: '2/1', 
    capacidade: 303, 
    necessidade: 160, 
    diasCarteira: 11.1,
    gargalo: true 
  },
  { 
    nome: 'Costura', 
    carga: 52, 
    saldo: '+562.7h', 
    maoObra: '8/4', 
    capacidade: 1183, 
    necessidade: 620, 
    diasCarteira: 11,
    gargalo: false 
  },
  { 
    nome: 'Montagem Almofadas', 
    carga: 40, 
    saldo: '+378.3h', 
    maoObra: '4/2', 
    capacidade: 628, 
    necessidade: 250, 
    diasCarteira: 8.4,
    gargalo: false 
  },
  { 
    nome: 'Estofamento', 
    carga: 53, 
    saldo: '+429.2h', 
    maoObra: '6/3', 
    capacidade: 909, 
    necessidade: 480, 
    diasCarteira: 11.1,
    gargalo: false 
  },
  { 
    nome: 'Acabamento', 
    carga: 38, 
    saldo: '+309h', 
    maoObra: '3/1', 
    capacidade: 499, 
    necessidade: 190, 
    diasCarteira: 8,
    gargalo: false 
  },
];

// Dados de pedidos
const pedidosCarteira = [
  { 
    id: 'PED-1847', 
    cliente: 'Móveis Silva', 
    produto: 'Sofá 3 Lugares Retrátil', 
    setor: 'Corte',
    valor: 8670, 
    progresso: 12, 
    status: 'execucao',
    prazo: 'no_prazo',
    diasAtraso: null
  },
  { 
    id: 'PED-1846', 
    cliente: 'Loja do Conforto', 
    produto: 'Sofá Canto 5 Lugares', 
    setor: 'Costura',
    valor: 22950, 
    progresso: 45, 
    status: 'execucao',
    prazo: 'atrasado',
    diasAtraso: -6
  },
  { 
    id: 'PED-1845', 
    cliente: 'Decor House', 
    produto: 'Poltrona Decorativa', 
    setor: 'Montagem',
    valor: 10320, 
    progresso: 72, 
    status: 'execucao',
    prazo: 'no_prazo',
    diasAtraso: null
  },
  { 
    id: 'PED-1844', 
    cliente: 'Casa & Estilo', 
    produto: 'Sofá 2 Lugares Fixo', 
    setor: 'Acabamento',
    valor: 7560, 
    progresso: 88, 
    status: 'execucao',
    prazo: 'no_prazo',
    diasAtraso: null
  },
  { 
    id: 'PED-1843', 
    cliente: 'Sleep Store', 
    produto: 'Cabeceira Queen', 
    setor: 'Embalagem',
    valor: 5340, 
    progresso: 95, 
    status: 'execucao',
    prazo: 'no_prazo',
    diasAtraso: null
  },
  { 
    id: 'PED-1842', 
    cliente: 'Magazine Casa', 
    produto: 'Sofá 3 Lugares Retrátil', 
    setor: 'Corte',
    valor: 28900, 
    progresso: 0, 
    status: 'fila',
    prazo: 'atrasado',
    diasAtraso: -4
  },
  { 
    id: 'PED-1841', 
    cliente: 'Relax Móveis', 
    produto: 'Poltrona Reclinável', 
    setor: 'Costura',
    valor: 20280, 
    progresso: 28, 
    status: 'fila',
    prazo: 'atrasado',
    diasAtraso: -8
  },
  { 
    id: 'PED-1840', 
    cliente: 'Conforto Total', 
    produto: 'Sofá Canto 5 Lugares', 
    setor: 'Embalagem',
    valor: 9180, 
    progresso: 100, 
    status: 'concluido',
    prazo: 'no_prazo',
    diasAtraso: null
  },
];

// Componente KPI Card específico da Carteira
function CarteiraKPICard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  variant = 'default' 
}: { 
  title: string; 
  value: string | number; 
  subtitle: string; 
  icon: React.ElementType;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}) {
  const variantStyles = {
    default: 'text-blue-400',
    success: 'text-green-400',
    warning: 'text-yellow-400',
    danger: 'text-red-400'
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground uppercase tracking-wide">{title}</span>
        <Icon className={`h-4 w-4 ${variantStyles[variant]}`} />
      </div>
      <p className={`text-2xl md:text-3xl font-bold ${variantStyles[variant]}`}>{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
    </Card>
  );
}

// Componente Card de Setor
function SetorCarteiraCard({ setor }: { setor: typeof setoresCarteira[0] }) {
  const getCargaColor = (carga: number) => {
    if (carga >= 80) return 'text-red-400';
    if (carga >= 60) return 'text-yellow-400';
    return 'text-blue-400';
  };

  const getProgressColor = (carga: number) => {
    if (carga >= 80) return 'bg-red-500';
    if (carga >= 60) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  return (
    <Card className="bg-card/60 backdrop-blur-sm border-border/50 p-4 relative">
      {setor.gargalo && (
        <Badge className="absolute top-2 right-2 bg-red-600 text-white text-xs">
          ⚠ GARGALO
        </Badge>
      )}
      
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-foreground truncate pr-2">{setor.nome}</h4>
        <div className="w-2 h-2 rounded-full bg-blue-500" />
      </div>

      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">Carga</span>
        <span className={`text-sm font-bold ${getCargaColor(setor.carga)}`}>{setor.carga}%</span>
      </div>

      <div className="h-2 bg-secondary rounded-full overflow-hidden mb-4">
        <div 
          className={`h-full ${getProgressColor(setor.carga)} transition-all`}
          style={{ width: `${setor.carga}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
        <div>
          <span className="text-muted-foreground">Saldo: </span>
          <span className="text-green-400 font-semibold">{setor.saldo}</span>
        </div>
        <div>
          <span className="text-muted-foreground">MO: </span>
          <span className="text-foreground font-semibold">{setor.maoObra}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
        <span>↻ Cap: <span className="text-foreground font-medium">{setor.capacidade}h</span></span>
        <span>◐ Nec: <span className="text-foreground font-medium">{setor.necessidade}h</span></span>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border/30">
        <span className="text-xs text-muted-foreground">Dias em Carteira</span>
        <span className="text-sm font-bold text-blue-400">{setor.diasCarteira}d</span>
      </div>
    </Card>
  );
}

// Componente Card de Pedido
function PedidoCard({ pedido }: { pedido: typeof pedidosCarteira[0] }) {
  const getStatusBadge = () => {
    switch (pedido.status) {
      case 'execucao':
        return <Badge className="bg-green-600 text-white">Em Execução</Badge>;
      case 'fila':
        return <Badge className="bg-yellow-600 text-white">Na Fila</Badge>;
      case 'concluido':
        return <Badge className="bg-blue-600 text-white">Concluído</Badge>;
      default:
        return null;
    }
  };

  const getPrazoIndicator = () => {
    if (pedido.prazo === 'no_prazo') {
      return <span className="text-green-400 text-sm">No prazo</span>;
    }
    return (
      <span className="text-red-400 text-sm flex items-center gap-1">
        <AlertTriangle className="h-3 w-3" />
        {pedido.diasAtraso}h
      </span>
    );
  };

  const getProgressColor = () => {
    if (pedido.progresso >= 80) return 'bg-green-500';
    if (pedido.progresso >= 50) return 'bg-blue-500';
    if (pedido.progresso >= 20) return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  return (
    <Card className={`p-4 transition-all ${
      pedido.prazo === 'atrasado' ? 'bg-card/60 border-l-2 border-l-red-500' : 'bg-card/40'
    } backdrop-blur-sm border-border/50`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-bold text-foreground">{pedido.id}</p>
          <p className="text-sm text-muted-foreground">{pedido.cliente}</p>
        </div>
        {getStatusBadge()}
      </div>

      <p className="text-sm text-foreground mb-1">{pedido.produto}</p>
      <p className="text-xs text-muted-foreground mb-3">Setor: {pedido.setor}</p>

      <div className="flex items-center justify-between mb-2">
        <span className="text-lg font-bold text-foreground">
          R$ {pedido.valor.toLocaleString('pt-BR')}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
          <div 
            className={`h-full ${getProgressColor()} transition-all`}
            style={{ width: `${pedido.progresso}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground w-8">{pedido.progresso}%</span>
        {getPrazoIndicator()}
      </div>
    </Card>
  );
}

// Componente Timeline de Entregas
function TimelineEntregas() {
  const [expandedGroups, setExpandedGroups] = useState({
    iniciando: true,
    andamento: true,
    concluindo: true,
    concluidos: true
  });

  const iniciando = pedidosCarteira.filter(p => p.progresso < 20);
  const emAndamento = pedidosCarteira.filter(p => p.progresso >= 20 && p.progresso < 80);
  const concluindo = pedidosCarteira.filter(p => p.progresso >= 80 && p.progresso < 100);
  const concluidos = pedidosCarteira.filter(p => p.progresso === 100);

  const TimelineItem = ({ pedido }: { pedido: typeof pedidosCarteira[0] }) => {
    const getIcon = () => {
      if (pedido.prazo === 'atrasado') return <AlertCircle className="h-4 w-4 text-red-400" />;
      if (pedido.progresso === 100) return <CheckCircle className="h-4 w-4 text-green-400" />;
      return <Clock className="h-4 w-4 text-blue-400" />;
    };

    return (
      <div className="flex items-center gap-3 py-2 px-3 hover:bg-secondary/30 rounded-lg transition-colors">
        {getIcon()}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm">{pedido.id}</p>
          <p className="text-xs text-muted-foreground truncate">{pedido.produto}</p>
          <p className="text-xs text-muted-foreground">{pedido.cliente}</p>
        </div>
        <div className="text-right">
          <p className={`text-sm font-bold ${
            pedido.prazo === 'atrasado' ? 'text-red-400' : 'text-green-400'
          }`}>
            {pedido.progresso}%
          </p>
          {pedido.diasAtraso && (
            <p className="text-xs text-red-400">{pedido.diasAtraso}h</p>
          )}
        </div>
      </div>
    );
  };

  const GroupSection = ({ 
    title, 
    icon: Icon,
    items, 
    groupKey,
    iconColor = 'text-blue-400'
  }: { 
    title: string; 
    icon: React.ElementType;
    items: typeof pedidosCarteira;
    groupKey: keyof typeof expandedGroups;
    iconColor?: string;
  }) => (
    <Collapsible 
      open={expandedGroups[groupKey]} 
      onOpenChange={(open) => setExpandedGroups(prev => ({ ...prev, [groupKey]: open }))}
    >
      <CollapsibleTrigger className="flex items-center gap-2 w-full py-2 hover:bg-secondary/20 rounded-lg px-2 transition-colors">
        <Icon className={`h-4 w-4 ${iconColor}`} />
        <span className="text-sm font-medium text-foreground">{title}</span>
        <span className="text-xs text-muted-foreground">({items.length})</span>
        <ChevronDown className={`h-4 w-4 ml-auto transition-transform ${
          expandedGroups[groupKey] ? 'rotate-180' : ''
        }`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="ml-4 space-y-1">
        {items.map(item => (
          <TimelineItem key={item.id} pedido={item} />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="h-5 w-5 text-blue-400" />
        <h3 className="font-semibold text-foreground">Timeline de Entregas</h3>
      </div>

      <div className="space-y-2">
        <GroupSection 
          title="Iniciando" 
          icon={Play}
          items={iniciando} 
          groupKey="iniciando"
          iconColor="text-yellow-400"
        />
        <GroupSection 
          title="Em Andamento" 
          icon={Clock}
          items={emAndamento} 
          groupKey="andamento"
          iconColor="text-blue-400"
        />
        <GroupSection 
          title="Concluindo" 
          icon={CheckCircle}
          items={concluindo} 
          groupKey="concluindo"
          iconColor="text-green-400"
        />
        <GroupSection 
          title="Concluídos" 
          icon={CheckCircle}
          items={concluidos} 
          groupKey="concluidos"
          iconColor="text-emerald-400"
        />
      </div>

      <div className="mt-4 pt-4 border-t border-border/30 text-center">
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold">Modelo Industrial CIP</span> — João José Head de Freitas
        </p>
        <p className="text-xs text-muted-foreground">
          40 anos de chão de fábrica • Gargalo por saldo calculado, nunca estimado
        </p>
      </div>
    </Card>
  );
}

export function CIPCarteira() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [clienteFilter, setClienteFilter] = useState('todos');
  const [produtoFilter, setProdutoFilter] = useState('todos');
  const [cargaOpen, setCargaOpen] = useState(true);

  const totalPedidos = pedidosCarteira.length;
  const valorTotal = pedidosCarteira.reduce((acc, p) => acc + p.valor, 0);
  const totalUnidades = 50;
  const gargalo = setoresCarteira.find(s => s.gargalo);
  const diasCarteira = gargalo?.diasCarteira || 7.1;
  const pedidosAtrasados = pedidosCarteira.filter(p => p.prazo === 'atrasado').length;

  const filteredPedidos = pedidosCarteira.filter(pedido => {
    const matchSearch = pedido.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pedido.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pedido.produto.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchStatus = statusFilter === 'todos' || pedido.status === statusFilter;
    
    return matchSearch && matchStatus;
  });

  const dataAtual = new Date().toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Package className="h-6 w-6 text-cip" />
          <h2 className="text-2xl font-bold text-foreground">Carteira</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Gestão de pedidos em carteira • {dataAtual}
        </p>
        {gargalo && (
          <Badge className="bg-red-600/20 text-red-400 border-red-600/50 w-fit">
            ⚠ Gargalo: {gargalo.nome}
          </Badge>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <CarteiraKPICard
          title="PEDIDOS EM CARTEIRA"
          value={totalPedidos}
          subtitle={`${totalUnidades} unidades`}
          icon={Package}
          variant="default"
        />
        <CarteiraKPICard
          title="VALOR TOTAL"
          value={`R$ ${(valorTotal / 1000).toFixed(0)}.${(valorTotal % 1000).toString().padStart(3, '0').slice(0, 3)}`}
          subtitle={`${totalPedidos} pedidos`}
          icon={TrendingUp}
          variant="success"
        />
        <CarteiraKPICard
          title="DIAS EM CARTEIRA"
          value={`${diasCarteira}d`}
          subtitle={`Gargalo: ${gargalo?.nome || 'Nenhum'}`}
          icon={Calendar}
          variant="default"
        />
        <CarteiraKPICard
          title="PEDIDOS ATRASADOS"
          value={pedidosAtrasados}
          subtitle="Atenção necessária"
          icon={AlertTriangle}
          variant="danger"
        />
      </div>

      {/* Carga por Setor */}
      <Collapsible open={cargaOpen} onOpenChange={setCargaOpen}>
        <Card className="bg-card/50 backdrop-blur-sm border-border/50 p-4">
          <CollapsibleTrigger className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-400" />
              <h3 className="font-semibold text-foreground">Carga por Setor</h3>
            </div>
            <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${
              cargaOpen ? 'rotate-180' : ''
            }`} />
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              {setoresCarteira.map((setor, index) => (
                <SetorCarteiraCard key={index} setor={setor} />
              ))}
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Layout Principal: Filtros + Pedidos + Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Esquerda: Filtros + Lista de Pedidos */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filtros */}
          <Card className="bg-card/50 backdrop-blur-sm border-border/50 p-4">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-5 w-5 text-blue-400" />
              <h3 className="font-semibold text-foreground">Filtros</h3>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar pedido, cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-secondary/50 border-border/50"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-secondary/50 border-border/50">
                  <SelectValue placeholder="Todos Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos Status</SelectItem>
                  <SelectItem value="execucao">Em Execução</SelectItem>
                  <SelectItem value="fila">Na Fila</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                </SelectContent>
              </Select>

              <Select value={clienteFilter} onValueChange={setClienteFilter}>
                <SelectTrigger className="bg-secondary/50 border-border/50">
                  <SelectValue placeholder="Todos Clientes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos Clientes</SelectItem>
                  {[...new Set(pedidosCarteira.map(p => p.cliente))].map(cliente => (
                    <SelectItem key={cliente} value={cliente}>{cliente}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={produtoFilter} onValueChange={setProdutoFilter}>
                <SelectTrigger className="bg-secondary/50 border-border/50">
                  <SelectValue placeholder="Todos Produtos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos Produtos</SelectItem>
                  {[...new Set(pedidosCarteira.map(p => p.produto))].map(produto => (
                    <SelectItem key={produto} value={produto}>{produto}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select defaultValue="todos">
                <SelectTrigger className="bg-secondary/50 border-border/50">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="atrasados">Atrasados</SelectItem>
                  <SelectItem value="no_prazo">No Prazo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Lista de Pedidos */}
          <Card className="bg-card/50 backdrop-blur-sm border-border/50 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-400" />
                <h3 className="font-semibold text-foreground">Pedidos em Carteira</h3>
              </div>
              <span className="text-sm text-muted-foreground">
                {filteredPedidos.length} pedidos • R$ {valorTotal.toLocaleString('pt-BR')}
              </span>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
              {filteredPedidos.map(pedido => (
                <PedidoCard key={pedido.id} pedido={pedido} />
              ))}
            </div>
          </Card>
        </div>

        {/* Coluna Direita: Timeline */}
        <div>
          <TimelineEntregas />
        </div>
      </div>
    </div>
  );
}
