import { alertasIA, civKPIs } from '@/data/civData';
import { KPICard } from '@/components/ui/KPICard';
import { ModuleCard } from '@/components/ui/ModuleCard';
import { Badge } from '@/components/ui/badge';
import { Brain, AlertTriangle, TrendingUp, Lightbulb, Zap } from 'lucide-react';

const tipoIcons: Record<string, React.ReactNode> = {
  risco: <AlertTriangle className="h-5 w-5 text-red-400" />,
  oportunidade: <TrendingUp className="h-5 w-5 text-green-400" />,
  tendencia: <Zap className="h-5 w-5 text-blue-400" />,
  alerta: <AlertTriangle className="h-5 w-5 text-amber-400" />,
  sugestao: <Lightbulb className="h-5 w-5 text-purple-400" />,
};

const tipoColors: Record<string, string> = {
  risco: 'border-red-500 bg-red-500/10',
  oportunidade: 'border-green-500 bg-green-500/10',
  tendencia: 'border-blue-500 bg-blue-500/10',
  alerta: 'border-amber-500 bg-amber-500/10',
  sugestao: 'border-purple-500 bg-purple-500/10',
};

const prioridadeBadge: Record<string, { bg: string; text: string }> = {
  alta: { bg: '#ef4444', text: '#fff' },
  media: { bg: '#f59e0b', text: '#fff' },
  baixa: { bg: '#6b7280', text: '#fff' },
};

export function CIVIA() {
  const alertasAlta = alertasIA.filter(a => a.prioridade === 'alta').length;
  const oportunidades = alertasIA.filter(a => a.tipo === 'oportunidade').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-civ/20 to-transparent border border-civ/30 rounded-lg p-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-civ/20 flex items-center justify-center">
            <Brain className="h-8 w-8 text-civ" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Inteligência Artificial CIV</h2>
            <p className="text-muted-foreground">Análise automática de dados comerciais, alertas e recomendações</p>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          title="Alertas Ativos"
          value={alertasIA.length}
          subtitle="Analisados"
          icon={<Brain className="h-5 w-5" />}
          variant="civ"
        />
        <KPICard
          title="Prioridade Alta"
          value={alertasAlta}
          subtitle="Requer ação"
          icon={<AlertTriangle className="h-5 w-5" />}
          trend="down"
          trendValue="-2"
          variant="civ"
        />
        <KPICard
          title="Oportunidades"
          value={oportunidades}
          subtitle="Identificadas"
          icon={<TrendingUp className="h-5 w-5" />}
          variant="civ"
        />
        <KPICard
          title="Precisão"
          value="94%"
          subtitle="Histórica"
          icon={<Zap className="h-5 w-5" />}
          variant="civ"
        />
      </div>

      {/* Alertas */}
      <ModuleCard title="Alertas e Recomendações" variant="civ">
        <div className="space-y-4 p-2">
          {alertasIA.map((alerta, index) => (
            <div 
              key={index}
              className={`flex items-start gap-4 p-4 rounded-lg border-l-4 ${tipoColors[alerta.tipo]}`}
            >
              <div className="mt-0.5">{tipoIcons[alerta.tipo]}</div>
              <div className="flex-1">
                <p className="text-foreground">{alerta.mensagem}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge 
                    style={{ 
                      backgroundColor: prioridadeBadge[alerta.prioridade].bg,
                      color: prioridadeBadge[alerta.prioridade].text
                    }}
                  >
                    {alerta.prioridade.toUpperCase()}
                  </Badge>
                  <span className="text-xs text-muted-foreground capitalize">{alerta.tipo}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ModuleCard>

      {/* Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ModuleCard title="Análise de Tendências" variant="civ">
          <div className="space-y-4 p-2">
            <div className="p-4 bg-secondary/30 rounded-lg">
              <h4 className="text-sm font-medium text-foreground mb-2">Padrão Identificado</h4>
              <p className="text-sm text-muted-foreground">
                Vendas de cadeiras seguem padrão sazonal com pico em outubro-dezembro. 
                Recomenda-se aumentar estoque a partir de setembro.
              </p>
            </div>
            <div className="p-4 bg-secondary/30 rounded-lg">
              <h4 className="text-sm font-medium text-foreground mb-2">Correlação Detectada</h4>
              <p className="text-sm text-muted-foreground">
                Clientes que compram Mesa Florença têm 68% de probabilidade de comprar 
                Cadeira Bergamo nos próximos 30 dias.
              </p>
            </div>
          </div>
        </ModuleCard>

        <ModuleCard title="Sugestões de Mix" variant="civ">
          <div className="space-y-4 p-2">
            <div className="flex items-center justify-between p-4 bg-green-500/10 rounded-lg">
              <div>
                <p className="text-sm font-medium text-foreground">Aumentar produção</p>
                <p className="text-xs text-muted-foreground">Sofá Flex - demanda 38% acima</p>
              </div>
              <span className="text-civ font-bold">+38%</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-amber-500/10 rounded-lg">
              <div>
                <p className="text-sm font-medium text-foreground">Atenção</p>
                <p className="text-xs text-muted-foreground">Cadeira Roma - estoque alto</p>
              </div>
              <span className="text-amber-500 font-bold">-15%</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-blue-500/10 rounded-lg">
              <div>
                <p className="text-sm font-medium text-foreground">Oportunidade</p>
                <p className="text-xs text-muted-foreground">Lançar linha premium</p>
              </div>
              <span className="text-blue-400 font-bold">NOVO</span>
            </div>
          </div>
        </ModuleCard>
      </div>

      {/* Disclaimer */}
      <div className="p-4 bg-secondary/30 border border-border/50 rounded-lg">
        <p className="text-sm text-muted-foreground text-center">
          ⚠️ A IA analisa, recomenda e alerta — mas <strong>NÃO executa ações automaticamente</strong>. 
          Todas as decisões devem ser validadas pela equipe comercial.
        </p>
      </div>
    </div>
  );
}
