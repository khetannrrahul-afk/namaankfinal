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
      admins: {
        Row: {
          company_name: string
          created_at: string
          email: string
          id: string
          is_active: boolean
          is_approved: boolean
          mobile: string
          updated_at: string
          username: string
          whatsapp: string
        }
        Insert: {
          company_name?: string
          created_at?: string
          email?: string
          id: string
          is_active?: boolean
          is_approved?: boolean
          mobile?: string
          updated_at?: string
          username: string
          whatsapp?: string
        }
        Update: {
          company_name?: string
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          is_approved?: boolean
          mobile?: string
          updated_at?: string
          username?: string
          whatsapp?: string
        }
        Relationships: [
          {
            foreignKeyName: "admins_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_reports: {
        Row: {
          birth_time: string | null
          created_at: string
          direction: string
          dob: string
          focus: string
          id: string
          name: string
          place: string
          segments: Json
          submission_id: string | null
          user_id: string
        }
        Insert: {
          birth_time?: string | null
          created_at?: string
          direction: string
          dob: string
          focus: string
          id?: string
          name: string
          place: string
          segments: Json
          submission_id?: string | null
          user_id: string
        }
        Update: {
          birth_time?: string | null
          created_at?: string
          direction?: string
          dob?: string
          focus?: string
          id?: string
          name?: string
          place?: string
          segments?: Json
          submission_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_reports_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "namaank_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          is_public: boolean
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          is_public?: boolean
          key: string
          updated_at?: string
          value?: string
        }
        Update: {
          is_public?: boolean
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string
          created_at: string
          delivered_to_telegram: boolean
          id: string
          recipient_id: string
          sender_id: string
        }
        Insert: {
          body: string
          created_at?: string
          delivered_to_telegram?: boolean
          id?: string
          recipient_id: string
          sender_id: string
        }
        Update: {
          body?: string
          created_at?: string
          delivered_to_telegram?: boolean
          id?: string
          recipient_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      namaank_submissions: {
        Row: {
          birth_time: string
          created_at: string
          dob: string
          email: string
          gender: string
          id: string
          identity_key: string
          is_active: boolean
          lang: string
          lat: number | null
          lon: number | null
          mobile: string
          name: string
          place: string
          sub_admin_id: string | null
          timezone: string
          user_id: string | null
        }
        Insert: {
          birth_time?: string
          created_at?: string
          dob?: string
          email?: string
          gender?: string
          id?: string
          identity_key?: string
          is_active?: boolean
          lang?: string
          lat?: number | null
          lon?: number | null
          mobile?: string
          name?: string
          place?: string
          sub_admin_id?: string | null
          timezone?: string
          user_id?: string | null
        }
        Update: {
          birth_time?: string
          created_at?: string
          dob?: string
          email?: string
          gender?: string
          id?: string
          identity_key?: string
          is_active?: boolean
          lang?: string
          lat?: number | null
          lon?: number | null
          mobile?: string
          name?: string
          place?: string
          sub_admin_id?: string | null
          timezone?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "namaank_submissions_sub_admin_id_fkey"
            columns: ["sub_admin_id"]
            isOneToOne: false
            referencedRelation: "sub_admins"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          is_read: boolean
          kind: string
          recipient_id: string
          title: string
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          is_read?: boolean
          kind?: string
          recipient_id: string
          title?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_read?: boolean
          kind?: string
          recipient_id?: string
          title?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          email: string | null
          gateway: string
          id: string
          meta: Json
          mobile: string | null
          name: string | null
          order_id: string | null
          payment_id: string | null
          purpose: string
          status: string
          sub_admin_id: string | null
          user_id: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          currency?: string
          email?: string | null
          gateway?: string
          id?: string
          meta?: Json
          mobile?: string | null
          name?: string | null
          order_id?: string | null
          payment_id?: string | null
          purpose?: string
          status?: string
          sub_admin_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          email?: string | null
          gateway?: string
          id?: string
          meta?: Json
          mobile?: string | null
          name?: string | null
          order_id?: string | null
          payment_id?: string | null
          purpose?: string
          status?: string
          sub_admin_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_sub_admin_id_fkey"
            columns: ["sub_admin_id"]
            isOneToOne: false
            referencedRelation: "sub_admins"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          city: string
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          mobile: string
          referral_code: string | null
          referred_by: string | null
        }
        Insert: {
          city?: string
          created_at?: string
          email?: string
          full_name?: string
          id: string
          is_active?: boolean
          mobile?: string
          referral_code?: string | null
          referred_by?: string | null
        }
        Update: {
          city?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          mobile?: string
          referral_code?: string | null
          referred_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      report_access: {
        Row: {
          full_unlocked: boolean
          full_unlocked_at: string | null
          payment_id: string | null
          short_unlocked: boolean
          short_unlocked_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          full_unlocked?: boolean
          full_unlocked_at?: string | null
          payment_id?: string | null
          short_unlocked?: boolean
          short_unlocked_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          full_unlocked?: boolean
          full_unlocked_at?: string | null
          payment_id?: string | null
          short_unlocked?: boolean
          short_unlocked_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      social_actions: {
        Row: {
          action: string
          created_at: string
          id: string
          sub_admin_id: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          sub_admin_id?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          sub_admin_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_actions_sub_admin_id_fkey"
            columns: ["sub_admin_id"]
            isOneToOne: false
            referencedRelation: "sub_admins"
            referencedColumns: ["id"]
          },
        ]
      }
      sub_admin_bots: {
        Row: {
          bot_token: string
          bot_username: string
          is_enabled: boolean
          sub_admin_chat_id: string | null
          sub_admin_id: string
          super_admin_chat_id: string | null
          updated_at: string
        }
        Insert: {
          bot_token?: string
          bot_username?: string
          is_enabled?: boolean
          sub_admin_chat_id?: string | null
          sub_admin_id: string
          super_admin_chat_id?: string | null
          updated_at?: string
        }
        Update: {
          bot_token?: string
          bot_username?: string
          is_enabled?: boolean
          sub_admin_chat_id?: string | null
          sub_admin_id?: string
          super_admin_chat_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sub_admin_bots_sub_admin_id_fkey"
            columns: ["sub_admin_id"]
            isOneToOne: true
            referencedRelation: "sub_admins"
            referencedColumns: ["id"]
          },
        ]
      }
      sub_admins: {
        Row: {
          admin_id: string | null
          created_at: string
          email: string
          facebook_url: string
          full_report_price_inr: number
          id: string
          instagram_url: string
          is_active: boolean
          location: string
          mobile: string
          name: string
          require_facebook: boolean
          require_instagram: boolean
          require_share: boolean
          service_type: string
          telegram_bot_link: string
          username: string
          whatsapp: string
        }
        Insert: {
          admin_id?: string | null
          created_at?: string
          email?: string
          facebook_url?: string
          full_report_price_inr?: number
          id: string
          instagram_url?: string
          is_active?: boolean
          location?: string
          mobile?: string
          name?: string
          require_facebook?: boolean
          require_instagram?: boolean
          require_share?: boolean
          service_type?: string
          telegram_bot_link?: string
          username: string
          whatsapp?: string
        }
        Update: {
          admin_id?: string | null
          created_at?: string
          email?: string
          facebook_url?: string
          full_report_price_inr?: number
          id?: string
          instagram_url?: string
          is_active?: boolean
          location?: string
          mobile?: string
          name?: string
          require_facebook?: boolean
          require_instagram?: boolean
          require_share?: boolean
          service_type?: string
          telegram_bot_link?: string
          username?: string
          whatsapp?: string
        }
        Relationships: [
          {
            foreignKeyName: "sub_admins_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sub_admins_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_configs: {
        Row: {
          access_token: string
          id: string
          is_enabled: boolean
          phone_number_id: string
          updated_at: string
        }
        Insert: {
          access_token?: string
          id?: string
          is_enabled?: boolean
          phone_number_id?: string
          updated_at?: string
        }
        Update: {
          access_token?: string
          id?: string
          is_enabled?: boolean
          phone_number_id?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_any_account: { Args: never; Returns: boolean }
      username_available: { Args: { _username: string }; Returns: boolean }
      validate_admin_code: {
        Args: { _code: string }
        Returns: {
          admin_id: string
          company_name: string
        }[]
      }
      validate_referral_code: {
        Args: { _code: string }
        Returns: {
          sub_admin_id: string
          sub_admin_name: string
        }[]
      }
    }
    Enums: {
      app_role: "super_admin" | "sub_admin" | "admin" | "user"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["super_admin", "sub_admin", "admin", "user"],
    },
  },
} as const
