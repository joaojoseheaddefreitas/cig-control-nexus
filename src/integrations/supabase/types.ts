export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      action_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity: string
          entity_id: string | null
          id: string
          status: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity: string
          entity_id?: string | null
          id?: string
          status?: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity?: string
          entity_id?: string | null
          id?: string
          status?: string
        }
        Relationships: []
      }
      bom_produto: {
        Row: {
          created_at: string
          id: string
          lead_time_dias: number
          material_id: string
          produto_id: string
          quantidade_por_unidade: number
          unidade: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          lead_time_dias?: number
          material_id: string
          produto_id: string
          quantidade_por_unidade?: number
          unidade?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          lead_time_dias?: number
          material_id?: string
          produto_id?: string
          quantidade_por_unidade?: number
          unidade?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bom_produto_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materiais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bom_produto_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      cargas: {
        Row: {
          created_at: string
          data_emissao: string
          id: string
          modo: string
          observacoes: string | null
          status: string
          turno: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_emissao?: string
          id?: string
          modo?: string
          observacoes?: string | null
          status?: string
          turno?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_emissao?: string
          id?: string
          modo?: string
          observacoes?: string | null
          status?: string
          turno?: string
          updated_at?: string
        }
        Relationships: []
      }
      carteira_producao: {
        Row: {
          id: string
          total_horas_acumuladas: number
          updated_at: string
        }
        Insert: {
          id?: string
          total_horas_acumuladas?: number
          updated_at?: string
        }
        Update: {
          id?: string
          total_horas_acumuladas?: number
          updated_at?: string
        }
        Relationships: []
      }
      clientes: {
        Row: {
          ativo: boolean
          cidade: string | null
          cnpj_cpf: string | null
          created_at: string
          email: string | null
          endereco: string | null
          estado: string | null
          id: string
          nome: string
          observacoes: string | null
          status_financeiro: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cidade?: string | null
          cnpj_cpf?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          status_financeiro?: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cidade?: string | null
          cnpj_cpf?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          status_financeiro?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      configuracoes_capacidade: {
        Row: {
          capacidade_produtiva_diaria: number
          considerar_sabado: boolean
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          capacidade_produtiva_diaria?: number
          considerar_sabado?: boolean
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          capacidade_produtiva_diaria?: number
          considerar_sabado?: boolean
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      configuracoes_financeiras: {
        Row: {
          comissoes_percentual: number
          created_at: string
          id: string
          impostos_percentual: number
          updated_at: string
        }
        Insert: {
          comissoes_percentual?: number
          created_at?: string
          id?: string
          impostos_percentual?: number
          updated_at?: string
        }
        Update: {
          comissoes_percentual?: number
          created_at?: string
          id?: string
          impostos_percentual?: number
          updated_at?: string
        }
        Relationships: []
      }
      contas_pagar: {
        Row: {
          categoria: string
          created_at: string
          data_pagamento: string | null
          data_vencimento: string
          descricao: string
          fornecedor_id: string | null
          id: string
          observacoes: string | null
          status: string
          updated_at: string
          valor: number
        }
        Insert: {
          categoria?: string
          created_at?: string
          data_pagamento?: string | null
          data_vencimento?: string
          descricao: string
          fornecedor_id?: string | null
          id?: string
          observacoes?: string | null
          status?: string
          updated_at?: string
          valor?: number
        }
        Update: {
          categoria?: string
          created_at?: string
          data_pagamento?: string | null
          data_vencimento?: string
          descricao?: string
          fornecedor_id?: string | null
          id?: string
          observacoes?: string | null
          status?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "contas_pagar_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
      contas_receber: {
        Row: {
          cliente_id: string | null
          created_at: string
          data_recebimento: string | null
          data_vencimento: string
          descricao: string
          id: string
          observacoes: string | null
          pedido_id: string | null
          status: string
          updated_at: string
          valor: number
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string
          data_recebimento?: string | null
          data_vencimento?: string
          descricao: string
          id?: string
          observacoes?: string | null
          pedido_id?: string | null
          status?: string
          updated_at?: string
          valor?: number
        }
        Update: {
          cliente_id?: string | null
          created_at?: string
          data_recebimento?: string | null
          data_vencimento?: string
          descricao?: string
          id?: string
          observacoes?: string | null
          pedido_id?: string | null
          status?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "contas_receber_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_receber_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      custos_fixos: {
        Row: {
          ativo: boolean
          categoria: string
          created_at: string
          descricao: string
          id: string
          observacoes: string | null
          updated_at: string
          valor_mensal: number
        }
        Insert: {
          ativo?: boolean
          categoria?: string
          created_at?: string
          descricao: string
          id?: string
          observacoes?: string | null
          updated_at?: string
          valor_mensal?: number
        }
        Update: {
          ativo?: boolean
          categoria?: string
          created_at?: string
          descricao?: string
          id?: string
          observacoes?: string | null
          updated_at?: string
          valor_mensal?: number
        }
        Relationships: []
      }
      familia_op: {
        Row: {
          created_at: string
          id: string
          numero_familia: string
          pedido_id: string
          status: string
          tempo_total_familia: number
          total_ops: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          numero_familia: string
          pedido_id: string
          status?: string
          tempo_total_familia?: number
          total_ops?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          numero_familia?: string
          pedido_id?: string
          status?: string
          tempo_total_familia?: number
          total_ops?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "familia_op_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: true
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      fornecedor_materiais: {
        Row: {
          codigo_material_fornecedor: string
          created_at: string
          fornecedor_id: string
          fornecedor_preferencial: boolean
          id: string
          lead_time_dias: number
          material_id: string
          preco_atual: number
          quantidade_minima: number
          status: string
          updated_at: string
        }
        Insert: {
          codigo_material_fornecedor?: string
          created_at?: string
          fornecedor_id: string
          fornecedor_preferencial?: boolean
          id?: string
          lead_time_dias?: number
          material_id: string
          preco_atual?: number
          quantidade_minima?: number
          status?: string
          updated_at?: string
        }
        Update: {
          codigo_material_fornecedor?: string
          created_at?: string
          fornecedor_id?: string
          fornecedor_preferencial?: boolean
          id?: string
          lead_time_dias?: number
          material_id?: string
          preco_atual?: number
          quantidade_minima?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fornecedor_materiais_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fornecedor_materiais_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materiais"
            referencedColumns: ["id"]
          },
        ]
      }
      fornecedores: {
        Row: {
          ativo: boolean
          cnpj: string | null
          contato: string | null
          created_at: string
          email: string | null
          id: string
          nome: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cnpj?: string | null
          contato?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cnpj?: string | null
          contato?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      funcionarios: {
        Row: {
          ativo: boolean
          created_at: string
          data_admissao: string | null
          encargos_percentual: number
          funcao: string
          id: string
          nome: string
          observacoes: string | null
          salario: number
          setor_id: string | null
          tipo_mao_obra: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          data_admissao?: string | null
          encargos_percentual?: number
          funcao?: string
          id?: string
          nome: string
          observacoes?: string | null
          salario?: number
          setor_id?: string | null
          tipo_mao_obra?: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          data_admissao?: string | null
          encargos_percentual?: number
          funcao?: string
          id?: string
          nome?: string
          observacoes?: string | null
          salario?: number
          setor_id?: string | null
          tipo_mao_obra?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "funcionarios_setor_id_fkey"
            columns: ["setor_id"]
            isOneToOne: false
            referencedRelation: "setores_produtivos"
            referencedColumns: ["id"]
          },
        ]
      }
      itens_pedido: {
        Row: {
          created_at: string
          fraction_count: number
          id: string
          observacoes: string | null
          pedido_id: string
          produto_id: string | null
          produto_nome: string
          quantidade: number
          tempo_total: number | null
          tempo_unitario: number
          updated_at: string
          valor_total: number | null
          valor_unitario: number
        }
        Insert: {
          created_at?: string
          fraction_count?: number
          id?: string
          observacoes?: string | null
          pedido_id: string
          produto_id?: string | null
          produto_nome: string
          quantidade?: number
          tempo_total?: number | null
          tempo_unitario?: number
          updated_at?: string
          valor_total?: number | null
          valor_unitario?: number
        }
        Update: {
          created_at?: string
          fraction_count?: number
          id?: string
          observacoes?: string | null
          pedido_id?: string
          produto_id?: string | null
          produto_nome?: string
          quantidade?: number
          tempo_total?: number | null
          tempo_unitario?: number
          updated_at?: string
          valor_total?: number | null
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "itens_pedido_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_pedido_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          created_at: string
          email: string | null
          empresa: string | null
          id: string
          nome: string
          observacoes: string | null
          origem: string
          status: string
          telefone: string | null
          updated_at: string
          vendedor_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          empresa?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          origem?: string
          status?: string
          telefone?: string | null
          updated_at?: string
          vendedor_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          empresa?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          origem?: string
          status?: string
          telefone?: string | null
          updated_at?: string
          vendedor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "vendedores"
            referencedColumns: ["id"]
          },
        ]
      }
      logs_auditoria: {
        Row: {
          acao: string
          campo_alterado: string | null
          data: string
          detalhes: string | null
          entidade: string | null
          entidade_id: string | null
          id: string
          nivel_risco: string
          usuario: string
          valor_antigo: number | null
          valor_novo: number | null
        }
        Insert: {
          acao?: string
          campo_alterado?: string | null
          data?: string
          detalhes?: string | null
          entidade?: string | null
          entidade_id?: string | null
          id?: string
          nivel_risco?: string
          usuario?: string
          valor_antigo?: number | null
          valor_novo?: number | null
        }
        Update: {
          acao?: string
          campo_alterado?: string | null
          data?: string
          detalhes?: string | null
          entidade?: string | null
          entidade_id?: string | null
          id?: string
          nivel_risco?: string
          usuario?: string
          valor_antigo?: number | null
          valor_novo?: number | null
        }
        Relationships: []
      }
      lojas: {
        Row: {
          ativo: boolean
          cidade: string | null
          created_at: string
          endereco: string | null
          estado: string | null
          id: string
          nome: string
          responsavel: string | null
          telefone: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cidade?: string | null
          created_at?: string
          endereco?: string | null
          estado?: string | null
          id?: string
          nome: string
          responsavel?: string | null
          telefone?: string | null
          tipo?: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cidade?: string | null
          created_at?: string
          endereco?: string | null
          estado?: string | null
          id?: string
          nome?: string
          responsavel?: string | null
          telefone?: string | null
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      materiais: {
        Row: {
          ativo: boolean
          categoria: string
          codigo: string
          consumo_medio_diario: number
          created_at: string
          estoque_atual: number
          estoque_maximo: number
          estoque_minimo: number
          estoque_seguranca: number
          fornecedor_id: string | null
          fornecedor_nome: string | null
          id: string
          lead_time_dias: number
          lote_economico: number
          margem_seguranca_percentual: number
          nome: string
          ponto_pedido: number
          tipo_controle: string
          ultima_entrada: string | null
          unidade: string
          updated_at: string
          valor_unitario: number
        }
        Insert: {
          ativo?: boolean
          categoria?: string
          codigo: string
          consumo_medio_diario?: number
          created_at?: string
          estoque_atual?: number
          estoque_maximo?: number
          estoque_minimo?: number
          estoque_seguranca?: number
          fornecedor_id?: string | null
          fornecedor_nome?: string | null
          id?: string
          lead_time_dias?: number
          lote_economico?: number
          margem_seguranca_percentual?: number
          nome: string
          ponto_pedido?: number
          tipo_controle?: string
          ultima_entrada?: string | null
          unidade?: string
          updated_at?: string
          valor_unitario?: number
        }
        Update: {
          ativo?: boolean
          categoria?: string
          codigo?: string
          consumo_medio_diario?: number
          created_at?: string
          estoque_atual?: number
          estoque_maximo?: number
          estoque_minimo?: number
          estoque_seguranca?: number
          fornecedor_id?: string | null
          fornecedor_nome?: string | null
          id?: string
          lead_time_dias?: number
          lote_economico?: number
          margem_seguranca_percentual?: number
          nome?: string
          ponto_pedido?: number
          tipo_controle?: string
          ultima_entrada?: string | null
          unidade?: string
          updated_at?: string
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "materiais_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
      movimentacoes_estoque: {
        Row: {
          created_at: string
          id: string
          motivo: string | null
          origem: string
          produto_id: string
          quantidade: number
          tipo: string
          usuario: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          motivo?: string | null
          origem?: string
          produto_id: string
          quantidade: number
          tipo: string
          usuario?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          motivo?: string | null
          origem?: string
          produto_id?: string
          quantidade?: number
          tipo?: string
          usuario?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_estoque_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      movimentacoes_materiais: {
        Row: {
          created_at: string
          id: string
          material_id: string
          motivo: string | null
          nota_fiscal: string | null
          op_id: string | null
          quantidade: number
          tipo: string
          usuario: string | null
          valor_total: number
        }
        Insert: {
          created_at?: string
          id?: string
          material_id: string
          motivo?: string | null
          nota_fiscal?: string | null
          op_id?: string | null
          quantidade: number
          tipo: string
          usuario?: string | null
          valor_total?: number
        }
        Update: {
          created_at?: string
          id?: string
          material_id?: string
          motivo?: string | null
          nota_fiscal?: string | null
          op_id?: string | null
          quantidade?: number
          tipo?: string
          usuario?: string | null
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_materiais_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materiais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_materiais_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: false
            referencedRelation: "ops"
            referencedColumns: ["id"]
          },
        ]
      }
      op_route_steps: {
        Row: {
          created_at: string
          id: string
          op_id: string
          ordem: number
          setor_id: string
          tempo_estimado: number
        }
        Insert: {
          created_at?: string
          id?: string
          op_id: string
          ordem?: number
          setor_id: string
          tempo_estimado?: number
        }
        Update: {
          created_at?: string
          id?: string
          op_id?: string
          ordem?: number
          setor_id?: string
          tempo_estimado?: number
        }
        Relationships: [
          {
            foreignKeyName: "op_route_steps_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: false
            referencedRelation: "ops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "op_route_steps_setor_id_fkey"
            columns: ["setor_id"]
            isOneToOne: false
            referencedRelation: "setores_produtivos"
            referencedColumns: ["id"]
          },
        ]
      }
      ops: {
        Row: {
          carga_id: string | null
          created_at: string
          current_sector: string | null
          data_nf: string | null
          data_programada: string | null
          desenho_url: string | null
          familia_op_id: string
          id: string
          item_pedido_id: string
          nota_fiscal: string | null
          numero_op: string
          observacoes: string | null
          pedido_id: string | null
          prazo_entrega: string | null
          produto_nome: string
          quantidade: number
          sequence_number: number | null
          sequencia_fila: number | null
          sequencia_programada: number | null
          status_faturamento: string
          status_producao: string
          tempo_total: number | null
          tempo_unitario: number
          total_ops_at_generation: number | null
          updated_at: string
        }
        Insert: {
          carga_id?: string | null
          created_at?: string
          current_sector?: string | null
          data_nf?: string | null
          data_programada?: string | null
          desenho_url?: string | null
          familia_op_id: string
          id?: string
          item_pedido_id: string
          nota_fiscal?: string | null
          numero_op: string
          observacoes?: string | null
          pedido_id?: string | null
          prazo_entrega?: string | null
          produto_nome: string
          quantidade?: number
          sequence_number?: number | null
          sequencia_fila?: number | null
          sequencia_programada?: number | null
          status_faturamento?: string
          status_producao?: string
          tempo_total?: number | null
          tempo_unitario?: number
          total_ops_at_generation?: number | null
          updated_at?: string
        }
        Update: {
          carga_id?: string | null
          created_at?: string
          current_sector?: string | null
          data_nf?: string | null
          data_programada?: string | null
          desenho_url?: string | null
          familia_op_id?: string
          id?: string
          item_pedido_id?: string
          nota_fiscal?: string | null
          numero_op?: string
          observacoes?: string | null
          pedido_id?: string | null
          prazo_entrega?: string | null
          produto_nome?: string
          quantidade?: number
          sequence_number?: number | null
          sequencia_fila?: number | null
          sequencia_programada?: number | null
          status_faturamento?: string
          status_producao?: string
          tempo_total?: number | null
          tempo_unitario?: number
          total_ops_at_generation?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ops_carga_id_fkey"
            columns: ["carga_id"]
            isOneToOne: false
            referencedRelation: "cargas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ops_familia_op_id_fkey"
            columns: ["familia_op_id"]
            isOneToOne: false
            referencedRelation: "familia_op"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ops_item_pedido_id_fkey"
            columns: ["item_pedido_id"]
            isOneToOne: false
            referencedRelation: "itens_pedido"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ops_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      orcamentos: {
        Row: {
          categoria: string
          created_at: string
          id: string
          mes_ano: string
          updated_at: string
          valor_limite: number
        }
        Insert: {
          categoria?: string
          created_at?: string
          id?: string
          mes_ano?: string
          updated_at?: string
          valor_limite?: number
        }
        Update: {
          categoria?: string
          created_at?: string
          id?: string
          mes_ano?: string
          updated_at?: string
          valor_limite?: number
        }
        Relationships: []
      }
      pedidos: {
        Row: {
          canal: string
          cliente: string
          cliente_id: string | null
          codigo: string
          created_at: string
          data_aprovacao: string | null
          data_entrada: string
          data_expedicao: string | null
          data_faturamento: string | null
          data_nf: string | null
          id: string
          loja_id: string | null
          margem: number
          nota_fiscal: string | null
          observacoes: string | null
          op: string | null
          origem_dado: string
          prazo_calculado_dias: number | null
          prazo_entrega: string | null
          produto: string
          quantidade: number
          status: string
          status_faturamento: string
          status_producao: string
          updated_at: string
          valor_total: number
          vendedor_id: string | null
        }
        Insert: {
          canal?: string
          cliente: string
          cliente_id?: string | null
          codigo: string
          created_at?: string
          data_aprovacao?: string | null
          data_entrada?: string
          data_expedicao?: string | null
          data_faturamento?: string | null
          data_nf?: string | null
          id?: string
          loja_id?: string | null
          margem?: number
          nota_fiscal?: string | null
          observacoes?: string | null
          op?: string | null
          origem_dado?: string
          prazo_calculado_dias?: number | null
          prazo_entrega?: string | null
          produto: string
          quantidade?: number
          status?: string
          status_faturamento?: string
          status_producao?: string
          updated_at?: string
          valor_total?: number
          vendedor_id?: string | null
        }
        Update: {
          canal?: string
          cliente?: string
          cliente_id?: string | null
          codigo?: string
          created_at?: string
          data_aprovacao?: string | null
          data_entrada?: string
          data_expedicao?: string | null
          data_faturamento?: string | null
          data_nf?: string | null
          id?: string
          loja_id?: string | null
          margem?: number
          nota_fiscal?: string | null
          observacoes?: string | null
          op?: string | null
          origem_dado?: string
          prazo_calculado_dias?: number | null
          prazo_entrega?: string | null
          produto?: string
          quantidade?: number
          status?: string
          status_faturamento?: string
          status_producao?: string
          updated_at?: string
          valor_total?: number
          vendedor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "vendedores"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos_compra: {
        Row: {
          created_at: string
          data_emissao: string
          data_previsao: string | null
          data_recebimento: string | null
          fornecedor_id: string | null
          fornecedor_nome: string
          id: string
          in_full: boolean | null
          material_id: string | null
          material_nome: string
          nota_fiscal: string | null
          observacoes: string | null
          on_time: boolean | null
          quantidade: number
          quantidade_recebida: number
          status: string
          updated_at: string
          valor_total: number
          valor_unitario: number
        }
        Insert: {
          created_at?: string
          data_emissao?: string
          data_previsao?: string | null
          data_recebimento?: string | null
          fornecedor_id?: string | null
          fornecedor_nome?: string
          id?: string
          in_full?: boolean | null
          material_id?: string | null
          material_nome?: string
          nota_fiscal?: string | null
          observacoes?: string | null
          on_time?: boolean | null
          quantidade?: number
          quantidade_recebida?: number
          status?: string
          updated_at?: string
          valor_total?: number
          valor_unitario?: number
        }
        Update: {
          created_at?: string
          data_emissao?: string
          data_previsao?: string | null
          data_recebimento?: string | null
          fornecedor_id?: string | null
          fornecedor_nome?: string
          id?: string
          in_full?: boolean | null
          material_id?: string | null
          material_nome?: string
          nota_fiscal?: string | null
          observacoes?: string | null
          on_time?: boolean | null
          quantidade?: number
          quantidade_recebida?: number
          status?: string
          updated_at?: string
          valor_total?: number
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_compra_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_compra_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materiais"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline: {
        Row: {
          cliente_id: string | null
          created_at: string
          data_previsao: string | null
          etapa: string
          id: string
          observacoes: string | null
          probabilidade: number
          titulo: string
          updated_at: string
          valor_estimado: number
          vendedor_id: string | null
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string
          data_previsao?: string | null
          etapa?: string
          id?: string
          observacoes?: string | null
          probabilidade?: number
          titulo: string
          updated_at?: string
          valor_estimado?: number
          vendedor_id?: string | null
        }
        Update: {
          cliente_id?: string | null
          created_at?: string
          data_previsao?: string | null
          etapa?: string
          id?: string
          observacoes?: string | null
          probabilidade?: number
          titulo?: string
          updated_at?: string
          valor_estimado?: number
          vendedor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipeline_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "vendedores"
            referencedColumns: ["id"]
          },
        ]
      }
      produto_setor_tempos: {
        Row: {
          created_at: string
          id: string
          produto_id: string
          setor_id: string
          tempo_horas: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          produto_id: string
          setor_id: string
          tempo_horas?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          produto_id?: string
          setor_id?: string
          tempo_horas?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "produto_setor_tempos_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produto_setor_tempos_setor_id_fkey"
            columns: ["setor_id"]
            isOneToOne: false
            referencedRelation: "setores_produtivos"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          ativo: boolean
          categoria: string
          codigo: string | null
          created_at: string
          descricao: string | null
          id: string
          lead_time_manual: boolean
          lead_time_produto: number
          linha: string | null
          modelo: string | null
          nome: string
          observacoes: string | null
          percentual_juros: number
          preco_base: number
          tempo_unitario: number
          unidade: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          categoria?: string
          codigo?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          lead_time_manual?: boolean
          lead_time_produto?: number
          linha?: string | null
          modelo?: string | null
          nome: string
          observacoes?: string | null
          percentual_juros?: number
          preco_base?: number
          tempo_unitario?: number
          unidade?: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          categoria?: string
          codigo?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          lead_time_manual?: boolean
          lead_time_produto?: number
          linha?: string | null
          modelo?: string | null
          nome?: string
          observacoes?: string | null
          percentual_juros?: number
          preco_base?: number
          tempo_unitario?: number
          unidade?: string
          updated_at?: string
        }
        Relationships: []
      }
      projetos_especiais: {
        Row: {
          cliente_id: string | null
          created_at: string
          data_inicio: string | null
          data_previsao_entrega: string | null
          descricao: string | null
          id: string
          nome: string
          observacoes: string | null
          responsavel: string | null
          status: string
          updated_at: string
          valor_estimado: number
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string
          data_inicio?: string | null
          data_previsao_entrega?: string | null
          descricao?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          responsavel?: string | null
          status?: string
          updated_at?: string
          valor_estimado?: number
        }
        Update: {
          cliente_id?: string | null
          created_at?: string
          data_inicio?: string | null
          data_previsao_entrega?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          responsavel?: string | null
          status?: string
          updated_at?: string
          valor_estimado?: number
        }
        Relationships: [
          {
            foreignKeyName: "projetos_especiais_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      setor_rastreamento: {
        Row: {
          created_at: string
          data_baixa: string | null
          data_entrada: string | null
          id: string
          observacoes: string | null
          op_id: string
          operador: string | null
          setor_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_baixa?: string | null
          data_entrada?: string | null
          id?: string
          observacoes?: string | null
          op_id: string
          operador?: string | null
          setor_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_baixa?: string | null
          data_entrada?: string | null
          id?: string
          observacoes?: string | null
          op_id?: string
          operador?: string | null
          setor_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "setor_rastreamento_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: false
            referencedRelation: "ops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "setor_rastreamento_setor_id_fkey"
            columns: ["setor_id"]
            isOneToOne: false
            referencedRelation: "setores_produtivos"
            referencedColumns: ["id"]
          },
        ]
      }
      setores_produtivos: {
        Row: {
          ativo: boolean
          created_at: string
          dias_uteis_manual: boolean
          dias_uteis_mensais: number
          eficiencia: number
          fator_eficiencia_setorial: number | null
          horas_turno: number
          id: string
          mao_de_obra: number
          maquinas_automaticas: number
          nome: string
          ordem: number
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          dias_uteis_manual?: boolean
          dias_uteis_mensais?: number
          eficiencia?: number
          fator_eficiencia_setorial?: number | null
          horas_turno?: number
          id?: string
          mao_de_obra?: number
          maquinas_automaticas?: number
          nome: string
          ordem?: number
        }
        Update: {
          ativo?: boolean
          created_at?: string
          dias_uteis_manual?: boolean
          dias_uteis_mensais?: number
          eficiencia?: number
          fator_eficiencia_setorial?: number | null
          horas_turno?: number
          id?: string
          mao_de_obra?: number
          maquinas_automaticas?: number
          nome?: string
          ordem?: number
        }
        Relationships: []
      }
      transacoes: {
        Row: {
          categoria: string
          created_at: string
          data_emissao: string
          data_vencimento: string
          descricao: string
          id: string
          status: string
          tipo: string
          updated_at: string
          valor: number
        }
        Insert: {
          categoria?: string
          created_at?: string
          data_emissao?: string
          data_vencimento?: string
          descricao?: string
          id?: string
          status?: string
          tipo?: string
          updated_at?: string
          valor?: number
        }
        Update: {
          categoria?: string
          created_at?: string
          data_emissao?: string
          data_vencimento?: string
          descricao?: string
          id?: string
          status?: string
          tipo?: string
          updated_at?: string
          valor?: number
        }
        Relationships: []
      }
      vendedores: {
        Row: {
          ativo: boolean
          comissao_percentual: number
          created_at: string
          email: string | null
          id: string
          loja_id: string | null
          meta_mensal: number
          nome: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          comissao_percentual?: number
          created_at?: string
          email?: string | null
          id?: string
          loja_id?: string | null
          meta_mensal?: number
          nome: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          comissao_percentual?: number
          created_at?: string
          email?: string | null
          id?: string
          loja_id?: string | null
          meta_mensal?: number
          nome?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendedores_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      gerar_numero_familia: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
