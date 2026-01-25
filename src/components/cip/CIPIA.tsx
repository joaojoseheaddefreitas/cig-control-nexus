import { useState } from 'react';
import { ModuleCard } from '@/components/ui/ModuleCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Brain, AlertTriangle, TrendingUp, Clock, Lightbulb, 
  ChevronRight, CheckCircle, BarChart2, RefreshCw
} from 'lucide-react';

const insightsIA = [
  {
    tipo: 'alerta',
    titulo: 'Gargalo Crítico Detectado',
    descricao: 'O setor "Encapar Alm. Enc./Ass." está com déficit de 283h. Recomendação: adicionar turno extra ou redistribuir carga.',
    impacto: 'Alto',
    acao: 'Revisar capacidade',
    setor: 'Encapar Alm.',
  },
  {
    tipo: 'tendencia',
    titulo: 'Aumento de Demanda Previsto',
    descricao: 'Análise histórica indica aumento de 18% na demanda por sofás nas próximas 4 semanas. Prepare capacidade adicional.',
    impacto: 'Médio',
    acao: 'Planejar capacidade',
    setor: 'Geral',
  },
  {
    tipo: 'otimizacao',
    titulo: 'Oportunidade de Otimização',
    descricao: 'Setores Marcenaria-Corte e Marcenaria-Montagem estão com apenas 1-2% de utilização. Considere realocar recursos.',
    impacto: 'Baixo',
    acao: 'Realocar recursos',
    setor: 'Marcenaria',
  },
  {
    tipo: 'alerta',
    titulo: 'Risco de Atraso em OPs',
    descricao: '3 ordens de produção têm prazo inferior a 5 dias e dependem de setores com alta ocupação. Priorize estas OPs.',
    impacto: 'Alto',
    acao: 'Repriorizar',
    setor: 'Múltiplos',
  },
  {
    tipo: 'tendencia',
    titulo: 'Eficiência em Queda',
    descricao: 'A eficiência média caiu 3% nas últimas 2 semanas. Principais causas: falta de material e manutenção.',
    impacto: 'Médio',
    acao: 'Investigar causas',
    setor: 'Geral',
  },
];

const recomendacoes = [
  {
    titulo: 'Adicionar Turno no Setor Crítico',
    descricao: 'O setor de Encapar Almofadas precisa de capacidade adicional urgente.',
    economia: 'Evita atrasos de R$ 45.000',
    prioridade: 'Urgente',
  },
  {
    titulo: 'Redistribuir Operadores Ociosos',
    descricao: '4 operadores da Marcenaria podem ser realocados temporariamente.',
    economia: 'Aumenta capacidade em 15%',
    prioridade: 'Alta',
  },
  {
    titulo: 'Antecipar Compra de Espuma D28',
    descricao: 'Estoque crítico previsto em 3 dias. OP 2025-001250 está bloqueada.',
    economia: 'Evita parada de R$ 12.000',
    prioridade: 'Urgente',
  },
];

const tipoConfig = {
  alerta: { icon: AlertTriangle, color: '#ef4444', bg: 'bg-red-500/10' },
  tendencia: { icon: TrendingUp, color: '#3b82f6', bg: 'bg-blue-500/10' },
  otimizacao: { icon: Lightbulb, color: '#22c55e', bg: 'bg-green-500/10' },
};

export function CIPIA() {
  const [analisando, setAnalisando] = useState(false);

  const handleAnalisar = () => {
    setAnalisando(true);
    setTimeout(() => setAnalisando(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-cip/20 flex items-center justify-center">
            <Brain className="h-6 w-6 text-cip" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Inteligência Artificial - CIP</h3>
            <p className="text-sm text-muted-foreground">Análise automática de produção e capacidade</p>
          </div>
        </div>
        <Button 
          onClick={handleAnalisar} 
          disabled={analisando}
          className="bg-cip hover:bg-cip/90"
        >
          {analisando ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Analisando...
            </>
          ) : (
            <>
              <Brain className="h-4 w-4 mr-2" />
              Executar Análise
            </>
          )}
        </Button>
      </div>

      {/* Resumo IA */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <span className="text-sm text-muted-foreground">Alertas</span>
          </div>
          <p className="text-2xl font-bold text-red-500">2</p>
        </div>
        <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            <span className="text-sm text-muted-foreground">Tendências</span>
          </div>
          <p className="text-2xl font-bold text-blue-500">2</p>
        </div>
        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="h-5 w-5 text-green-500" />
            <span className="text-sm text-muted-foreground">Otimizações</span>
          </div>
          <p className="text-2xl font-bold text-green-500">1</p>
        </div>
        <div className="p-4 bg-cip/10 border border-cip/30 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <BarChart2 className="h-5 w-5 text-cip" />
            <span className="text-sm text-muted-foreground">Score Geral</span>
          </div>
          <p className="text-2xl font-bold text-cip">72%</p>
        </div>
      </div>

      {/* Insights */}
      <ModuleCard title="Insights da IA" variant="cip">
        <div className="space-y-4">
          {insightsIA.map((insight, index) => {
            const config = tipoConfig[insight.tipo as keyof typeof tipoConfig];
            const Icon = config.icon;
            
            return (
              <div key={index} className={`p-4 rounded-lg border ${config.bg} border-opacity-30`}>
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: config.color + '20' }}>
                    <Icon className="h-5 w-5" style={{ color: config.color }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-foreground">{insight.titulo}</h4>
                      <Badge variant={insight.impacto === 'Alto' ? 'destructive' : insight.impacto === 'Médio' ? 'default' : 'secondary'}>
                        Impacto {insight.impacto}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{insight.descricao}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Setor: {insight.setor}</span>
                      <Button size="sm" variant="outline" className="text-xs">
                        {insight.acao}
                        <ChevronRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ModuleCard>

      {/* Recomendações */}
      <ModuleCard title="Recomendações de Ação" variant="cip">
        <div className="space-y-3">
          {recomendacoes.map((rec, index) => (
            <div key={index} className="p-4 bg-secondary/30 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-cip/20 flex items-center justify-center text-cip font-bold">
                  {index + 1}
                </div>
                <div>
                  <h4 className="font-medium text-foreground">{rec.titulo}</h4>
                  <p className="text-sm text-muted-foreground">{rec.descricao}</p>
                  <p className="text-xs text-green-500 mt-1">{rec.economia}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={rec.prioridade === 'Urgente' ? 'destructive' : 'default'}>
                  {rec.prioridade}
                </Badge>
                <Button size="sm" variant="outline">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Aplicar
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ModuleCard>

      {/* Disclaimer */}
      <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
        <p className="text-sm text-amber-400">
          ⚠️ A IA analisa e recomenda, mas <strong>NÃO executa ações automaticamente</strong>. 
          Todas as decisões devem ser validadas e aplicadas manualmente pelo gestor.
        </p>
      </div>
    </div>
  );
}
