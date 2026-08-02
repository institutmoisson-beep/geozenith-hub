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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          created_at: string
          geofence_id: string | null
          id: string
          is_read: boolean
          message: string
          severity: string
          type: string
          user_id: string
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string
          geofence_id?: string | null
          id?: string
          is_read?: boolean
          message: string
          severity?: string
          type: string
          user_id: string
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string
          geofence_id?: string | null
          id?: string
          is_read?: boolean
          message?: string
          severity?: string
          type?: string
          user_id?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alerts_geofence_id_fkey"
            columns: ["geofence_id"]
            isOneToOne: false
            referencedRelation: "geofences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      geofences: {
        Row: {
          center_lat: number
          center_lng: number
          color: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          radius_m: number
          trigger_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          center_lat: number
          center_lng: number
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          radius_m?: number
          trigger_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          center_lat?: number
          center_lng?: number
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          radius_m?: number
          trigger_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      integration_settings: {
        Row: {
          alert_speed_kmh: number
          traccar_token: string | null
          traccar_url: string | null
          traccar_username: string | null
          updated_at: string
          user_id: string
          whatsapp_enabled: boolean
          whatsapp_number: string | null
        }
        Insert: {
          alert_speed_kmh?: number
          traccar_token?: string | null
          traccar_url?: string | null
          traccar_username?: string | null
          updated_at?: string
          user_id: string
          whatsapp_enabled?: boolean
          whatsapp_number?: string | null
        }
        Update: {
          alert_speed_kmh?: number
          traccar_token?: string | null
          traccar_url?: string | null
          traccar_username?: string | null
          updated_at?: string
          user_id?: string
          whatsapp_enabled?: boolean
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount_fcfa: number
          id: string
          issued_at: string
          number: string
          period_end: string
          period_start: string
          plan: string
          status: string
          user_id: string
        }
        Insert: {
          amount_fcfa?: number
          id?: string
          issued_at?: string
          number: string
          period_end?: string
          period_start?: string
          plan?: string
          status?: string
          user_id: string
        }
        Update: {
          amount_fcfa?: number
          id?: string
          issued_at?: string
          number?: string
          period_end?: string
          period_start?: string
          plan?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      positions: {
        Row: {
          address: string | null
          course: number
          id: string
          lat: number
          lng: number
          recorded_at: string
          speed: number
          user_id: string
          vehicle_id: string
        }
        Insert: {
          address?: string | null
          course?: number
          id?: string
          lat: number
          lng: number
          recorded_at?: string
          speed?: number
          user_id: string
          vehicle_id: string
        }
        Update: {
          address?: string | null
          course?: number
          id?: string
          lat?: number
          lng?: number
          recorded_at?: string
          speed?: number
          user_id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "positions_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          whatsapp_number: string | null
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
          whatsapp_number?: string | null
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          id: string
          plan: string
          price_fcfa: number
          renews_at: string
          started_at: string
          status: string
          updated_at: string
          user_id: string
          vehicle_limit: number
        }
        Insert: {
          created_at?: string
          id?: string
          plan?: string
          price_fcfa?: number
          renews_at?: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
          vehicle_limit?: number
        }
        Update: {
          created_at?: string
          id?: string
          plan?: string
          price_fcfa?: number
          renews_at?: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
          vehicle_limit?: number
        }
        Relationships: []
      }
      trips: {
        Row: {
          avg_speed: number
          created_at: string
          distance_km: number
          duration_min: number
          end_address: string | null
          ended_at: string | null
          id: string
          max_speed: number
          start_address: string | null
          started_at: string
          user_id: string
          vehicle_id: string
        }
        Insert: {
          avg_speed?: number
          created_at?: string
          distance_km?: number
          duration_min?: number
          end_address?: string | null
          ended_at?: string | null
          id?: string
          max_speed?: number
          start_address?: string | null
          started_at: string
          user_id: string
          vehicle_id: string
        }
        Update: {
          avg_speed?: number
          created_at?: string
          distance_km?: number
          duration_min?: number
          end_address?: string | null
          ended_at?: string | null
          id?: string
          max_speed?: number
          start_address?: string | null
          started_at?: string
          user_id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trips_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          category: string
          created_at: string
          driver_name: string | null
          driver_phone: string | null
          fuel_level: number | null
          id: string
          last_course: number | null
          last_lat: number | null
          last_lng: number | null
          last_speed: number | null
          last_update: string | null
          name: string
          notes: string | null
          odometer_km: number
          plate: string | null
          status: string
          traccar_device_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          driver_name?: string | null
          driver_phone?: string | null
          fuel_level?: number | null
          id?: string
          last_course?: number | null
          last_lat?: number | null
          last_lng?: number | null
          last_speed?: number | null
          last_update?: string | null
          name: string
          notes?: string | null
          odometer_km?: number
          plate?: string | null
          status?: string
          traccar_device_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          driver_name?: string | null
          driver_phone?: string | null
          fuel_level?: number | null
          id?: string
          last_course?: number | null
          last_lat?: number | null
          last_lng?: number | null
          last_speed?: number | null
          last_update?: string | null
          name?: string
          notes?: string | null
          odometer_km?: number
          plate?: string | null
          status?: string
          traccar_device_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "user"
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
    Enums: {
      app_role: ["admin", "manager", "user"],
    },
  },
} as const
