import { cn } from '@/lib/utils';
import { Search, Filter, Plus, Edit, Trash2, Eye, Package } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

interface Produto {
  id: string;
  codigo: string;
  descricao: string;
  categoria: string;
  unidade: string;
  tempoProducao: number;
  estoqueAtual: number;
  estoqueMinimo: number;
  status: 'ativo' | 'inativo' | 'descontinuado';
  custoUnitario: number;
}

const produtosMock: Produto[] = [
  { id: '1', codigo: '112401', descricao: 'SOFÁ FLEX 02 LUGARES', categoria: 'Sofás', unidade: 'UN', tempoProducao: 8, estoqueAtual: 5, estoqueMinimo: 3, status: 'ativo', custoUnitario: 1250 },
  { id: '2', codigo: '111482', descricao: 'SOFÁ ANCORA 02 LUGARES', categoria: 'Sofás', unidade: 'UN', tempoProducao: 6, estoqueAtual: 2, estoqueMinimo: 2, status: 'ativo', custoUnitario: 980 },
  { id: '3', codigo: '6002', descricao: 'CADEIRA BERGAMO MADEIRA', categoria: 'Cadeiras', unidade: 'UN', tempoProducao: 2, estoqueAtual: 45, estoqueMinimo: 20, status: 'ativo', custoUnitario: 320 },
  { id: '4', codigo: '4000', descricao: 'MESA FLORENÇA', categoria: 'Mesas', unidade: 'UN', tempoProducao: 4, estoqueAtual: 8, estoqueMinimo: 5, status: 'ativo', custoUnitario: 650 },
  { id: '5', codigo: '111011', descricao: 'SOFÁ ASTOR 03 LUGARES', categoria: 'Sofás', unidade: 'UN', tempoProducao: 10, estoqueAtual: 0, estoqueMinimo: 2, status: 'ativo', custoUnitario: 1580 },
  { id: '6', codigo: '6003', descricao: 'CADEIRA BERGAMO ESTOFADO', categoria: 'Cadeiras', unidade: 'UN', tempoProducao: 3, estoqueAtual: 18, estoqueMinimo: 10, status: 'ativo', custoUnitario: 450 },
];

const statusConfig = {
  ativo: { label: 'Ativo', color: 'bg-success/20 text-success border-success/30' },
  inativo: { label: 'Inativo', color: 'bg-warning/20 text-warning border-warning/30' },
  descontinuado: { label: 'Descontinuado', color: 'bg-destructive/20 text-destructive border-destructive/30' },
};

export function CIPCadastroProdutos() {
  const [search, setSearch] = useState('');
  const [produtos] = useState<Produto[]>(produtosMock);

  const filteredProdutos = produtos.filter(p => 
    p.codigo.toLowerCase().includes(search.toLowerCase()) ||
    p.descricao.toLowerCase().includes(search.toLowerCase()) ||
    p.categoria.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código, descrição ou categoria..."
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
            Novo Produto
          </Button>
        </div>
      </div>

      {/* Cards Grid for Mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-4">
        {filteredProdutos.map((produto) => (
          <div key={produto.id} className="rounded-xl border border-border/30 bg-card/80 p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-cip" />
                <span className="text-xs text-muted-foreground">{produto.codigo}</span>
              </div>
              <Badge className={cn('text-xs', statusConfig[produto.status].color)}>
                {statusConfig[produto.status].label}
              </Badge>
            </div>
            <h3 className="font-medium text-foreground text-sm mb-2">{produto.descricao}</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Categoria:</span>
                <span className="ml-1 text-foreground">{produto.categoria}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Tempo:</span>
                <span className="ml-1 text-foreground">{produto.tempoProducao}h</span>
              </div>
              <div>
                <span className="text-muted-foreground">Estoque:</span>
                <span className={cn('ml-1', produto.estoqueAtual <= produto.estoqueMinimo ? 'text-destructive' : 'text-foreground')}>
                  {produto.estoqueAtual}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Custo:</span>
                <span className="ml-1 text-foreground">R$ {produto.custoUnitario}</span>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <Button variant="outline" size="sm" className="flex-1">
                <Eye className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Table for Desktop */}
      <div className="hidden lg:block rounded-xl border border-border/30 bg-card/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-secondary/30">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Código</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Descrição</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Categoria</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">Tempo</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">Estoque</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">Status</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">Custo Unit.</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredProdutos.map((produto) => (
                <tr key={produto.id} className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                  <td className="py-3 px-4 font-medium text-foreground">{produto.codigo}</td>
                  <td className="py-3 px-4 text-foreground">{produto.descricao}</td>
                  <td className="py-3 px-4 text-muted-foreground">{produto.categoria}</td>
                  <td className="py-3 px-4 text-center text-foreground">{produto.tempoProducao}h</td>
                  <td className="py-3 px-4 text-center">
                    <span className={cn(
                      'font-medium',
                      produto.estoqueAtual <= produto.estoqueMinimo ? 'text-destructive' : 'text-foreground'
                    )}>
                      {produto.estoqueAtual}
                    </span>
                    <span className="text-muted-foreground"> / {produto.estoqueMinimo}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Badge className={cn('text-xs', statusConfig[produto.status].color)}>
                      {statusConfig[produto.status].label}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right text-foreground">
                    R$ {produto.custoUnitario.toLocaleString('pt-BR')}
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
          <p className="text-2xl font-bold text-foreground">{produtos.length}</p>
          <p className="text-xs text-muted-foreground">Total Produtos</p>
        </div>
        <div className="rounded-xl border border-success/30 bg-success/10 p-4 text-center">
          <p className="text-2xl font-bold text-success">{produtos.filter(p => p.status === 'ativo').length}</p>
          <p className="text-xs text-muted-foreground">Ativos</p>
        </div>
        <div className="rounded-xl border border-warning/30 bg-warning/10 p-4 text-center">
          <p className="text-2xl font-bold text-warning">{produtos.filter(p => p.estoqueAtual <= p.estoqueMinimo).length}</p>
          <p className="text-xs text-muted-foreground">Estoque Baixo</p>
        </div>
        <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 text-center">
          <p className="text-2xl font-bold text-primary">{produtos.reduce((acc, p) => acc + p.estoqueAtual, 0)}</p>
          <p className="text-xs text-muted-foreground">Estoque Total</p>
        </div>
      </div>
    </div>
  );
}
