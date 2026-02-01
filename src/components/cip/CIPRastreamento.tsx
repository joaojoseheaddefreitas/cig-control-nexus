import { cn } from '@/lib/utils';
import { Search, Filter, AlertTriangle, Clock, CheckCircle, Package, Eye, Brain, TrendingUp, Lightbulb } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { ordensProducao, setoresProducao } from '@/data/cipData';
import { ModuleCard } from '@/components/ui/ModuleCard';

interface RastreamentoPedido {
  codigo: string;
  produto: string;
  cliente: string;
  progresso: number;
  setorAtual: string;
  status: 'em_producao' | 'atrasado' | 'aguardando' | 'concluido';
  etapas: {
    setor: string;
    status: 'concluido' | 'em_andamento' | 'pendente';
    horasEstimadas: number;
    horasRealizadas: number;
  }[];
  atraso?: number;
}

// Alertas automáticos da IA
const alertasIA = [
  {
    tipo: 'atraso',
    titulo: 'Pedido PED-1848 com atraso crítico',
    descricao: 'Atraso de 6h no setor de Costura. Impacto no prazo final.',
    sugestao: 'Priorizar esta OP no setor de Costura',
    prioridade: 'alta',
  },
  {
    tipo: 'gargalo',
    titulo: 'Gargalo detectado em Corte Tecido',
    descricao: '3 OPs aguardando há mais de 2h. Carga acima de 85%.',
    sugestao: 'Redistribuir 1 operador do setor de Acabamento',
    prioridade: 'media',
  },
  {
    tipo: 'tendencia',
    titulo: 'Tendência positiva em Montagem',
    descricao: 'Eficiência 12% acima da média semanal.',
    sugestao: 'Manter ritmo atual',
    prioridade: 'baixa',
  },
];

// Generate rastreamento data from ordensProducao
const rastreamentoData: RastreamentoPedido[] = ordensProducao.slice(0, 6).map((op, i) => {
  const progresso = Math.round((op.horasRealizadas / op.horasNecessarias) * 100);
  const setoresNomes = setoresProducao.slice(0, 5).map(s => s.nome);
  
  return {
    codigo: `PED-${1850 - i}`,
    produto: op.descricao,
    cliente: op.cliente || 'Cliente',
    progresso,
    setorAtual: op.setor,
    status: op.status === 'em_producao' ? 'em_producao' : 
            op.status === 'atrasado' ? 'atrasado' : 
            op.status === 'concluido' ? 'concluido' : 'aguardando',
    etapas: setoresNomes.map((setor, idx) => ({
      setor,
      status: idx < Math.floor(progresso / 20) ? 'concluido' : 
              idx === Math.floor(progresso / 20) ? 'em_andamento' : 'pendente',
      horasEstimadas: Math.round(op.horasNecessarias / 5),
      horasRealizadas: idx < Math.floor(progresso / 20) ? Math.round(op.horasNecessarias / 5) : 
                       idx === Math.floor(progresso / 20) ? Math.round((op.horasNecessarias / 5) * (progresso % 20) / 20) : 0,
    })),
    atraso: op.status === 'atrasado' ? 6 : undefined,
  };
});

const statusConfig = {
  em_producao: { label: 'Em Produção', color: 'bg-success text-success-foreground' },
  atrasado: { label: 'Atrasado', color: 'bg-destructive text-destructive-foreground' },
  aguardando: { label: 'Aguardando', color: 'bg-warning text-warning-foreground' },
  concluido: { label: 'Concluído', color: 'bg-primary text-primary-foreground' },
};

