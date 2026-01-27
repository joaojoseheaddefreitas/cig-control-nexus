import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Cell,
} from 'recharts';

interface CargaSetorData {
  setor: string;
  carga: number;
  status: 'verde' | 'amarelo' | 'vermelho';
}

interface CargaSetorChartProps {
  data: CargaSetorData[];
}

const statusColors = {
  verde: '#3b82f6',
  amarelo: '#f59e0b',
  vermelho: '#ef4444',
};

export function CargaSetorChart({ data }: CargaSetorChartProps) {
  return (
    <div className="rounded-xl border border-border/30 bg-card/80 p-4">
      <div className="mb-4">
        <h3 className="font-display font-bold text-foreground">Carga por Setor</h3>
        <p className="text-xs text-muted-foreground">Percentual de ocupação (excl. Embalagem)</p>
        
        {/* Legend */}
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-[10px] text-muted-foreground">&lt;70%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-success" />
            <span className="text-[10px] text-muted-foreground">70-95%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-warning" />
            <span className="text-[10px] text-muted-foreground">95-100%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-destructive" />
            <span className="text-[10px] text-muted-foreground">&gt;100%</span>
          </div>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 80, right: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={true} vertical={false} />
            <XAxis 
              type="number" 
              tick={{ fill: '#9ca3af', fontSize: 10 }} 
              axisLine={{ stroke: '#333' }} 
              domain={[0, 130]}
              tickFormatter={(v) => `${v}%`}
            />
            <YAxis 
              type="category" 
              dataKey="setor" 
              tick={{ fill: '#9ca3af', fontSize: 10 }} 
              axisLine={{ stroke: '#333' }}
              width={75}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1a1a2e', 
                border: '1px solid #333', 
                borderRadius: '8px' 
              }}
              formatter={(value: number) => [`${value}%`, 'Carga']}
            />
            <ReferenceLine x={70} stroke="#3b82f6" strokeDasharray="3 3" />
            <ReferenceLine x={100} stroke="#ef4444" strokeDasharray="3 3" />
            <Bar dataKey="carga" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={statusColors[entry.status]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
