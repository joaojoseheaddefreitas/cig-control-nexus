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
      op_fracoes: {
        Row: {
          created_at: string
          dimensoes: string | null
          id: string
          medidas: string | null
          modelo: string
          numero_fracao: number
          observacoes: string | null
          op_mae_id: string
          quantidade_tecnica: number
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dimensoes?: string | null
          id?: string
          medidas?: string | null
          modelo?: string
          numero_fracao: number
          observacoes?: string | null
          op_mae_id: string
          quantidade_tecnica?: number
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          dimensoes?: string | null
          id?: string
          medidas?: string | null
          modelo?: string
          numero_fracao?: number
          observacoes?: string | null
          op_mae_id?: string
          quantidade_tecnica?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "op_fracoes_op_mae_id_fkey"
            columns: ["op_mae_id"]
            isOneToOne: false
            referencedRelation: "op_maes"
            referencedColumns: ["id"]
          },
        ]
      }
      op_maes: {
        Row: {
          created_at: string
          desenho_url: string | null
          id: string
          numero_op: string
          observacoes_especiais: string | null
          pedido_id: string
          status: string
          total_fracoes: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          desenho_url?: string | null
          id?: string
          numero_op: string
          observacoes_especiais?: string | null
          pedido_id: string
          status?: string
          total_fracoes?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          desenho_url?: string | null
          id?: string
          numero_op?: string
          observacoes_especiais?: string | null
          pedido_id?: string
          status?: string
          total_fracoes?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "op_maes_pedido_id_fkey"
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
          data_entrada: string
          data_expedicao: string | null
          data_faturamento: string | null
          id: string
          margem: number
          nota_fiscal: string | null
          op: string | null
          origem_dado: string
          prazo_entrega: string | null
          produto: string
          quantidade: number
          status: string
          updated_at: string
          valor_total: number
        }
        Insert: {
          canal?: string
          cliente: string
          codigo: string
          created_at?: string
          data_entrada?: string
          data_expedicao?: string | null
          data_faturamento?: string | null
          id?: string
          margem?: number
          nota_fiscal?: string | null
          op?: string | null
          origem_dado?: string
          prazo_entrega?: string | null
          produto: string
          quantidade?: number
          status?: string
          updated_at?: string
          valor_total?: number
        }
        Update: {
          canal?: string
          cliente?: string
          codigo?: string
          created_at?: string
          data_entrada?: string
          data_expedicao?: string | null
          data_faturamento?: string | null
          id?: string
          margem?: number
          nota_fiscal?: string | null
          op?: string | null
          origem_dado?: string
          prazo_entrega?: string | null
          produto?: string
          quantidade?: number
          status?: string
          updated_at?: string
          valor_total?: number
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
          op_fracao_id: string
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
          op_fracao_id: string
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
          op_fracao_id?: string
          operador?: string | null
          setor_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "setor_rastreamento_op_fracao_id_fkey"
            columns: ["op_fracao_id"]
            isOneToOne: false
            referencedRelation: "op_fracoes"
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
      [_ in never]: never
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
