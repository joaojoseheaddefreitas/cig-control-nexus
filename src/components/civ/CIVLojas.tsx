import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { KPICard } from '@/components/ui/KPICard';
import { ModuleCard } from '@/components/ui/ModuleCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Store, DollarSign, TrendingUp, Plus, Edit, Trash2, Loader2, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface Loja {
  id: string;
  nome: string;
  tipo: string;
  cidade: string | null;
  estado: string | null;
  endereco: string | null;
  responsavel: string | null;
  telefone: string | null;
  ativo: boolean;
}

const tipoColors: Record<string, string> = {
  loja: 'bg-success/20 text-success border-success/30',
  parceira: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  representante: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
};

const tipoLabels: Record<string, string> = {
  loja: 'Loja Própria',
  parceira: 'Parceira',
  representante: 'Representante',
};

const emptyForm = (): Partial<Loja> => ({
  nome: '', tipo: 'loja', cidade: '', estado: '', responsavel: '', telefone: '', ativo: true
});

export function CIVLojas() {
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLoja, setEditingLoja] = useState<Partial<Loja> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadLojas(); }, []);

  const loadLojas = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('lojas').select('*').order('nome');
    if (error) { toast.error('Erro ao carregar lojas'); }
    else { setLojas(data || []); }
    setLoading(false);
  };

  const openNew = () => {
    setEditingLoja(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = (loja: Loja) => {
    setEditingLoja({ ...loja });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingLoja?.nome) { toast.error('Nome é obrigatório'); return; }
    setSaving(true);
    try {
      if (editingLoja.id) {
        const { error } = await supabase.from('lojas').update({
          nome: editingLoja.nome,
          tipo: editingLoja.tipo || 'loja',
          cidade: editingLoja.cidade || null,
          estado: editingLoja.estado || null,
          endereco: editingLoja.endereco || null,
          responsavel: editingLoja.responsavel || null,
          telefone: editingLoja.telefone || null,
          ativo: editingLoja.ativo ?? true,
        }).eq('id', editingLoja.id);
        if (error) throw error;
        toast.success('Loja atualizada com sucesso');
      } else {
        const { error } = await supabase.from('lojas').insert({
          nome: editingLoja.nome,
          tipo: editingLoja.tipo || 'loja',
          cidade: editingLoja.cidade || null,
          estado: editingLoja.estado || null,
          endereco: editingLoja.endereco || null,
          responsavel: editingLoja.responsavel || null,
          telefone: editingLoja.telefone || null,
          ativo: true,
        });
        if (error) throw error;
        toast.success('Loja cadastrada com sucesso');
      }
      setDialogOpen(false);
      await loadLojas();
    } catch (e: any) {
      toast.error('Erro ao salvar', { description: e.message });
    }
    setSaving(false);
  };

  const handleDelete = async (id: string, nome: string) => {
    if (!confirm(`Deseja excluir "${nome}"?`)) return;
    const { error } = await supabase.from('lojas').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir', { description: error.message }); }
    else { toast.success('Loja excluída'); await loadLojas(); }
  };

  const ativas = lojas.filter(l => l.ativo).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard title="Total Lojas/Canais" value={lojas.length} subtitle="Cadastradas" icon={<Store className="h-5 w-5" />} variant="civ" />
        <KPICard title="Ativas" value={ativas} subtitle="Em operação" icon={<TrendingUp className="h-5 w-5" />} variant="civ" />
        <KPICard title="Inativas" value={lojas.length - ativas} subtitle="Desativadas" icon={<DollarSign className="h-5 w-5" />} variant="civ" />
      </div>

      {/* Tabela */}
      <ModuleCard title="Lojas e Canais de Venda" variant="civ">
        <div className="flex justify-end mb-4">
          <Button size="sm" className="bg-civ hover:bg-civ/90 gap-2" onClick={openNew}>
            <Plus className="h-4 w-4" /> Nova Loja/Canal
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Carregando...</span>
          </div>
        ) : (
          <ScrollArea className="max-h-[500px]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-secondary/30 sticky top-0">
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Nome</th>
                  <th className="text-center py-3 px-4 text-muted-foreground font-medium">Tipo</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium hidden md:table-cell">Cidade/UF</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium hidden lg:table-cell">Responsável</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium hidden lg:table-cell">Telefone</th>
                  <th className="text-center py-3 px-4 text-muted-foreground font-medium">Status</th>
                  <th className="text-center py-3 px-4 text-muted-foreground font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {lojas.length === 0 ? (
                  <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">Nenhuma loja cadastrada. Clique em "Nova Loja/Canal" para começar.</td></tr>
                ) : (
                  lojas.map((loja) => (
                    <tr key={loja.id} className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                      <td className="py-3 px-4 font-medium text-foreground">{loja.nome}</td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant="outline" className={tipoColors[loja.tipo] || 'bg-secondary/30'}>
                          {tipoLabels[loja.tipo] || loja.tipo}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">
                        {[loja.cidade, loja.estado].filter(Boolean).join('/') || '—'}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground hidden lg:table-cell">{loja.responsavel || '—'}</td>
                      <td className="py-3 px-4 text-muted-foreground hidden lg:table-cell">{loja.telefone || '—'}</td>
                      <td className="py-3 px-4 text-center">
                        {loja.ativo ? (
                          <Badge variant="outline" className="bg-success/20 text-success border-success/30">Ativa</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-muted/20 text-muted-foreground">Inativa</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(loja)}>
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(loja.id, loja.nome)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </ScrollArea>
        )}
      </ModuleCard>

      {/* Dialog de Cadastro/Edição */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingLoja?.id ? 'Editar Loja/Canal' : 'Nova Loja/Canal'}</DialogTitle>
            <DialogDescription>Preencha os dados da loja ou canal de venda.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-sm font-medium">Nome *</label>
              <Input value={editingLoja?.nome || ''} onChange={e => setEditingLoja(prev => ({ ...prev, nome: e.target.value }))} className="mt-1" placeholder="Nome da loja ou canal" />
            </div>
            <div>
              <label className="text-sm font-medium">Tipo</label>
              <Select value={editingLoja?.tipo || 'loja'} onValueChange={v => setEditingLoja(prev => ({ ...prev, tipo: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="loja">Loja Própria</SelectItem>
                  <SelectItem value="parceira">Parceira</SelectItem>
                  <SelectItem value="representante">Representante</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Cidade</label>
                <Input value={editingLoja?.cidade || ''} onChange={e => setEditingLoja(prev => ({ ...prev, cidade: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">UF</label>
                <Input value={editingLoja?.estado || ''} onChange={e => setEditingLoja(prev => ({ ...prev, estado: e.target.value.toUpperCase().slice(0, 2) }))} className="mt-1" placeholder="SP" maxLength={2} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Responsável</label>
              <Input value={editingLoja?.responsavel || ''} onChange={e => setEditingLoja(prev => ({ ...prev, responsavel: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Telefone</label>
              <Input value={editingLoja?.telefone || ''} onChange={e => setEditingLoja(prev => ({ ...prev, telefone: e.target.value }))} className="mt-1" />
            </div>
            {editingLoja?.id && (
              <div className="flex items-center gap-2">
                <input type="checkbox" id="ativo" checked={editingLoja?.ativo ?? true} onChange={e => setEditingLoja(prev => ({ ...prev, ativo: e.target.checked }))} />
                <label htmlFor="ativo" className="text-sm">Ativa</label>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              <X className="h-4 w-4 mr-1" /> Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-civ hover:bg-civ/90">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />}
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
