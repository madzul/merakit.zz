// Tipe database TypeScript untuk MERAKIT (Tahap 7).
// Dibuat manual agar selaras dengan database-schema.sql. Jika nanti memakai
// Supabase CLI, file ini bisa digantikan hasil `supabase gen types typescript`.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRoleEnum = "admin" | "anggota";
export type MemberStatusEnum = "aktif" | "nonaktif";
export type ProductionStatusEnum = "diajukan" | "diproses" | "selesai" | "dibatalkan";
export type OrderStatusEnum = "Menunggu" | "Diproses" | "Selesai" | "Dibatalkan";
export type TransactionTypeEnum = "pemasukan" | "pengeluaran";
export type DiscountTypeEnum = "persen" | "nominal";
export type PromoStatusEnum = "aktif" | "nonaktif" | "kedaluwarsa";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: UserRoleEnum;
          avatar_initial: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          role?: UserRoleEnum;
          avatar_initial?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      members: {
        Row: {
          id: string;
          profile_id: string | null;
          name: string;
          phone: string;
          avatar: string | null;
          disability_description: string | null;
          monthly_production: number;
          status: MemberStatusEnum;
          joined_at: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id?: string | null;
          name: string;
          phone: string;
          avatar?: string | null;
          disability_description?: string | null;
          monthly_production?: number;
          status?: MemberStatusEnum;
          joined_at?: string;
          notes?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["members"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "members_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          id: string;
          name: string;
          category: string;
          description: string | null;
          price: number;
          stock: number;
          image_url: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category: string;
          description?: string | null;
          price?: number;
          stock?: number;
          image_url?: string | null;
          is_active?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
        Relationships: [];
      };
      production_records: {
        Row: {
          id: string;
          member_id: string;
          product_id: string | null;
          production_date: string;
          quantity: number;
          duration: number;
          status: ProductionStatusEnum;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          member_id: string;
          product_id?: string | null;
          production_date?: string;
          quantity: number;
          duration?: number;
          status?: ProductionStatusEnum;
          notes?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["production_records"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "production_records_member_id_fkey";
            columns: ["member_id"];
            isOneToOne: false;
            referencedRelation: "members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "production_records_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          id: string;
          order_date: string;
          customer_name: string;
          customer_phone: string;
          product_id: string | null;
          quantity: number;
          unit_price: number;
          total_amount: number;
          status: OrderStatusEnum;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_date?: string;
          customer_name: string;
          customer_phone: string;
          product_id?: string | null;
          quantity: number;
          unit_price: number;
          total_amount: number;
          status?: OrderStatusEnum;
          notes?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "orders_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      expenses: {
        Row: {
          id: string;
          description: string;
          category: string;
          amount: number;
          type: TransactionTypeEnum;
          date: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          description: string;
          category: string;
          amount: number;
          type: TransactionTypeEnum;
          date?: string;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["expenses"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "expenses_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      promotions: {
        Row: {
          id: string;
          code: string;
          description: string | null;
          discount_type: DiscountTypeEnum;
          discount_value: number;
          valid_until: string | null;
          status: PromoStatusEnum;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          description?: string | null;
          discount_type: DiscountTypeEnum;
          discount_value: number;
          valid_until?: string | null;
          status?: PromoStatusEnum;
        };
        Update: Partial<Database["public"]["Tables"]["promotions"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      current_member_id: { Args: Record<string, never>; Returns: string | null };
    };
    Enums: {
      user_role: UserRoleEnum;
      member_status: MemberStatusEnum;
      production_status: ProductionStatusEnum;
      order_status: OrderStatusEnum;
      transaction_type: TransactionTypeEnum;
      discount_type: DiscountTypeEnum;
      promo_status: PromoStatusEnum;
    };
    CompositeTypes: Record<string, never>;
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
