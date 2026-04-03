import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Database, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BomItem {
  id: string;
  produto_id: string;
  material_id: string;
  quantidade_por_unidade: number;
  unidade: string;
  lead_time_dias: number;
  created_at: string;
  updated_at: string;
  material?: {
    id: string;
    codigo: string;
    nome: string;
    categoria: string;
    unidade: string;
    estoque_atual: number;
    lead_time_dias: number;
    fornecedor_nome: string | null;
  };
}

interface BOMEditorProps {
  produtoId: string;
  produtoNome: string;
}

export function BOMEditor({ produtoId, produtoNome }: BOMEditorProps) {
  const [bomItems, setBomItems] = useState<BomItem[]>([]);
  const [materiais, setMateriais] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [unidade, setUnidade] = useState('un');
  const [leadTime, setLeadTime] = useState('7');

  const loadBom = async () => {
    setLoading(true);
    const [bomRes, matRes] = await Promise.all([
      supabase.from('bom_produto').select('*').eq('produto_id', produtoId),
      supabase.from('materiais').select('*').eq('ativo', true).order('nome'),
    ]);
    const mats = matRes.data || [];
    setMateriais(mats);
    setBomItems((bomRes.data || []).map((b: any) => ({
      ...b,
      material: mats.find(m => m.id === b.material_id),
    })));
    setLoading(false);
  };

  useEffect(() => { loadBom(); }, [produtoId]);

  // Auto-fill when material is selected
  const handleMaterialSelect = (materialId: string) => {
    setSelectedMaterial(materialId);
    const mat = materiais.find(m => m.id === materialId);
    if (mat) {
      setUnidade(mat.unidade || 'un');
      setLeadTime(String(mat.lead_time_dias || 7));
    }
  };

  const handleAdd = async () => {
    if (!selectedMaterial || !quantidade || Number(quantidade) <= 0) {
      toast.error('Selecione um material e informe a quantidade');
      return;
    }
    const exists = bomItems.find(b => b.material_id === selectedMaterial);
    if (exists) {
      toast.error('Material já está na BOM. Remova e adicione novamente.');
      return;
    }
    const { error } = await supabase.from('bom_produto').insert({
      produto_id: produtoId,
      material_id: selectedMaterial,
      quantidade_por_unidade: Number(quantidade),
      unidade,
      lead_time_dias: Number(leadTime) || 7,
    });
    if (error) {
      toast.error(`Erro: ${error.message}`);
    } else {
      toast.success('Material adicionado à BOM');
      setSelectedMaterial('');
      setQuantidade('');
      setLeadTime('7');
      await loadBom();
    }
  };

  const handleRemove = async (bomId: string) => {
    const { error } = await supabase.from('bom_produto').delete().eq('id', bomId);
    if (error) {
      toast.error(`Erro: ${error.message}`);
    } else {
      toast.success('Material removido da BOM');
      await loadBom();
    }
  };

  const handleUpdateQty = async (bomId: string, newQty: number) => {
    if (newQty <= 0) return;
    const { error } = await supabase.from('bom_produto').update({ quantidade_por_unidade: newQty }).eq('id', bomId);
    if (error) {
      toast.error(`Erro: ${error.message}`);
    } else {
      setBomItems(prev => prev.map(b => b.id === bomId ? { ...b, quantidade_por_unidade: newQty } : b));
    }
  };

  const handleUpdateLeadTime = async (bomId: string, newLt: number) => {
    if (newLt < 0) return;
    const { error } = await supabase.from('bom_produto').update({ lead_time_dias: newLt }).eq('id', bomId);
    if (error) {
      toast.error(`Erro: ${error.message}`);
    } else {
      setBomItems(prev => prev.map(b => b.id === bomId ? { ...b, lead_time_dias: newLt } : b));
    }
  };

  const availableMateriais = materiais.filter(m => !bomItems.find(b => b.material_id === m.id));

  if (loading) return <div className="py-4 text-center text-muted-foreground text-sm">Carregando BOM...</div>;

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg flex items-center gap-2">
        <Database className="h-5 w-5 text-cip" />
        Insumos / BOM — {produtoNome}
      </h3>

      {/* Add material */}
      <div className="flex flex-col sm:flex-row gap-2 p-3 rounded-lg border border-border/50 bg-secondary/20">
        <Select value={selectedMaterial} onValueChange={handleMaterialSelect}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Selecione o material..." />
          </SelectTrigger>
          <SelectContent>
            {availableMateriais.map(m => (
              <SelectItem key={m.id} value={m.id}>
                {m.codigo} — {m.nome} ({m.categoria})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="number"
          step="0.001"
          min="0"
          placeholder="Qtd/un"
          value={quantidade}
          onChange={e => setQuantidade(e.target.value)}
          className="w-28"
        />
        <Input
          placeholder="Unidade"
          value={unidade}
          onChange={e => setUnidade(e.target.value)}
          className="w-20"
        />
        <Input
          type="number"
          min="0"
          placeholder="Lead Time"
          value={leadTime}
          onChange={e => setLeadTime(e.target.value)}
          className="w-24"
          title="Lead time em dias"
        />
        <Button onClick={handleAdd} size="sm" className="bg-cip hover:bg-cip/90">
          <Plus className="h-4 w-4 mr-1" /> Adicionar
        </Button>
      </div>

      {/* BOM list */}
      {bomItems.length === 0 ? (
        <p className="text-muted-foreground text-sm py-4 text-center">Nenhum material cadastrado na BOM.</p>
      ) : (
        <div className="space-y-2">
          {bomItems.map(b => (
            <div key={b.id} className="flex items-center justify-between p-3 border rounded-lg bg-card/80">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">{b.material?.nome || 'N/A'}</span>
                  <Badge variant="outline" className="text-[10px]">{b.material?.codigo || '-'}</Badge>
                  <Badge variant="outline" className="text-[10px]">{b.material?.categoria || '-'}</Badge>
                </div>
                <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                  <span>Estoque: {Number(b.material?.estoque_atual || 0).toFixed(1)} {b.material?.unidade}</span>
                  <span>Lead Time: {b.lead_time_dias}d</span>
                  <span>Fornecedor: {b.material?.fornecedor_nome || 'N/A'}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex flex-col items-center">
                  <span className="text-[9px] text-muted-foreground">Qtd/un</span>
                  <Input
                    type="number"
                    step="0.001"
                    min="0.001"
                    value={b.quantidade_por_unidade}
                    onChange={e => handleUpdateQty(b.id, Number(e.target.value))}
                    className="w-24 h-8 text-sm"
                  />
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[9px] text-muted-foreground">Lead (d)</span>
                  <Input
                    type="number"
                    min="0"
                    value={b.lead_time_dias}
                    onChange={e => handleUpdateLeadTime(b.id, Number(e.target.value))}
                    className="w-20 h-8 text-sm"
                  />
                </div>
                <span className="text-xs text-muted-foreground">{b.unidade}</span>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleRemove(b.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
