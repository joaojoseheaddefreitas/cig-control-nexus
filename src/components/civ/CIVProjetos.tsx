import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { projetosEspeciais } from '@/data/civData';
import { KPICard } from '@/components/ui/KPICard';
import { ModuleCard } from '@/components/ui/ModuleCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Briefcase, DollarSign, Clock, AlertTriangle, Send } from 'lucide-react';

const statusColors: Record<string, string> = {
  analise: '#3b82f6',
  aprovado: '#22c55e',
  em_producao: '#f59e0b',
  concluido: '#14b8a6',
  cancelado: '#ef4444',
};

const statusLabels: Record<string, string> = {
  analise: 'Em Análise',
  aprovado: 'Aprovado',
  em_producao: 'Em Produção',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
};

export function CIVProjetos() {
  const totalProjetos = projetosEspeciais.length;
  const valorTotal = projetosEspeciais.reduce((acc, p) => acc + p.valorEstimado, 0);
  const emAndamento = projetosEspeciais.filter(p => ['analise', 'aprovado', 'em_producao'].includes(p.status)).length;
  const impactoMedio = projetosEspeciais.reduce((acc, p) => acc + p.impactoCapacidade, 0) / projetosEspeciais.length;

  const impactoPorProjeto = projetosEspeciais.map(p => ({
    cliente: p.cliente.substring(0, 15),
    impacto: p.impactoCapacidade,
    valor: p.valorEstimado,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          title="Total Projetos"
          value={totalProjetos}
          subtitle="Especiais/Sob medida"
          icon={<Briefcase className="h-5 w-5" />}
          variant="civ"
        />
        <KPICard
          title="Valor Total"
          value={`R$ ${(valorTotal / 1000000).toFixed(1)}M`}
          subtitle="Em carteira"
          icon={<DollarSign className="h-5 w-5" />}
          trend="up"
          trendValue="+45%"
          variant="civ"
        />
        <KPICard
          title="Em Andamento"
          value={emAndamento}
          subtitle="Projetos ativos"
          icon={<Clock className="h-5 w-5" />}
          variant="civ"
        />
        <KPICard
          title="Impacto Médio"
          value={`${impactoMedio.toFixed(0)}%`}
          subtitle="Na capacidade"
          icon={<AlertTriangle className="h-5 w-5" />}
          variant="civ"
        />
      </div>

      {/* Chart */}
      <ModuleCard title="Impacto na Capacidade por Projeto" variant="civ">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={impactoPorProjeto} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={true} vertical={false} />
              <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="cliente" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} width={120} />
              <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }} formatter={(value: number) => [`${value}%`, 'Impacto']} />
              <Bar 
                dataKey="impacto" 
                radius={[0, 4, 4, 0]} 
                barSize={20}
                fill="#f59e0b"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ModuleCard>

      {/* Tabela de Projetos */}
      <ModuleCard title="Projetos Especiais & Sob Medida" variant="civ">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">ID</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Cliente</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Descrição</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">Valor Est.</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">Prazo Solic.</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">Prazo Viável</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">Impacto</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">Status</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">Ação</th>
              </tr>
            </thead>
            <tbody>
              {projetosEspeciais.map((projeto) => (
                <tr key={projeto.id} className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                  <td className="py-3 px-4 font-mono text-foreground">{projeto.id}</td>
                  <td className="py-3 px-4 text-foreground font-medium">{projeto.cliente}</td>
                  <td className="py-3 px-4 text-muted-foreground">{projeto.descricao}</td>
                  <td className="py-3 px-4 text-right text-foreground">R$ {projeto.valorEstimado.toLocaleString('pt-BR')}</td>
                  <td className="py-3 px-4 text-center text-muted-foreground">{new Date(projeto.prazoSolicitado).toLocaleDateString('pt-BR')}</td>
                  <td className="py-3 px-4 text-center text-foreground">{new Date(projeto.prazoViavel).toLocaleDateString('pt-BR')}</td>
                  <td className="py-3 px-4 text-right">
                    <span className={`font-semibold ${projeto.impactoCapacidade > 50 ? 'text-amber-500' : 'text-civ'}`}>
                      {projeto.impactoCapacidade}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Badge style={{ backgroundColor: statusColors[projeto.status], color: '#fff' }}>
                      {statusLabels[projeto.status]}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {projeto.status === 'aprovado' && (
                      <Button size="sm" variant="outline" className="text-xs">
                        <Send className="h-3 w-3 mr-1" />
                        Enviar CIP
                      </Button>
                    )}
                    {projeto.status === 'analise' && (
                      <Button size="sm" variant="outline" className="text-xs">
                        Simular
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ModuleCard>

      {/* Info */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <p className="text-blue-400 text-sm">
          💡 Projetos especiais impactam diretamente a capacidade da fábrica. Use a simulação antes de aprovar e envie ao CIP apenas quando comercialmente aprovado.
        </p>
      </div>
    </div>
  );
}
