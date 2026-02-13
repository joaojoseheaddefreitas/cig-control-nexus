import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ModuleCard } from '@/components/ui/ModuleCard';
import { KPICard } from '@/components/ui/KPICard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowUp, ArrowDown, Package, RefreshCw, Warehouse, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  fetchProdutosComSaldo,
  registrarMovimentacao,
  fetchMovimentacoes,
  type ProdutoComSaldo,
  type Movimentacao,
} from '@/services/estoqueService';

export function CICEstoqueOperacional() {
  const [produtos, setProdutos] = useState<ProdutoComSaldo[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tipoMov, setTipoMov] = useState<'entrada' | 'baixa'>('entrada');
  const [produtoId, setProdutoId] = useState('');
  const [quantidade, setQuantidade] = useState(1);
  const [motivo, setMotivo] = useState('');

  const loadData = async () => {
    setLoading(true);
    const [prods, movs] = await Promise.all([
      fetchProdutosComSaldo(),
      fetchMovimentacoes(),
    ]);
    setProdutos(prods);
    setMovimentacoes(movs);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRegistrar = async () => {
    if (!produtoId) {
      toast.error('Selecione um produto');
      return;
    }
    const result = await registrarMovimentacao(produtoId, tipoMov, quantidade, motivo);
    if (result.error) {
      toast.error(`❌ Erro: ${result.error}`);
    } else {
      toast.success(`✅ ${tipoMov === 'entrada' ? 'Entrada' : 'Baixa'} registrada com sucesso`);
      setDialogOpen(false);
      setProdutoId('');
      setQuantidade(1);
      setMotivo('');
      await loadData();
    }
  };

  const openDialog = (tipo: 'entrada' | 'baixa') => {
    setTipoMov(tipo);
    setDialogOpen(true);
  };

  const totalProdutos = produtos.length;
  const produtosCriticos = produtos.filter((p) => p.saldo <= 0).length;
  const totalSaldo = produtos.reduce((s, p) => s + p.saldo, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          title="Produtos Ativos"
          value={totalProdutos}
          subtitle="Cadastrados"
          icon={<Package className="h-5 w-5" />}
          variant="cic"
        />
        <KPICard
          title="Saldo Total"
          value={totalSaldo}
          subtitle="Todas unidades"
          icon={<Warehouse className="h-5 w-5" />}
          variant="cic"
        />
        <KPICard
          title="Sem Estoque"
          value={produtosCriticos}
          subtitle="Saldo ≤ 0"
          icon={<Package className="h-5 w-5" />}
          trend={produtosCriticos > 0 ? 'down' : 'up'}
          trendValue={produtosCriticos > 0 ? 'Atenção' : 'OK'}
          variant="cic"
        />
        <KPICard
          title="Movimentações"
          value={movimentacoes.length}
          subtitle="Últimas 20"
          icon={<Clock className="h-5 w-5" />}
          variant="cic"
        />
      </div>

      {/* Ações */}
      <div className="flex gap-3">
        <Button className="bg-success hover:bg-success/90" onClick={() => openDialog('entrada')}>
          <ArrowUp className="h-4 w-4 mr-2" />
          Entrada Manual
        </Button>
        <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10" onClick={() => openDialog('baixa')}>
          <ArrowDown className="h-4 w-4 mr-2" />
          Baixa Manual
        </Button>
        <Button variant="ghost" size="sm" onClick={loadData}>
          <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
          Atualizar
        </Button>
      </div>

      {/* Saldos por Produto */}
      <ModuleCard title="Saldo por Produto (Entradas - Baixas)" variant="cic">
        {loading ? (
          <div className="py-8 text-center text-muted-foreground">Carregando...</div>
        ) : produtos.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            Nenhum produto cadastrado. Cadastre produtos no CIP primeiro.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-secondary/30">
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Produto</th>
                  <th className="text-center py-3 px-4 text-muted-foreground font-medium">Unidade</th>
                  <th className="text-center py-3 px-4 text-muted-foreground font-medium">Saldo</th>
                  <th className="text-center py-3 px-4 text-muted-foreground font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {produtos.map((p) => (
                  <tr key={p.id} className="border-b border-border/30 hover:bg-secondary/20">
                    <td className="py-3 px-4 font-medium text-foreground">{p.nome}</td>
                    <td className="py-3 px-4 text-center text-muted-foreground">{p.unidade}</td>
                    <td className="py-3 px-4 text-center font-bold text-foreground">{p.saldo}</td>
                    <td className="py-3 px-4 text-center">
                      <Badge className={cn(
                        'text-xs',
                        p.saldo > 0 ? 'bg-success/20 text-success' :
                        p.saldo === 0 ? 'bg-warning/20 text-warning' :
                        'bg-destructive/20 text-destructive'
                      )}>
                        {p.saldo > 0 ? 'OK' : p.saldo === 0 ? 'Zerado' : 'Negativo'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ModuleCard>

      {/* Histórico de Movimentações */}
      <ModuleCard title="Últimas Movimentações" variant="cic">
        <ScrollArea className="max-h-[300px]">
          {movimentacoes.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">Nenhuma movimentação registrada.</div>
          ) : (
            <div className="space-y-2 p-2">
              {movimentacoes.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/20 border border-border/30">
                  <div className="flex items-center gap-3">
                    {m.tipo === 'entrada' ? (
                      <ArrowUp className="h-4 w-4 text-success" />
                    ) : (
                      <ArrowDown className="h-4 w-4 text-destructive" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {m.tipo === 'entrada' ? 'Entrada' : 'Baixa'} — {m.quantidade} un
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {m.motivo || 'Sem motivo'} • {m.usuario || 'Admin'} • {new Date(m.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px]">{m.origem}</Badge>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </ModuleCard>

      {/* Dialog de Movimentação */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {tipoMov === 'entrada' ? (
                <ArrowUp className="h-5 w-5 text-success" />
              ) : (
                <ArrowDown className="h-5 w-5 text-destructive" />
              )}
              {tipoMov === 'entrada' ? 'Entrada Manual de Estoque' : 'Baixa Manual de Estoque'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Produto *</Label>
              <Select value={produtoId} onValueChange={setProdutoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o produto" />
                </SelectTrigger>
                <SelectContent>
                  {produtos.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nome} (saldo: {p.saldo} {p.unidade})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Quantidade *</Label>
              <Input
                type="number"
                min={1}
                value={quantidade}
                onChange={(e) => setQuantidade(Math.max(1, parseInt(e.target.value) || 1))}
              />
            </div>

            <div className="space-y-2">
              <Label>Motivo</Label>
              <Input
                placeholder="Ex: Ajuste de inventário"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleRegistrar}
              className={tipoMov === 'entrada' ? 'bg-success hover:bg-success/90' : 'bg-destructive hover:bg-destructive/90'}
            >
              Confirmar {tipoMov === 'entrada' ? 'Entrada' : 'Baixa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
