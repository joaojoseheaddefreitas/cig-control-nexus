import * as XLSX from 'xlsx';
import { materiaisMock, categoriaMateriais, getCategoriaMaterialProduto, getMateriaisPorProduto } from '../data/cicData';
import { ordensProducao, setoresProducao } from '../data/cipData';

// Função para ler planilha de produtos e consumos
export async function importarProdutosConsumo(filePath: string) {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Converter para JSON
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    // Extrair cabeçalho e dados
    const header = data[0];
    const rows = data.slice(1);
    
    // Estrutura esperada: [Código_Produto, Nome, Categoria, Consumo_Madeira, Consumo_Tecido, Consumo_Espuma, Consumo_Fibras, Prazo_Entrega]
    const produtos = rows.map((row: any[]) => ({
      codigo: row[0],
      nome: row[1],
      categoria: row[2],
      consumo: {
        madeira: row[3] || 0,
        tecido: row[4] || 0,
        espuma: row[5] || 0,
        fibras: row[6] || 0
      },
      prazoEntrega: row[7] || 0
    }));
    
    return produtos;
  } catch (error) {
    console.error('Erro ao importar produtos:', error);
    throw error;
  }
}

// Função para ler planilha de suprimentos/fornecedores
export async function importarSuprimentos(filePath: string) {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Converter para JSON
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    // Extrair cabeçalho e dados
    const header = data[0];
    const rows = data.slice(1);
    
    // Estrutura esperada: [Código_Material, Nome, Unidade, Ponto_Pedido, Lead_Time, Dias_Segurança, Fornecedor1, Fornecedor2]
    const materiais = rows.map((row: any[]) => ({
      id: `MAT-${row[0].padStart(3, '0')}`,
      nome: row[1],
      unidade: row[2],
      pontoPedido: row[3] || 0,
      leadTime: row[4] || 0,
      diasSeguranca: row[5] || 0,
      fornecedor1: row[6],
      fornecedor2: row[7],
      categoria: 'outros',
      estoqueAtual: 0,
      estoqueMinimo: row[3] || 0,
      status: 'normal',
      leadTimeCompra: row[4] || 0,
      fornecedorPrincipal: row[6],
      custoUnitario: 0
    }));
    
    return materiais;
  } catch (error) {
    console.error('Erro ao importar suprimentos:', error);
    throw error;
  }
}

// Função para integrar dados importados com o ERP existente
export function integrarDadosERP(produtos: any[], materiais: any[]) {
  // Atualizar dados de produtos com consumo de materiais
  const produtosIntegrados = produtos.map(produto => {
    const categoria = produto.categoria.toLowerCase();
    const materiaisCategoria = categoriaMateriais[categoria as keyof typeof categoriaMateriais] || [];
    
    // Calcular consumo total por material
    const consumoDetalhado = materiaisCategoria.map(materialId => {
      const material = materiaisMock.find(m => m.id === materialId);
      if (!material) return null;
      
      let consumo = 0;
      switch (material.categoria) {
        case 'madeira': consumo = produto.consumo.madeira; break;
        case 'tecido': consumo = produto.consumo.tecido; break;
        case 'espuma': consumo = produto.consumo.espuma; break;
        case 'acessorio': consumo = produto.consumo.fibras; break;
      }
      
      return {
        materialId: material.id,
        nome: material.nome,
        categoria: material.categoria,
        unidade: material.unidade,
        consumo: consumo,
        perdaTecnica: consumo * 0.1 // 10% de perda técnica
      };
    }).filter(Boolean);
    
    return {
      ...produto,
      consumoDetalhado,
      materiaisCategoria,
      prazoEntrega: produto.prazoEntrega || 0
    };
  });
  
  // Atualizar dados de materiais com informações dos fornecedores
  const materiaisIntegrados = materiais.map(material => {
    const materialExistente = materiaisMock.find(m => m.id === material.id);
    if (materialExistente) {
      return {
        ...materialExistente,
        ...material,
        estoqueMinimo: material.pontoPedido,
        leadTimeCompra: material.leadTime,
        fornecedorPrincipal: material.fornecedor1
      };
    }
    return material;
  });
  
  return {
    produtos: produtosIntegrados,
    materiais: materiaisIntegrados
  };
}

