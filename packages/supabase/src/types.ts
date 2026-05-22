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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      entries: {
        Row: {
          analysis_status: string
          body: string
          created_at: string
          id: string
          mood_primary: string | null
          mood_secondary: string | null
          raw_analysis: Json | null
          themes: string[]
          user_id: string
        }
        Insert: {
          analysis_status?: string
          body: string
          created_at?: string
          id?: string
          mood_primary?: string | null
          mood_secondary?: string | null
          raw_analysis?: Json | null
          themes?: string[]
          user_id: string
        }
        Update: {
          analysis_status?: string
          body?: string
          created_at?: string
          id?: string
          mood_primary?: string | null
          mood_secondary?: string | null
          raw_analysis?: Json | null
          themes?: string[]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      entry_theme_counts: {
        Row: {
          count: number
          theme: string
          user_id: string
        }
        Insert: {
          count?: number
          theme: string
          user_id: string
        }
        Update: {
          count?: number
          theme?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entry_theme_counts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      garden_configs: {
        Row: {
          garden_grid_size: string
          greenhouse_capacity: number
          id: string
          tier: string
          user_id: string
        }
        Insert: {
          garden_grid_size?: string
          greenhouse_capacity?: number
          id?: string
          tier?: string
          user_id: string
        }
        Update: {
          garden_grid_size?: string
          greenhouse_capacity?: number
          id?: string
          tier?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "garden_configs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      plants: {
        Row: {
          bloomed_at: string | null
          color_primary: string
          color_secondary: string
          garden_position_x: number | null
          garden_position_y: number | null
          growth_stage: number
          id: string
          is_radiant: boolean
          is_rare: boolean
          last_watered_at: string | null
          location: string
          planted_at: string
          seed_id: string
          species: string
          user_id: string
          watering_count: number
        }
        Insert: {
          bloomed_at?: string | null
          color_primary: string
          color_secondary: string
          garden_position_x?: number | null
          garden_position_y?: number | null
          growth_stage?: number
          id?: string
          is_radiant?: boolean
          is_rare?: boolean
          last_watered_at?: string | null
          location?: string
          planted_at?: string
          seed_id: string
          species: string
          user_id: string
          watering_count?: number
        }
        Update: {
          bloomed_at?: string | null
          color_primary?: string
          color_secondary?: string
          garden_position_x?: number | null
          garden_position_y?: number | null
          growth_stage?: number
          id?: string
          is_radiant?: boolean
          is_rare?: boolean
          last_watered_at?: string | null
          location?: string
          planted_at?: string
          seed_id?: string
          species?: string
          user_id?: string
          watering_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "plants_seed_id_fkey"
            columns: ["seed_id"]
            isOneToOne: false
            referencedRelation: "seeds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          last_entry_date: string | null
          streak_count: number
        }
        Insert: {
          created_at?: string
          id: string
          last_entry_date?: string | null
          streak_count?: number
        }
        Update: {
          created_at?: string
          id?: string
          last_entry_date?: string | null
          streak_count?: number
        }
        Relationships: []
      }
      seed_milestones: {
        Row: {
          earned_at: string
          id: string
          milestone_type: string
          theme: string | null
          user_id: string
        }
        Insert: {
          earned_at?: string
          id?: string
          milestone_type: string
          theme?: string | null
          user_id: string
        }
        Update: {
          earned_at?: string
          id?: string
          milestone_type?: string
          theme?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seed_milestones_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      seeds: {
        Row: {
          color_primary: string
          color_secondary: string
          created_at: string
          entry_id: string | null
          id: string
          is_rare: boolean
          location: string
          plant_species: string
          user_id: string
        }
        Insert: {
          color_primary: string
          color_secondary: string
          created_at?: string
          entry_id?: string | null
          id?: string
          is_rare?: boolean
          location?: string
          plant_species: string
          user_id: string
        }
        Update: {
          color_primary?: string
          color_secondary?: string
          created_at?: string
          entry_id?: string | null
          id?: string
          is_rare?: boolean
          location?: string
          plant_species?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seeds_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seeds_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      streak_logs: {
        Row: {
          date: string
          id: string
          user_id: string
        }
        Insert: {
          date: string
          id?: string
          user_id: string
        }
        Update: {
          date?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "streak_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
