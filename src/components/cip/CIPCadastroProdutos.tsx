import { cn } from '@/lib/utils';
import { Search, Filter, Plus, Edit, Trash2, Eye, Package, Database, Truck, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Produto {
  id: string;
  codigo: string;
  nome: string;
  preco: number;
  tempo_padrao: number;
  margem: number;
  preco_base: number;
  percentual_juros: number;
  tempo_total: number;
}

interface ConsumoMaterial {
  cod: number;
  modelo: string;
  madeira_m3: number;
  lt_mad: string;
  espuma_ass_m3: number;
  lt_esp: string;
  espuma_enc_m3: number;
  tecido_ml: number;
  lt_tecido: string;
  percinta_ml: number;
  fibra_kg: number;
}

interface FornecedorMaterial {
  id: string;
  cod_material: string;
  desc_material: string;
  unidade: string;
  cod_forn: string;
  nome_fornecedor: string;
  cnpj: string;
  contato: string;
  email: string;
  telefone: string;
  lead_time_fornecedor: string;
  preco_un: number;
  industria: string;
}

const statusConfig = {
  ativo: { label: 'Ativo', color: 'bg-success/20 text-success border-success/30' },
  inativo: { label: 'Inativo', color: 'bg-warning/20 text-warning border-warning/30' },
  descontinuado: { label: 'Descontinuado', color: 'bg-destructive/20 text-destructive border-destructive/30' },
};

export function CIPCadastroProdutos() {
  const [search, setSearch] = useState('');
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [consumoMateriais, setConsumoMateriais] = useState<ConsumoMaterial[]>([]);
  const [fornecedores, setFornecedores] = useState<FornecedorMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduto, setEditingProduto] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Produto>>({});

  // Carregar dados do Supabase
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [prodRes, consumoRes, fornRes] = await Promise.all([
        supabase.from('produtos').select('*'),
        supabase.from('consumo_materiais').select('*'),
        supabase.from('cadastro_fornecedores').select('*'),
      ]);
      setProdutos(prodRes.data || []);
      setConsumoMateriais(consumoRes.data || []);
      setFornecedores(fornRes.data || []);
      setLoading(false);
    };
    loadData();
  }, []);

  // Função para atualizar produto
  const updateProduto = async (produto: Produto) => {
    const { error } = await supabase
      .from('produtos')
      .update({
        nome: produto.nome,
        preco: produto.preco,
        tempo_padrao: produto.tempo_padrao,
        margem: produto.margem,
        preco_base: produto.preco_base,
        percentual_juros: produto.percentual_juros,
        tempo_total: produto.tempo_total,
      })
      .eq('id', produto.id);
    if (!error) {
      setProdutos(prev => prev.map(p => p.id === produto.id ? produto : p));
      setEditingProduto(null);
    }
  };

  // Função para atualizar consumo de material
  const updateConsumo = async (consumo: ConsumoMaterial) => {
    const { error } = await supabase
      .from('consumo_materiais')
      .update(consumo)
      .eq('cod', consumo.cod);
    if (!error) {
      setConsumoMateriais(prev => prev.map(c => c.cod === consumo.cod ? consumo : c));
    }
  };

  // Função para atualizar fornecedor
  const updateFornecedor = async (fornecedor: FornecedorMaterial) => {
    const { error } = await supabase
      .from('cadastro_fornecedores')
      .update({
        cod_material: fornecedor.cod_material,
        desc_material: fornecedor.desc_material,
        unidade: fornecedor.unidade,
        cod_forn: fornecedor.cod_forn,
        nome_fornecedor: fornecedor.nome_fornecedor,
        cnpj: fornecedor.cnpj,
        contato: fornecedor.contato,
        email: fornecedor.email,
        telefone: fornecedor.telefone,
        lead_time_fornecedor: fornecedor.lead_time_fornecedor,
        preco_un: fornecedor.preco_un,
        industria: fornecedor.industria,
      })
      .eq('id', fornecedor.id);
    if (!error) {
      setFornecedores(prev => prev.map(f => f.id === fornecedor.id ? fornecedor : f));
    }
  };

  const filteredProdutos = produtos.filter(p => 
    p.codigo.toLowerCase().includes(search.toLowerCase()) ||
    p.nome.toLowerCase().includes(search.toLowerCase())
  );

  // Agrupar materiais por código de produto
  const getMateriaisByProduto = (codigoProduto: string) => {
    const codNum = parseInt(codigoProduto);
    return consumoMateriais.filter(c => c.cod === codNum);
  };

  // Obter fornecedores para um material específico
  const getFornecedoresByMaterial = (codMaterial: string) => {
    return fornecedores.filter(f => f.cod_material === codMaterial);
  };

  if (loading) {
    return <div className="p-8 text-center">Carregando dados...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código ou nome do produto..."
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

      {/* Table for Desktop */}
      <div className="hidden lg:block rounded-xl border border-border/30 bg-card/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-secondary/30">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Código</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Nome</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">Preço Base</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">Tempo (h)</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">Margem %</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">Materiais</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">Fornecedores</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredProdutos.map((produto) => {
                const materiais = getMateriaisByProduto(produto.codigo);
                const isEditing = editingProduto === produto.codigo;
                
                return (
                  <tr key={produto.id} className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                    <td className="py-3 px-4 font-medium text-foreground">{produto.codigo}</td>
                    <td className="py-3 px-4 text-foreground">
                      {isEditing ? (
                        <Input
                          value={editForm.nome || ''}
                          onChange={(e) => setEditForm({...editForm, nome: e.target.value})}
                          className="h-8 text-sm"
                        />
                      ) : (
                        produto.nome
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {isEditing ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={editForm.preco_base || ''}
                          onChange={(e) => setEditForm({...editForm, preco_base: parseFloat(e.target.value) || 0})}
                          className="h-8 text-sm w-24 mx-auto"
                        />
                      ) : (
                        <span>R$ {Number(produto.preco_base).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {isEditing ? (
                        <Input
                          type="number"
                          step="0.1"
                          value={editForm.tempo_padrao || ''}
                          onChange={(e) => setEditForm({...editForm, tempo_padrao: parseFloat(e.target.value) || 0})}
                          className="h-8 text-sm w-20 mx-auto"
                        />
                      ) : (
                        `${produto.tempo_padrao}h`
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {isEditing ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={editForm.margem || ''}
                          onChange={(e) => setEditForm({...editForm, margem: parseFloat(e.target.value) || 0})}
                          className="h-8 text-sm w-20 mx-auto"
                        />
                      ) : (
                        `${produto.margem}%`
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex flex-col gap-1">
                        {materiais.slice(0, 2).map((mat, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {mat.madeira_m3 > 0 && `Madeira: ${mat.madeira_m3}m³`}
                            {mat.espuma_ass_m3 > 0 && `Espuma: ${mat.espuma_ass_m3}m³`}
                            {mat.tecido_ml > 0 && `Tecido: ${mat.tecido_ml}ml`}
                          </Badge>
                        ))}
                        {materiais.length > 2 && (
                          <Badge variant="outline" className="text-xs">+{materiais.length - 2} mais</Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex flex-col gap-1">
                        {materiais.slice(0, 1).map((mat, idx) => {
                          const forn = getFornecedoresByMaterial(String(mat.cod)).slice(0, 1);
                          return forn.length > 0 ? (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {forn[0].nome_fornecedor}
                            </Badge>
                          ) : (
                            <Badge key={idx} variant="outline" className="text-xs text-muted-foreground">
                              Sem fornecedor
                            </Badge>
                          );
                        })}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingProduto(isEditing ? null : produto.codigo)}>
                          {isEditing ? <Eye className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Edição de Produto */}
      {editingProduto && (() => {
        const produto = produtos.find(p => p.codigo === editingProduto);
        const materiais = getMateriaisByProduto(editingProduto);
        if (!produto) return null;

        const handleSave = async () => {
          await updateProduto({ ...produto, ...editForm });
        };

        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
              <h2 className="text-xl font-bold mb-4">Editar Produto: {produto.codigo} - {produto.nome}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Dados do Produto */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Dados do Produto</h3>
                  <div>
                    <label className="text-sm font-medium">Nome</label>
                    <Input
                      value={editForm.nome || produto.nome}
                      onChange={(e) => setEditForm({...editForm, nome: e.target.value})}
                      className="mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Preço Base (R$)</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={editForm.preco_base || produto.preco_base}
                        onChange={(e) => setEditForm({...editForm, preco_base: parseFloat(e.target.value) || 0})}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Margem (%)</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={editForm.margem || produto.margem}
                        onChange={(e) => setEditForm({...editForm, margem: parseFloat(e.target.value) || 0})}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Tempo Padrão (h)</label>
                    <Input
                      type="number"
                      step="0.1"
                      value={editForm.tempo_padrao || produto.tempo_padrao}
                      onChange={(e) => setEditForm({...editForm, tempo_padrao: parseFloat(e.target.value) || 0})}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleSave} className="bg-cip hover:bg-cip/90">Salvar</Button>
                    <Button variant="outline" onClick={() => setEditingProduto(null)}>Cancelar</Button>
                  </div>
                </div>

                {/* Materiais Consumidos */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Materiais Consumidos
                  </h3>
                  {materiais.length === 0 ? (
                    <p className="text-muted-foreground text-sm">Nenhum material cadastrado para este produto.</p>
                  ) : (
                    <div className="space-y-3">
                      {materiais.map((mat, idx) => (
                        <div key={idx} className="p-3 border rounded-lg space-y-2">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Madeira:</span>
                              <Input
                                type="number"
                                step="0.001"
                                value={mat.madeira_m3}
                                onChange={(e) => {
                                  const newVal = parseFloat(e.target.value) || 0;
                                  const updated = [...materiais];
                                  updated[idx] = {...mat, madeira_m3: newVal};
                                  // Aqui você pode implementar salvamento individual
                                }}
                                className="h-7 text-xs mt-1"
                              />
                            </div>
                            <div>
                              <span className="text-muted-foreground">Lead Madeira:</span>
                              <Input
                                value={mat.lt_mad}
                                onChange={(e) => {
                                  const updated = [...materiais];
                                  updated[idx] = {...mat, lt_mad: e.target.value};
                                }}
                                className="h-7 text-xs mt-1"
                              />
                            </div>
                            <div>
                              <span className="text-muted-foreground">Espuma Assento:</span>
                              <Input
                                type="number"
                                step="0.001"
                                value={mat.espuma_ass_m3}
                                onChange={(e) => {
                                  const newVal = parseFloat(e.target.value) || 0;
                                  const updated = [...materiais];
                                  updated[idx] = {...mat, espuma_ass_m3: newVal};
                                }}
                                className="h-7 text-xs mt-1"
                              />
                            </div>
                            <div>
                              <span className="text-muted-foreground">Lead Espuma:</span>
                              <Input
                                value={mat.lt_esp}
                                onChange={(e) => {
                                  const updated = [...materiais];
                                  updated[idx] = {...mat, lt_esp: e.target.value};
                                }}
                                className="h-7 text-xs mt-1"
                              />
                            </div>
                            <div>
                              <span className="text-muted-foreground">Espuma Encosto:</span>
                              <Input
                                type="number"
                                step="0.001"
                                value={mat.espuma_enc_m3}
                                onChange={(e) => {
                                  const newVal = parseFloat(e.target.value) || 0;
                                  const updated = [...materiais];
                                  updated[idx] = {...mat, espuma_enc_m3: newVal};
                                }}
                                className="h-7 text-xs mt-1"
                              />
                            </div>
                            <div>
                              <span className="text-muted-foreground">Tecido (ml):</span>
                              <Input
                                type="number"
                                step="1"
                                value={mat.tecido_ml}
                                onChange={(e) => {
                                  const newVal = parseFloat(e.target.value) || 0;
                                  const updated = [...materiais];
                                  updated[idx] = {...mat, tecido_ml: newVal};
                                }}
                                className="h-7 text-xs mt-1"
                              />
                            </div>
                            <div>
                              <span className="text-muted-foreground">Lead Tecido:</span>
                              <Input
                                value={mat.lt_tecido}
                                onChange={(e) => {
                                  const updated = [...materiais];
                                  updated[idx] = {...mat, lt_tecido: e.target.value};
                                }}
                                className="h-7 text-xs mt-1"
                              />
                            </div>
                            <div>
                              <span className="text-muted-foreground">Percinta (ml):</span>
                              <Input
                                type="number"
                                step="1"
                                value={mat.percinta_ml}
                                onChange={(e) => {
                                  const newVal = parseFloat(e.target.value) || 0;
                                  const updated = [...materiais];
                                  updated[idx] = {...mat, percinta_ml: newVal};
                                }}
                                className="h-7 text-xs mt-1"
                              />
                            </div>
                            <div>
                              <span className="text-muted-foreground">Fibra (kg):</span>
                              <Input
                                type="number"
                                step="0.1"
                                value={mat.fibra_kg}
                                onChange={(e) => {
                                  const newVal = parseFloat(e.target.value) || 0;
                                  const updated = [...materiais];
                                  updated[idx] = {...mat, fibra_kg: newVal};
                                }}
                                className="h-7 text-xs mt-1"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={async () => {
                                await updateConsumo(mat);
                              }}
                            >
                              Salvar Alterações
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Fornecedores */}
              <div className="mt-6 space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Fornecedores por Material
                </h3>
                {materiais.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Nenhum material para exibir fornecedores.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {materiais.map((mat, idx) => {
                      const fornList = getFornecedoresByMaterial(String(mat.cod));
                      return (
                        <div key={idx} className="p-3 border rounded-lg">
                          <h4 className="font-medium mb-2">
                            Material {mat.cod} - {fornList[0]?.desc_material || 'Sem descrição'}
                          </h4>
                          {fornList.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Nenhum fornecedor cadastrado.</p>
                          ) : (
                            <div className="space-y-2">
                              {fornList.map((forn, fIdx) => (
                                <div key={fIdx} className="text-sm space-y-1 p-2 bg-secondary/30 rounded">
                                  <div className="flex justify-between">
                                    <span className="font-medium">{forn.nome_fornecedor}</span>
                                    <Badge variant="outline">{forn.cod_forn}</Badge>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                    <div>Lead: {forn.lead_time_fornecedor}</div>
                                    <div>Preço: R$ {Number(forn.preco_un).toFixed(2)}</div>
                                    <div>Contato: {forn.contato}</div>
                                    <div>CNPJ: {forn.cnpj}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Cards Grid for Mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-4">
        {filteredProdutos.map((produto) => (
          <div key={produto.id} className="rounded-xl border border-border/30 bg-card/80 p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-cip" />
                <span className="text-xs text-muted-foreground">{produto.codigo}</span>
              </div>
              <Badge className={cn('text-xs', statusConfig.ativo.color)}>Ativo</Badge>
            </div>
            <h3 className="font-medium text-foreground text-sm mb-2">{produto.nome}</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Preço:</span>
                <span className="ml-1 text-foreground">R$ {Number(produto.preco_base).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Tempo:</span>
                <span className="ml-1 text-foreground">{produto.tempo_padrao}h</span>
              </div>
              <div>
                <span className="text-muted-foreground">Margem:</span>
                <span className="ml-1 text-foreground">{produto.margem}%</span>
              </div>
              <div>
                <span className="text-muted-foreground">Materiais:</span>
                <span className="ml-1 text-foreground">{getMateriaisByProduto(produto.codigo).length}</span>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setEditingProduto(produto.codigo)}>
                <Edit className="h-4 w-4 mr-1" /> Editar
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border/30 bg-card/80 p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{produtos.length}</p>
          <p className="text-xs text-muted-foreground">Total Produtos</p>
        </div>
        <div className="rounded-xl border border-success/30 bg-success/10 p-4 text-center">
          <p className="text-2xl font-bold text-success">{produtos.length}</p>
          <p className="text-xs text-muted-foreground">Ativos</p>
        </div>
        <div className="rounded-xl border border-warning/30 bg-warning/10 p-4 text-center">
          <p className="text-2xl font-bold text-warning">{consumoMateriais.length}</p>
          <p className="text-xs text-muted-foreground">BOM Cadastrado</p>
        </div>
        <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 text-center">
          <p className="text-2xl font-bold text-primary">{fornecedores.length}</p>
          <p className="text-xs text-muted-foreground">Fornecedores</p>
        </div>
      </div>
    </div>
  );
}