// Função para simular backflushing
export function simularBackflushing(op: any) {
  const produto = op.produto;
  const quantidade = op.quantidade;
  
  // Buscar materiais necessários para o produto
  const categoria = getCategoriaMaterialProduto(produto);
  const materiaisNecessarios = getMateriaisPorProduto(produto);
  
  // Calcular consumo total
  const consumoBackflushing = materiaisNecessarios.map(material => {
    let consumoUnitario = 0;
    
    // Buscar consumo do produto (seria armazenado no banco de dados)
    // Para simulação, usaremos valores padrão baseados na categoria
    switch (material.categoria) {
      case 'madeira': consumoUnitario = 0.5; break;
      case 'tecido': consumoUnitario = 1.5; break;
      case 'espuma': consumoUnitario = 0.2; break;
      case 'acessorio': consumoUnitario = 2; break;
    }
    
    const consumoTotal = consumoUnitario * quantidade;
    const perdaTecnica = consumoTotal * 0.1;
    
    return {
      materialId: material.id,
      nome: material.nome,
      categoria: material.categoria,
      unidade: material.unidade,
      consumoPlanejado: consumoTotal,
      perdaTecnica: perdaTecnica,
      consumoReal: consumoTotal + perdaTecnica
    };
  });
  
  return consumoBackflushing;
}

// Função para atualizar estoque (simulação)
export function atualizarEstoque(materiais: any[], consumo: any[]) {
  return materiais.map(material => {
    const consumido = consumo.find(c => c.materialId === material.id);
    if (consumido) {
      return {
        ...material,
        estoqueAtual: Math.max(0, material.estoqueAtual - consumido.consumoReal)
      };
    }
    return material;
  });
}

// Função para gerar relatório de integração
export function gerarRelatorioIntegracao(dados: any) {
  const { produtos, materiais } = dados;
  
  const relatorio = {
    totalProdutos: produtos.length,
    totalMateriais: materiais.length,
    produtosPorCategoria: {} as Record<string, number>,
    materiaisPorCategoria: {} as Record<string, number>,
    estoqueCritico: [] as any[],
    materiaisComAlerta: [] as any[]
  };
  
  // Contar produtos por categoria
  produtos.forEach(produto => {
    relatorio.produtosPorCategoria[produto.categoria] = (relatorio.produtosPorCategoria[produto.categoria] || 0) + 1;
  });
  
  // Contar materiais por categoria e identificar estoque crítico
  materiais.forEach(material => {
    relatorio.materiaisPorCategoria[material.categoria] = (relatorio.materiaisPorCategoria[material.categoria] || 0) + 1;
    
    if (material.estoqueAtual <= material.estoqueMinimo) {
      relatorio.estoqueCritico.push({
        ...material,
        situacao: material.estoqueAtual === 0 ? 'zerado' : 'critico'
      });
    }
    
    if (material.estoqueAtual <= material.estoqueMinimo * 1.5) {
      relatorio.materiaisComAlerta.push({
        ...material,
        alerta: 'próximo do mínimo'
      });
    }
  });
  
  return relatorio;
}

// Função principal de integração
export async function integrarERPCompleto() {
  try {
    console.log('Iniciando integração do ERP...');
    
    // Importar dados das planilhas
    const produtos = await importarProdutosConsumo('src/assets/TABELA_DE_CONSUMO_DE_MATERIAIS.xlsx');
    const materiais = await importarSuprimentos('src/assets/Controle_Materiais_Sofa_Estimado.xlsx');
    
    // Integrar com dados existentes
    const dadosIntegrados = integrarDadosERP(produtos, materiais);
    
    // Simular backflushing para uma OP de exemplo
    const opExemplo = ordensProducao[0];
    const consumoBackflushing = simularBackflushing(opExemplo);
    
    // Atualizar estoque (simulação)
    const estoqueAtualizado = atualizarEstoque(dadosIntegrados.materiais, consumoBackflushing);
    
    // Gerar relatório
    const relatorio = gerarRelatorioIntegracao({
      produtos: dadosIntegrados.produtos,
      materiais: estoqueAtualizado
    });
    
    console.log('Integração concluída com sucesso!');
    console.log('Relatório:', relatorio);
    
    return {
      produtos: dadosIntegrados.produtos,
      materiais: estoqueAtualizado,
      relatorio,
      consumoBackflushing
    };
    
  } catch (error) {
    console.error('Erro na integração:', error);
    throw error;
  }
}