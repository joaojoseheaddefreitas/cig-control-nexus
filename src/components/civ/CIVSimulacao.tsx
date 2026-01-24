import { useState } from 'react';
import { KPICard } from '@/components/ui/KPICard';
import { ModuleCard } from '@/components/ui/ModuleCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { produtosVenda } from '@/data/civData';
import { executiveKPIs } from '@/data/cigData';
import { Calculator, Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface SimulacaoResult {
  prazoReal: number;
  riscoAtraso: 'baixo' | 'medio' | 'alto';
  impactoCapacidade: number;
  semaforo: 'verde' | 'amarelo' | 'vermelho';
  gargalos: string[];
  viavel: boolean;
}

export function CIVSimulacao() {
  const [produto, setProduto] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [prazoDesejado, setPrazoDesejado] = useState('');
  const [resultado, setResultado] = useState<SimulacaoResult | null>(null);

  const simular = () => {
    const qtd = parseInt(quantidade) || 0;
    const prazo = parseInt(prazoDesejado) || 0;
    
    // Simulação baseada na capacidade do CIP
    const capacidadeDisponivel = executiveKPIs.cip.disponibilidade;
    const tempoEstimado = Math.ceil(qtd * 0.5); // dias
    const impacto = Math.min(100, (qtd / 50) * capacidadeDisponivel);
    
    const prazoReal = Math.max(tempoEstimado, prazo);
    const riscoAtraso = prazoReal > prazo * 1.5 ? 'alto' : prazoReal > prazo ? 'medio' : 'baixo';
    
    let semaforo: 'verde' | 'amarelo' | 'vermelho' = 'verde';
    if (impacto > 80 || riscoAtraso === 'alto') semaforo = 'vermelho';
    else if (impacto > 50 || riscoAtraso === 'medio') semaforo = 'amarelo';

    const gargalos = [];
    if (impacto > 60) gargalos.push('Revestimento');
    if (impacto > 40) gargalos.push('Montagem');
    if (qtd > 100) gargalos.push('Costura');

    setResultado({
      prazoReal,
      riscoAtraso,
      impactoCapacidade: Math.round(impacto),
      semaforo,
      gargalos,
      viavel: semaforo !== 'vermelho',
    });
  };

  const semaforoColors = {
    verde: '#22c55e',
    amarelo: '#f59e0b',
    vermelho: '#ef4444',
  };

  const riscoLabels = {
    baixo: 'Baixo',
    medio: 'Médio',
    alto: 'Alto',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-card/50 border border-border/50 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <Calculator className="h-6 w-6 text-civ" />
          <div>
            <h3 className="text-lg font-semibold text-foreground">Simulação de Prazo e Viabilidade</h3>
            <p className="text-sm text-muted-foreground">Consulta a capacidade do CIP antes de confirmar a venda</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="produto">Produto</Label>
            <Select value={produto} onValueChange={setProduto}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o produto" />
              </SelectTrigger>
              <SelectContent>
                {produtosVenda.map((p) => (
                  <SelectItem key={p.codigo} value={p.codigo}>
                    {p.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="quantidade">Quantidade</Label>
            <Input
              id="quantidade"
              type="number"
              placeholder="Ex: 50"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="prazo">Prazo Desejado (dias)</Label>
            <Input
              id="prazo"
              type="number"
              placeholder="Ex: 15"
              value={prazoDesejado}
              onChange={(e) => setPrazoDesejado(e.target.value)}
            />
          </div>
          
          <div className="flex items-end">
            <Button onClick={simular} className="w-full bg-civ hover:bg-civ/90">
              Simular Prazo
            </Button>
          </div>
        </div>
      </div>

      {/* Resultado */}
      {resultado && (
        <>
          {/* KPIs do Resultado */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <KPICard
              title="Prazo Real"
              value={`${resultado.prazoReal} dias`}
              subtitle="Estimado"
              icon={<Clock className="h-5 w-5" />}
              variant="civ"
            />
            <KPICard
              title="Risco Atraso"
              value={riscoLabels[resultado.riscoAtraso]}
              subtitle="Avaliação"
              icon={<AlertTriangle className="h-5 w-5" />}
              variant="civ"
            />
            <KPICard
              title="Impacto Capacidade"
              value={`${resultado.impactoCapacidade}%`}
              subtitle="Na produção"
              icon={<Calculator className="h-5 w-5" />}
              variant="civ"
            />
            <div className="bg-card border border-border/50 rounded-lg p-4 flex flex-col items-center justify-center">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center mb-2"
                style={{ backgroundColor: `${semaforoColors[resultado.semaforo]}20` }}
              >
                <div 
                  className="w-10 h-10 rounded-full animate-pulse"
                  style={{ backgroundColor: semaforoColors[resultado.semaforo] }}
                />
              </div>
              <span className="text-sm font-semibold uppercase" style={{ color: semaforoColors[resultado.semaforo] }}>
                {resultado.semaforo}
              </span>
            </div>
          </div>

          {/* Detalhes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ModuleCard title="Análise de Viabilidade" variant="civ">
              <div className="space-y-4 p-2">
                <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                  <span className="text-foreground font-medium">Status da Venda</span>
                  {resultado.viavel ? (
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      LIBERADA
                    </Badge>
                  ) : (
                    <Badge className="bg-red-500/20 text-red-400 border-red-500/50">
                      <XCircle className="h-4 w-4 mr-1" />
                      BLOQUEADA
                    </Badge>
                  )}
                </div>
                
                <div className="p-4 bg-secondary/30 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Prazo Prometido vs Real</p>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all"
                          style={{ 
                            width: `${Math.min(100, (parseInt(prazoDesejado) / resultado.prazoReal) * 100)}%`,
                            backgroundColor: semaforoColors[resultado.semaforo]
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-sm text-foreground font-mono">
                      {prazoDesejado}d / {resultado.prazoReal}d
                    </span>
                  </div>
                </div>

                {!resultado.viavel && (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-red-400 text-sm">
                      ⚠️ Venda bloqueada: A capacidade da fábrica não suporta este pedido no prazo solicitado.
                    </p>
                  </div>
                )}
              </div>
            </ModuleCard>

            <ModuleCard title="Gargalos Identificados" variant="civ">
              <div className="space-y-3 p-2">
                {resultado.gargalos.length > 0 ? (
                  resultado.gargalos.map((gargalo, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg border-l-4 border-amber-500"
                    >
                      <span className="text-foreground">{gargalo}</span>
                      <Badge variant="outline" className="border-amber-500 text-amber-500">
                        Atenção
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center p-8 text-muted-foreground">
                    <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                    Nenhum gargalo crítico identificado
                  </div>
                )}
                
                <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-blue-400 text-sm">
                    💡 Dados consultados do CIP em tempo real. Capacidade atual: {executiveKPIs.cip.disponibilidade}%
                  </p>
                </div>
              </div>
            </ModuleCard>
          </div>
        </>
      )}

      {/* Info inicial */}
      {!resultado && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Calculator className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Simule antes de vender</h3>
          <p className="text-muted-foreground max-w-md">
            Preencha os dados acima para verificar se a fábrica tem capacidade de atender o pedido no prazo desejado.
          </p>
        </div>
      )}
    </div>
  );
}