const alertaIconConfig = {
  atraso: { icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10' },
  gargalo: { icon: Clock, color: 'text-warning', bg: 'bg-warning/10' },
  tendencia: { icon: TrendingUp, color: 'text-success', bg: 'bg-success/10' },
};

export function CIPRastreamento() {
  const [search, setSearch] = useState('');
  const [selectedPedido, setSelectedPedido] = useState<RastreamentoPedido | null>(null);

  const filteredPedidos = rastreamentoData.filter(p => 
    p.codigo.toLowerCase().includes(search.toLowerCase()) ||
    p.produto.toLowerCase().includes(search.toLowerCase()) ||
    p.cliente.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Aviso: Apenas Leitura */}
      <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg flex items-center gap-3">
        <Eye className="h-5 w-5 text-primary" />
        <div>
          <p className="text-sm font-medium text-foreground">Modo Rastreamento – Apenas Leitura</p>
          <p className="text-xs text-muted-foreground">Esta aba é para visualização e análise de status. Não permite entrada ou baixa de dados.</p>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código, produto ou cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Filtros
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 text-center">
          <p className="text-2xl font-bold text-primary">{rastreamentoData.length}</p>
          <p className="text-xs text-muted-foreground">Total Ativos</p>
        </div>
        <div className="rounded-xl border border-success/30 bg-success/10 p-4 text-center">
          <p className="text-2xl font-bold text-success">{rastreamentoData.filter(p => p.status === 'em_producao').length}</p>
          <p className="text-xs text-muted-foreground">Em Produção</p>
        </div>
        <div className="rounded-xl border border-warning/30 bg-warning/10 p-4 text-center">
          <p className="text-2xl font-bold text-warning">{rastreamentoData.filter(p => p.status === 'aguardando').length}</p>
          <p className="text-xs text-muted-foreground">Aguardando</p>
        </div>
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-center">
          <p className="text-2xl font-bold text-destructive">{rastreamentoData.filter(p => p.status === 'atrasado').length}</p>
          <p className="text-xs text-muted-foreground">Atrasados</p>
        </div>
      </div>

      {/* Grid: Rastreamento + Alertas IA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pedidos em Execução */}
        <div className="lg:col-span-2 rounded-xl border border-border/30 bg-card/80 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-display font-bold text-foreground">Pedidos em Execução</h3>
            </div>
            <span className="text-xs text-muted-foreground">{filteredPedidos.length} ativos</span>
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {filteredPedidos.map((pedido) => {
              const progressColor = 
                pedido.progresso >= 80 ? 'bg-primary' :
                pedido.progresso >= 50 ? 'bg-warning' :
                'bg-destructive';

              return (
                <div 
                  key={pedido.codigo}
                  className={cn(
                    "rounded-xl border p-4 transition-all duration-300 cursor-pointer",
                    selectedPedido?.codigo === pedido.codigo 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border/30 hover:border-primary/30'
                  )}
                  onClick={() => setSelectedPedido(selectedPedido?.codigo === pedido.codigo ? null : pedido)}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{pedido.codigo}</span>
                        {pedido.atraso && pedido.atraso > 0 && (
                          <span className="flex items-center gap-1 text-xs text-destructive">
                            <AlertTriangle className="h-3 w-3" />
                            +{pedido.atraso}h
                          </span>
                        )}
                      </div>
                      <h3 className="font-display font-bold text-foreground mt-1">{pedido.produto}</h3>
                      <p className="text-xs text-muted-foreground">{pedido.cliente}</p>
                    </div>
                    
                    <div className="text-right">
                      <Badge className={cn('text-xs', statusConfig[pedido.status].color)}>
                        {statusConfig[pedido.status].label}
                      </Badge>
                      <p className={cn(
                        'text-2xl font-bold mt-1',
                        pedido.progresso >= 80 ? 'text-primary' :
                        pedido.progresso >= 50 ? 'text-warning' :
                        'text-foreground'
                      )}>
                        {pedido.progresso}%
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className={cn('h-full rounded-full transition-all duration-500', progressColor)}
                        style={{ width: `${pedido.progresso}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-right mt-1">Setor: {pedido.setorAtual}</p>
                  </div>

                  {/* Etapas (expanded) */}
                  {selectedPedido?.codigo === pedido.codigo && (
                    <div className="mt-4 pt-4 border-t border-border/30">
                      <h4 className="text-sm font-medium text-foreground mb-3">Etapas de Produção (Setor a Setor)</h4>
                      <div className="space-y-2">
                        {pedido.etapas.map((etapa, idx) => (
                          <div key={idx} className="flex items-center gap-3">
                            <div className={cn(
                              'w-6 h-6 rounded-full flex items-center justify-center',
                              etapa.status === 'concluido' ? 'bg-success text-success-foreground' :
                              etapa.status === 'em_andamento' ? 'bg-warning text-warning-foreground' :
                              'bg-secondary text-muted-foreground'
                            )}>
                              {etapa.status === 'concluido' ? (
                                <CheckCircle className="h-4 w-4" />
                              ) : etapa.status === 'em_andamento' ? (
                                <Clock className="h-3 w-3" />
                              ) : (
                                <span className="text-xs">{idx + 1}</span>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className={cn(
                                  'text-sm',
                                  etapa.status === 'pendente' ? 'text-muted-foreground' : 'text-foreground'
                                )}>
                                  {etapa.setor}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {etapa.horasRealizadas}h / {etapa.horasEstimadas}h
                                </span>
                              </div>
                              {etapa.status === 'em_andamento' && (
                                <div className="h-1 bg-secondary rounded-full mt-1 overflow-hidden">
                                  <div 
                                    className="h-full bg-warning rounded-full"
                                    style={{ width: `${(etapa.horasRealizadas / etapa.horasEstimadas) * 100}%` }}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Alertas Automáticos da IA */}
        <div className="rounded-xl border border-border/30 bg-card/80 p-4">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="h-5 w-5 text-cip" />
            <h3 className="font-display font-bold text-foreground">Alertas IA</h3>
          </div>
          
          <p className="text-xs text-muted-foreground mb-4">
            Alertas automáticos de atrasos e gargalos. A IA analisa mas <strong>não altera dados</strong>.
          </p>

          <div className="space-y-3">
            {alertasIA.map((alerta, idx) => {
              const config = alertaIconConfig[alerta.tipo as keyof typeof alertaIconConfig];
              const Icon = config.icon;
              
              return (
                <div key={idx} className={cn('p-3 rounded-lg border', config.bg, 'border-opacity-30')}>
                  <div className="flex items-start gap-3">
                    <Icon className={cn('h-4 w-4 mt-0.5', config.color)} />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-foreground">{alerta.titulo}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{alerta.descricao}</p>
                      <div className="mt-2 p-2 bg-secondary/50 rounded text-xs">
                        <span className="flex items-center gap-1">
                          <Lightbulb className="h-3 w-3 text-warning" />
                          <strong>Sugestão:</strong> {alerta.sugestao}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Disclaimer */}
          <div className="mt-4 p-3 bg-warning/10 border border-warning/30 rounded-lg">
            <p className="text-xs text-warning">
              ⚠️ A IA analisa e sugere, mas <strong>NÃO executa ações automaticamente</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pt-4 border-t border-border/30">
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold">Modelo Industrial CIP</span> — João José Head de Freitas
        </p>
        <p className="text-[10px] text-muted-foreground mt-1">
          40 anos de chão de fábrica • Gargalo por saldo calculado, <span className="text-warning">nunca estimado</span>
        </p>
      </div>
    </div>
  );
}
