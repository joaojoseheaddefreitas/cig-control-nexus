import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ConsumoModalProps {
  produtoId: string;
  produtoNome: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getEstoqueStatus(atual: number, minimo: number, maximo: number) {
  if (atual === 0) return { label: 'Falta', color: 'bg-red-600 text-white' };
  if (atual <= minimo) return { label: 'Pouco', color: 'bg-orange-500 text-white' };
  if (atual > maximo && maximo > 0) return { label: 'Elevado', color: 'bg-blue-500 text-white' };
  return { label: 'Normal', color: 'bg-green-600 text-white' };
}

export function ConsumoModal({ produtoId, produtoNome, open, onOpenChange }: ConsumoModalProps) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    const load = async () => {
      setLoading(true);
      const [bomRes, matRes] = await Promise.all([
        supabase.from('bom_produto').select('*').eq('produto_id', produtoId),
        supabase.from('materiais').select('*'),
      ]);
      const mats = matRes.data || [];
      setItems((bomRes.data || []).map((b: any) => ({
        ...b,
        material: mats.find(m => m.id === b.material_id),
      })));
      setLoading(false);
    };
    load();
  }, [open, produtoId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-cip" />
            Consumo — {produtoNome}
          </DialogTitle>
          <DialogDescription>Lista de materiais e situação do estoque</DialogDescription>
        </DialogHeader>

        {loading ? (
          <p className="text-center text-muted-foreground py-6">Carregando...</p>
        ) : items.length === 0 ? (
          <p className="text-center text-muted-foreground py-6">Nenhum material na BOM deste produto.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-secondary/30">
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Material</th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Código</th>
                  <th className="text-center py-2 px-3 text-muted-foreground font-medium">Qtd/un</th>
                  <th className="text-center py-2 px-3 text-muted-foreground font-medium">Unidade</th>
                  <th className="text-center py-2 px-3 text-muted-foreground font-medium">Lead Time</th>
                  <th className="text-center py-2 px-3 text-muted-foreground font-medium">Estoque Atual</th>
                  <th className="text-center py-2 px-3 text-muted-foreground font-medium">Est. Mín</th>
                  <th className="text-center py-2 px-3 text-muted-foreground font-medium">Est. Máx</th>
                  <th className="text-center py-2 px-3 text-muted-foreground font-medium">Situação</th>
                </tr>
              </thead>
              <tbody>
                {items.map(b => {
                  const mat = b.material;
                  const atual = Number(mat?.estoque_atual || 0);
                  const minimo = Number(mat?.estoque_minimo || 0);
                  const maximo = Number(mat?.estoque_maximo || 0);
                  const status = getEstoqueStatus(atual, minimo, maximo);

                  return (
                    <tr key={b.id} className="border-b border-border/30 hover:bg-secondary/20">
                      <td className="py-2 px-3 font-medium">{mat?.nome || 'N/A'}</td>
                      <td className="py-2 px-3 text-muted-foreground">{mat?.codigo || '-'}</td>
                      <td className="py-2 px-3 text-center">{Number(b.quantidade_por_unidade).toFixed(3)}</td>
                      <td className="py-2 px-3 text-center">{b.unidade}</td>
                      <td className="py-2 px-3 text-center">{b.lead_time_dias}d</td>
                      <td className="py-2 px-3 text-center">{atual.toFixed(1)}</td>
                      <td className="py-2 px-3 text-center">{minimo.toFixed(1)}</td>
                      <td className="py-2 px-3 text-center">{maximo.toFixed(1)}</td>
                      <td className="py-2 px-3 text-center">
                        <Badge className={`text-[10px] ${status.color}`}>{status.label}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
