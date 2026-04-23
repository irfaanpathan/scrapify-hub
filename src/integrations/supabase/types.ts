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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      category_images: {
        Row: {
          category: Database["public"]["Enums"]["scrap_category"]
          created_at: string
          id: string
          image_url: string
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["scrap_category"]
          created_at?: string
          id?: string
          image_url: string
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["scrap_category"]
          created_at?: string
          id?: string
          image_url?: string
          updated_at?: string
        }
        Relationships: []
      }
      home_banners: {
        Row: {
          created_at: string
          id: string
          image_url: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      order_images: {
        Row: {
          created_at: string
          id: string
          image_url: string
          order_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          order_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_images_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          actual_weight: number | null
          category: string
          created_at: string
          estimated_weight: number | null
          final_price: number | null
          id: string
          notes: string | null
          order_id: string
          price_per_kg: number
          sub_category: string
        }
        Insert: {
          actual_weight?: number | null
          category: string
          created_at?: string
          estimated_weight?: number | null
          final_price?: number | null
          id?: string
          notes?: string | null
          order_id: string
          price_per_kg: number
          sub_category: string
        }
        Update: {
          actual_weight?: number | null
          category?: string
          created_at?: string
          estimated_weight?: number | null
          final_price?: number | null
          id?: string
          notes?: string | null
          order_id?: string
          price_per_kg?: number
          sub_category?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          actual_weight: number | null
          category: Database["public"]["Enums"]["scrap_category"]
          created_at: string
          customer_id: string
          estimated_weight: number | null
          final_price: number | null
          id: string
          notes: string | null
          partner_id: string | null
          pickup_address: string
          pickup_latitude: number | null
          pickup_longitude: number | null
          pickup_time: string
          status: Database["public"]["Enums"]["order_status"]
          sub_category: string | null
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          actual_weight?: number | null
          category: Database["public"]["Enums"]["scrap_category"]
          created_at?: string
          customer_id: string
          estimated_weight?: number | null
          final_price?: number | null
          id?: string
          notes?: string | null
          partner_id?: string | null
          pickup_address: string
          pickup_latitude?: number | null
          pickup_longitude?: number | null
          pickup_time: string
          status?: Database["public"]["Enums"]["order_status"]
          sub_category?: string | null
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          actual_weight?: number | null
          category?: Database["public"]["Enums"]["scrap_category"]
          created_at?: string
          customer_id?: string
          estimated_weight?: number | null
          final_price?: number | null
          id?: string
          notes?: string | null
          partner_id?: string | null
          pickup_address?: string
          pickup_latitude?: number | null
          pickup_longitude?: number | null
          pickup_time?: string
          status?: Database["public"]["Enums"]["order_status"]
          sub_category?: string | null
          total_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_details: {
        Row: {
          average_rating: number | null
          created_at: string
          current_latitude: number | null
          current_longitude: number | null
          id: string
          is_available: boolean | null
          license_number: string | null
          service_areas: string[] | null
          total_pickups: number | null
          total_ratings: number | null
          updated_at: string
          user_id: string
          vehicle_number: string | null
          vehicle_type: string | null
        }
        Insert: {
          average_rating?: number | null
          created_at?: string
          current_latitude?: number | null
          current_longitude?: number | null
          id?: string
          is_available?: boolean | null
          license_number?: string | null
          service_areas?: string[] | null
          total_pickups?: number | null
          total_ratings?: number | null
          updated_at?: string
          user_id: string
          vehicle_number?: string | null
          vehicle_type?: string | null
        }
        Update: {
          average_rating?: number | null
          created_at?: string
          current_latitude?: number | null
          current_longitude?: number | null
          id?: string
          is_available?: boolean | null
          license_number?: string | null
          service_areas?: string[] | null
          total_pickups?: number | null
          total_ratings?: number | null
          updated_at?: string
          user_id?: string
          vehicle_number?: string | null
          vehicle_type?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          customer_id: string
          id: string
          notes: string | null
          order_id: string
          payment_date: string | null
          payment_method: string
          payment_status: string
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          customer_id: string
          id?: string
          notes?: string | null
          order_id: string
          payment_date?: string | null
          payment_method?: string
          payment_status?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          customer_id?: string
          id?: string
          notes?: string | null
          order_id?: string
          payment_date?: string | null
          payment_method?: string
          payment_status?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          customer_id: string
          id: string
          order_id: string
          partner_id: string | null
          partner_response: string | null
          rating: number
          updated_at: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          customer_id: string
          id?: string
          order_id: string
          partner_id?: string | null
          partner_response?: string | null
          rating: number
          updated_at?: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          order_id?: string
          partner_id?: string | null
          partner_response?: string | null
          rating?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_addresses: {
        Row: {
          address_line1: string
          address_line2: string | null
          city: string
          created_at: string
          id: string
          is_default: boolean | null
          label: string
          landmark: string | null
          latitude: number | null
          longitude: number | null
          pincode: string
          state: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address_line1: string
          address_line2?: string | null
          city: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          label?: string
          landmark?: string | null
          latitude?: number | null
          longitude?: number | null
          pincode: string
          state: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          city?: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          label?: string
          landmark?: string | null
          latitude?: number | null
          longitude?: number | null
          pincode?: string
          state?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scrap_prices: {
        Row: {
          category: Database["public"]["Enums"]["scrap_category"]
          id: string
          price_per_kg: number
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["scrap_category"]
          id?: string
          price_per_kg: number
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["scrap_category"]
          id?: string
          price_per_kg?: number
          updated_at?: string
        }
        Relationships: []
      }
      sub_categories: {
        Row: {
          category: Database["public"]["Enums"]["scrap_category"]
          created_at: string
          id: string
          name: string
          price_per_kg: number
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["scrap_category"]
          created_at?: string
          id?: string
          name: string
          price_per_kg: number
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["scrap_category"]
          created_at?: string
          id?: string
          name?: string
          price_per_kg?: number
          updated_at?: string
        }
        Relationships: []
      }
      subcategory_images: {
        Row: {
          created_at: string
          id: string
          image_url: string
          sub_category_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          sub_category_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          sub_category_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subcategory_images_sub_category_id_fkey"
            columns: ["sub_category_id"]
            isOneToOne: true
            referencedRelation: "sub_categories"
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
      app_role: "customer" | "partner" | "admin"
      order_status:
        | "pending"
        | "assigned"
        | "picked"
        | "weighed"
        | "paid"
        | "completed"
      scrap_category: "paper" | "plastic" | "metal" | "ewaste" | "others"
      user_role: "customer" | "partner" | "admin"
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
      app_role: ["customer", "partner", "admin"],
      order_status: [
        "pending",
        "assigned",
        "picked",
        "weighed",
        "paid",
        "completed",
      ],
      scrap_category: ["paper", "plastic", "metal", "ewaste", "others"],
      user_role: ["customer", "partner", "admin"],
    },
  },
} as const
