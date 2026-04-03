import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { ModuleCard } from '@/components/ui/ModuleCard';
import { KPICard } from '@/components/ui/KPICard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowUp, ArrowDown, Package, RefreshCw, Warehouse, Clock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  fetchMateriais,
  fetchMovimentacoesMateriais,
  registrarEntradaMaterial,
  registrarConsumoMaterial,
  type Material,
  type MovimentacaoMaterial,
} from '@/services/materiaisService';

export function CICEstoqueMateriais() {
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tipoMov, setTipoMov] = useState<'entrada' | 'saida'>('entrada');
  const [materialId, setMaterialId] = useState('');
  const [quantidade, setQuantidade] = useState(1);
  const [valorUnit, setValorUnit] = useState(0);
  const [notaFiscal, setNotaFiscal] = useState('');
  const [motivo, setMotivo] = useState('');

  const loadData = async () => {
    setLoading(true);
    const [mats, movs] = await Promise.all([
      fetchMateriais(),
      fetchMovimentacoesMateriais(30),
    ]);
    setMateriais(mats);
    setMovimentacoes(movs);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleRegistrar = async () => {
    if (!materialId) { toast.error('Selecione um material'); return; }
    let result: { error: string | null };
    if (tipoMov === 'entrada') {
      result = await registrarEntradaMaterial(materialId, quantidade, valorUnit || 0, notaFiscal, motivo);
    } else {
      result = await registrarConsumoMaterial(materialId, quantidade, undefined, motivo);
    }
    if (result.error) {
      toast.error(`❌ Erro: ${result.error}`);
    } else {
      toast.success(`✅ ${tipoMov === 'entrada' ? 'Entrada' : 'Saída'} registrada`);
      setDialogOpen(false);
      setMaterialId('');
      setQuantidade(1);
      setValorUnit(0);
      setNotaFiscal('');
      setMotivo('');
      await loadData();
    }
  };

  const openDialog = (tipo: 'entrada' | 'saida') => {
    setTipoMov(tipo);
    setDialogOpen(true);
  };

  const criticos = materiais.filter(m => m.status === 'critico').length;
  const atencao = materiais.filter(m => m.status === 'atencao').length;
  const valorTotal = materiais.reduce((s, m) => s + (m.valor_estoque || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="Materiais Ativos" value={materiais.length} subtitle="Cadastrados" icon={<Package className="h-5 w-5" />} variant="cic" />
        <KPICard title="Valor Estoque" value={`R$ ${(valorTotal / 1000).toFixed(0)}k`} subtitle="Total valorizado" icon={<Warehouse className="h-5 w-5" />} variant="cic" />
        <KPICard title="Críticos" value={criticos} subtitle="Abaixo ponto pedido" icon={<AlertTriangle className="h-5 w-5" />} variant="cic" trend={criticos > 0 ? 'down' : 'up'} trendValue={criticos > 0 ? 'Atenção' : 'OK'} />
        <KPICard title="Movimentações" value={movimentacoes.length} subtitle="Últimas 30" icon={<Clock className="h-5 w-5" />} variant="cic" />
      </div>

      {/* Ações */}
      <div className="flex gap-3">
        <Button className="bg-success hover:bg-success/90" onClick={() => openDialog('entrada')}>
          <ArrowUp className="h-4 w-4 mr-2" /> Entrada via NF
        </Button>
        <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10" onClick={() => openDialog('saida')}>
          <ArrowDown className="h-4 w-4 mr-2" /> Saída / Requisição
        </Button>
        <Button variant="ghost" size="sm" onClick={loadData}>
          <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} /> Atualizar
        </Button>
      </div>

      {/* Tabela de Materiais */}
      <ModuleCard title="Estoque de Materiais — Saldo, Status e Alcance" variant="cic">
        {loading ? (
          <div className="py-8 text-center text-muted-foreground">Carregando...</div>
        ) : materiais.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">Nenhum material cadastrado.</div>
        ) : (
          <ScrollArea className="max-h-[500px]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-secondary/30 sticky top-0 z-10">
                  <th className="text-left py-3 px-3 text-muted-foreground font-medium text-xs">Código</th>
                  <th className="text-left py-3 px-3 text-muted-foreground font-medium text-xs">Material</th>
                  <th className="text-center py-3 px-2 text-muted-foreground font-medium text-xs">Estoque</th>
                  <th className="text-center py-3 px-2 text-muted-foreground font-medium text-xs">Alcance</th>
                  <th className="text-center py-3 px-2 text-muted-foreground font-medium text-xs">Lead Time</th>
                  <th className="text-right py-3 px-2 text-muted-foreground font-medium text-xs">Valor Unit</th>
                  <th className="text-right py-3 px-2 text-muted-foreground font-medium text-xs">Valor Total</th>
                  <th className="text-center py-3 px-2 text-muted-foreground font-medium text-xs">Status</th>
                </tr>
              </thead>
              <tbody>
                {materiais.map(m => (
                  <tr key={m.id} className={cn("border-b border-border/30 hover:bg-secondary/30", m.status === 'critico' && "bg-destructive/5")}>
                    <td className="py-2 px-3 font-mono text-xs">{m.codigo}</td>
                    <td className="py-2 px-3 font-medium text-xs">{m.nome}</td>
                    <td className="py-2 px-2 text-center font-semibold text-xs">{m.estoque_atual} {m.unidade}</td>
                    <td className="py-2 px-2 text-center text-xs">
                      <span className={cn("font-bold",
                        (m.alcance_estoque || 0) < 1 ? "text-destructive" :
                        (m.alcance_estoque || 0) < 3 ? "text-warning" : "text-success"
                      )}>
                        {(m.alcance_estoque || 0).toFixed(1)}d
                      </span>
                    </td>
                    <td className="py-2 px-2 text-center text-muted-foreground text-xs">{m.lead_time_dias}d</td>
                    <td className="py-2 px-2 text-right text-muted-foreground text-xs">R$ {m.valor_unitario.toFixed(2)}</td>
                    <td className="py-2 px-2 text-right font-semibold text-xs">R$ {((m.valor_estoque || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className="py-2 px-2 text-center">
                      <Badge className={cn("text-[10px]",
                        m.status === 'critico' ? 'bg-destructive/20 text-destructive' :
                        m.status === 'atencao' ? 'bg-warning/20 text-warning' :
                        'bg-success/20 text-success'
                      )}>
                        {m.status === 'critico' ? '🔴 Crítico' : m.status === 'atencao' ? '🟡 Atenção' : '🟢 Normal'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollArea>
        )}
      </ModuleCard>

      {/* Histórico */}
      <ModuleCard title="Últimas Movimentações" variant="cic">
        <ScrollArea className="max-h-[300px]">
          {movimentacoes.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">Nenhuma movimentação registrada.</div>
          ) : (
            <div className="space-y-2 p-2">
              {movimentacoes.map(m => (
                <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/20 border border-border/30">
                  <div className="flex items-center gap-3">
                    {m.tipo === 'entrada' ? <ArrowUp className="h-4 w-4 text-success" /> : <ArrowDown className="h-4 w-4 text-destructive" />}
                    <div>
                      <p className="text-sm font-medium">{m.tipo === 'entrada' ? 'Entrada' : 'Saída'} — {m.quantidade} un</p>
                      <p className="text-xs text-muted-foreground">
                        {m.motivo || 'Sem motivo'} • {m.usuario || 'Admin'} • {new Date(m.created_at).toLocaleString('pt-BR')}
                        {m.nota_fiscal ? ` • NF: ${m.nota_fiscal}` : ''}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    R$ {Number(m.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </ModuleCard>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {tipoMov === 'entrada' ? <ArrowUp className="h-5 w-5 text-success" /> : <ArrowDown className="h-5 w-5 text-destructive" />}
              {tipoMov === 'entrada' ? 'Entrada via Nota Fiscal' : 'Saída / Requisição'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Material *</Label>
              <Select value={materialId} onValueChange={setMaterialId}>
                <SelectTrigger><SelectValue placeholder="Selecione o material" /></SelectTrigger>
                <SelectContent>
                  {materiais.map(m => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.codigo} — {m.nome} (estoque: {m.estoque_atual} {m.unidade})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantidade *</Label>
                <Input type="number" min={1} value={quantidade} onChange={e => setQuantidade(Math.max(1, parseInt(e.target.value) || 1))} />
              </div>
              {tipoMov === 'entrada' && (
                <div className="space-y-2">
                  <Label>Valor Unitário (R$)</Label>
                  <Input type="number" step="0.01" min={0} value={valorUnit} onChange={e => setValorUnit(parseFloat(e.target.value) || 0)} />
                </div>
              )}
            </div>
            {tipoMov === 'entrada' && (
              <div className="space-y-2">
                <Label>Nota Fiscal</Label>
                <Input placeholder="Nº da NF" value={notaFiscal} onChange={e => setNotaFiscal(e.target.value)} />
              </div>
            )}
            <div className="space-y-2">
              <Label>Motivo</Label>
              <Input placeholder="Ex: Reposição, Ajuste, Requisição..." value={motivo} onChange={e => setMotivo(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleRegistrar} className={tipoMov === 'entrada' ? 'bg-success hover:bg-success/90' : 'bg-destructive hover:bg-destructive/90'}>
              Confirmar {tipoMov === 'entrada' ? 'Entrada' : 'Saída'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
