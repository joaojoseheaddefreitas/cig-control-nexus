import { cn } from '@/lib/utils';
import { Search, Filter, Plus, Edit, Trash2, Eye } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

interface Pedido {
  id: string;
  codigo: string;
  cliente: string;
  produto: string;
  quantidade: number;
  dataEntrada: string;
  prazoEntrega: string;
  status: 'pendente' | 'producao' | 'concluido' | 'atrasado';
  valorTotal: number;
}

const pedidosMock: Pedido[] = [
  { id: '1', codigo: 'PED-1847', cliente: 'Móveis Silva', produto: 'Sofá 3 Lugares Retrátil', quantidade: 5, dataEntrada: '2025-01-20', prazoEntrega: '2025-02-10', status: 'producao', valorTotal: 12500 },
  { id: '2', codigo: 'PED-1846', cliente: 'Loja do Conforto', produto: 'Sofá Canto 5 Lugares', quantidade: 2, dataEntrada: '2025-01-18', prazoEntrega: '2025-02-05', status: 'atrasado', valorTotal: 8900 },
  { id: '3', codigo: 'PED-1845', cliente: 'Decor House', produto: 'Poltrona Decorativa', quantidade: 10, dataEntrada: '2025-01-22', prazoEntrega: '2025-02-15', status: 'producao', valorTotal: 15000 },
  { id: '4', codigo: 'PED-1844', cliente: 'Casa & Estilo', produto: 'Sofá 2 Lugares Fixo', quantidade: 8, dataEntrada: '2025-01-15', prazoEntrega: '2025-01-30', status: 'concluido', valorTotal: 11200 },
  { id: '5', codigo: 'PED-1843', cliente: 'Móveis Paraná', produto: 'Cadeira Bergamo', quantidade: 50, dataEntrada: '2025-01-25', prazoEntrega: '2025-02-20', status: 'pendente', valorTotal: 25000 },
];

const statusConfig = {
  pendente: { label: 'Pendente', color: 'bg-warning/20 text-warning border-warning/30' },
  producao: { label: 'Em Produção', color: 'bg-primary/20 text-primary border-primary/30' },
  concluido: { label: 'Concluído', color: 'bg-success/20 text-success border-success/30' },
  atrasado: { label: 'Atrasado', color: 'bg-destructive/20 text-destructive border-destructive/30' },
};

export function CIPCadastroPedidos() {
  const [search, setSearch] = useState('');
  const [pedidos] = useState<Pedido[]>(pedidosMock);

  const filteredPedidos = pedidos.filter(p => 
    p.codigo.toLowerCase().includes(search.toLowerCase()) ||
    p.cliente.toLowerCase().includes(search.toLowerCase()) ||
    p.produto.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código, cliente ou produto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          <Button size="sm" className="bg-cip hover:bg-cip/90">
            <Plus className="h-4 w-4 mr-2" />
            Novo Pedido
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/30 bg-card/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-secondary/30">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Código</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Cliente</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium hidden sm:table-cell">Produto</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium hidden md:table-cell">Qtd</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium hidden lg:table-cell">Prazo</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">Status</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium hidden md:table-cell">Valor</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredPedidos.map((pedido) => (
                <tr key={pedido.id} className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                  <td className="py-3 px-4 font-medium text-foreground">{pedido.codigo}</td>
                  <td className="py-3 px-4 text-foreground">{pedido.cliente}</td>
                  <td className="py-3 px-4 text-muted-foreground hidden sm:table-cell">{pedido.produto}</td>
                  <td className="py-3 px-4 text-center text-foreground hidden md:table-cell">{pedido.quantidade}</td>
                  <td className="py-3 px-4 text-center text-muted-foreground hidden lg:table-cell">
                    {new Date(pedido.prazoEntrega).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Badge className={cn('text-xs', statusConfig[pedido.status].color)}>
                      {statusConfig[pedido.status].label}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right text-foreground hidden md:table-cell">
                    R$ {pedido.valorTotal.toLocaleString('pt-BR')}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border/30 bg-card/80 p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{pedidos.length}</p>
          <p className="text-xs text-muted-foreground">Total Pedidos</p>
        </div>
        <div className="rounded-xl border border-success/30 bg-success/10 p-4 text-center">
          <p className="text-2xl font-bold text-success">{pedidos.filter(p => p.status === 'concluido').length}</p>
          <p className="text-xs text-muted-foreground">Concluídos</p>
        </div>
        <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 text-center">
          <p className="text-2xl font-bold text-primary">{pedidos.filter(p => p.status === 'producao').length}</p>
          <p className="text-xs text-muted-foreground">Em Produção</p>
        </div>
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-center">
          <p className="text-2xl font-bold text-destructive">{pedidos.filter(p => p.status === 'atrasado').length}</p>
          <p className="text-xs text-muted-foreground">Atrasados</p>
        </div>
      </div>
    </div>
  );
}
