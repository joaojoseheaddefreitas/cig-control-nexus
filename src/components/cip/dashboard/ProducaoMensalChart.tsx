import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, Line, ComposedChart,
} from 'recharts';

interface ProducaoMensalData {
  mes: string;
  realizado: number;
  meta: number;
}

interface ProducaoMensalChartProps {
  data: ProducaoMensalData[];
}

export function ProducaoMensalChart({ data }: ProducaoMensalChartProps) {
  return (
    <div className="rounded-xl border border-border/30 bg-card/80 p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display font-bold text-foreground">Produção Mensal</h3>
          <p className="text-xs text-muted-foreground">Faturamento realizado vs meta</p>
        </div>
        
        {/* Legend */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-success" />
            <span className="text-xs text-muted-foreground">Realizado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full border-2 border-muted-foreground bg-transparent" />
            <span className="text-xs text-muted-foreground">Meta</span>
          </div>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
            <XAxis 
              dataKey="mes" 
              tick={{ fill: '#9ca3af', fontSize: 10 }} 
              axisLine={{ stroke: '#333' }}
            />
            <YAxis 
              tick={{ fill: '#9ca3af', fontSize: 10 }} 
              axisLine={{ stroke: '#333' }}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1a1a2e', 
                border: '1px solid #333', 
                borderRadius: '8px' 
              }}
              formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, '']}
            />
            <Bar 
              dataKey="realizado" 
              fill="#22c55e" 
              radius={[4, 4, 0, 0]}
              name="Realizado"
            />
            <Line 
              type="monotone" 
              dataKey="meta" 
              stroke="#9ca3af" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: '#9ca3af', strokeWidth: 2 }}
              name="Meta"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
