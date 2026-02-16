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
          created_at: string
          current_sector: string | null
          data_nf: string | null
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
          status_faturamento: string
          status_producao: string
          tempo_total: number | null
          tempo_unitario: number
          total_ops_at_generation: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_sector?: string | null
          data_nf?: string | null
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
          status_faturamento?: string
          status_producao?: string
          tempo_total?: number | null
          tempo_unitario?: number
          total_ops_at_generation?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_sector?: string | null
          data_nf?: string | null
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
          status_faturamento?: string
          status_producao?: string
          tempo_total?: number | null
          tempo_unitario?: number
          total_ops_at_generation?: number | null
          updated_at?: string
        }
        Relationships: [
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
      pedidos: {
        Row: {
          canal: string
          cliente: string
          codigo: string
          created_at: string
          data_aprovacao: string | null
          data_entrada: string
          data_expedicao: string | null
          data_faturamento: string | null
          data_nf: string | null
          id: string
          margem: number
          nota_fiscal: string | null
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
        }
        Insert: {
          canal?: string
          cliente: string
          codigo: string
          created_at?: string
          data_aprovacao?: string | null
          data_entrada?: string
          data_expedicao?: string | null
          data_faturamento?: string | null
          data_nf?: string | null
          id?: string
          margem?: number
          nota_fiscal?: string | null
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
        }
        Update: {
          canal?: string
          cliente?: string
          codigo?: string
          created_at?: string
          data_aprovacao?: string | null
          data_entrada?: string
          data_expedicao?: string | null
          data_faturamento?: string | null
          data_nf?: string | null
          id?: string
          margem?: number
          nota_fiscal?: string | null
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
        }
        Relationships: []
      }
      produtos: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          id: string
          nome: string
          tempo_unitario: number
          unidade: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          tempo_unitario?: number
          unidade?: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          tempo_unitario?: number
          unidade?: string
          updated_at?: string
        }
        Relationships: []
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
          id: string
          nome: string
          ordem: number
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome: string
          ordem?: number
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
          ordem?: number
        }
        Relationships: []
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
