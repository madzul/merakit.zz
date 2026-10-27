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
export type MaterialMovementTypeEnum = "masuk" | "keluar" | "penyesuaian";
export type ProductStockMovementTypeEnum = "masuk" | "keluar" | "penyesuaian";
export type LeftoverStatusEnum = "disimpan" | "dimanfaatkan" | "dibuang";
export type OnlinePaymentStatusEnum = "belum_bayar" | "menunggu_verifikasi" | "lunas" | "ditolak";
export type OnlineSaleStatusEnum = "Baru" | "Diproses" | "Dikirim" | "Selesai" | "Dibatalkan";
export type DeliveryMethodEnum = "kirim" | "ambil";

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
          show_inclusive_badge: boolean;
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
          show_inclusive_badge?: boolean;
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
          // migration-ongkir-berat.sql
          weight_grams: number | null;
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
          weight_grams?: number | null;
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
          reject_quantity: number;
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
          reject_quantity?: number;
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
          // migration-promo-pemasaran.sql
          source: string;
          promotion_id: string | null;
          discount_amount: number;
          // migration-penjualan-online.sql
          sale_id: string | null;
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
          source?: string;
          promotion_id?: string | null;
          discount_amount?: number;
          sale_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "orders_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },          {
            foreignKeyName: "orders_promotion_id_fkey";
            columns: ["promotion_id"];
            isOneToOne: false;
            referencedRelation: "promotions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_sale_id_fkey";
            columns: ["sale_id"];
            isOneToOne: false;
            referencedRelation: "online_sales";
            referencedColumns: ["id"];
          },
        ];
      };
      // migration-penjualan-online.sql
      online_sales: {
        Row: {
          id: string;
          code: string;
          public_token: string;
          customer_name: string;
          customer_phone: string;
          customer_email: string | null;
          delivery_method: DeliveryMethodEnum;
          address: string | null;
          shipping_zone: string | null;
          shipping_zone_label: string | null;
          shipping_cost: number;
          subtotal: number;
          total_amount: number;
          notes: string | null;
          payment_status: OnlinePaymentStatusEnum;
          payment_proof_path: string | null;
          payment_proof_uploaded_at: string | null;
          payment_note: string | null;
          paid_at: string | null;
          status: OnlineSaleStatusEnum;
          courier: string | null;
          tracking_number: string | null;
          created_at: string;
          updated_at: string;
          // migration-pembayaran-notifikasi.sql
          payment_method: "manual" | "midtrans";
          midtrans_order_id: string | null;
          midtrans_snap_token: string | null;
          midtrans_snap_expires_at: string | null;
          midtrans_transaction_id: string | null;
          midtrans_payment_type: string | null;
          midtrans_status: string | null;
          // migration-ongkir-berat.sql
          shipping_weight_grams: number | null;
          shipping_billed_kg: number | null;
          // migration-ongkir-live.sql
          shipping_provider: string | null;
          shipping_service: string | null;
          shipping_postal_code: string | null;
          shipping_etd: string | null;
        };
        // Baris baru hanya lewat fungsi create_online_sale().
        Insert: never;
        Update: {
          payment_status?: OnlinePaymentStatusEnum;
          payment_note?: string | null;
          paid_at?: string | null;
          status?: OnlineSaleStatusEnum;
          courier?: string | null;
          tracking_number?: string | null;
          notes?: string | null;
          payment_method?: "manual" | "midtrans";
          midtrans_order_id?: string | null;
          midtrans_snap_token?: string | null;
          midtrans_snap_expires_at?: string | null;
          midtrans_transaction_id?: string | null;
          midtrans_payment_type?: string | null;
          midtrans_status?: string | null;
        };
        Relationships: [];
      };
      // migration-pembayaran-notifikasi.sql (ditulis server dengan service role)
      payment_events: {
        Row: {
          id: number;
          source: string;
          order_id: string | null;
          sale_id: string | null;
          transaction_status: string | null;
          payload: Json | null;
          signature_valid: boolean | null;
          processed: boolean;
          error: string | null;
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          source: string;
          order_id?: string | null;
          sale_id?: string | null;
          transaction_status?: string | null;
          payload?: Json | null;
          signature_valid?: boolean | null;
          processed?: boolean;
          error?: string | null;
          ip_address?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["payment_events"]["Insert"]>;
        Relationships: [];
      };
      sale_notifications: {
        Row: {
          id: number;
          sale_id: string;
          event_key: string;
          channel: "email" | "whatsapp" | "admin_email" | "admin_whatsapp";
          recipient: string | null;
          status: "pending" | "sent" | "failed" | "skipped";
          error: string | null;
          created_at: string;
          sent_at: string | null;
        };
        Insert: {
          sale_id: string;
          event_key: string;
          channel: "email" | "whatsapp" | "admin_email" | "admin_whatsapp";
          recipient?: string | null;
          status?: "pending" | "sent" | "failed" | "skipped";
          error?: string | null;
          sent_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["sale_notifications"]["Insert"]>;
        Relationships: [];
      };
      shipping_zones: {
        Row: {
          id: string;
          label: string;
          cost: number;
          extra_per_kg: number;
          is_active: boolean;
          sort_order: number;
        };
        Insert: never;
        Update: {
          cost?: number;
          extra_per_kg?: number;
          is_active?: boolean;
        };
        Relationships: [];
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
      // ---- migration-bahan-baku.sql ----
      materials: {
        Row: {
          id: string;
          name: string;
          unit: string;
          stock: number;
          min_stock: number;
          unit_cost: number;
          notes: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          unit?: string;
          min_stock?: number;
          unit_cost?: number;
          notes?: string | null;
          is_active?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["materials"]["Insert"]>;
        Relationships: [];
      };
      product_stock_movements: {
        Row: {
          id: string;
          product_id: string;
          type: ProductStockMovementTypeEnum;
          quantity: number;
          movement_date: string;
          production_record_id: string | null;
          order_id: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          type: ProductStockMovementTypeEnum;
          quantity: number;
          movement_date?: string;
          notes?: string | null;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["product_stock_movements"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "product_stock_movements_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_stock_movements_production_record_id_fkey";
            columns: ["production_record_id"];
            isOneToOne: true;
            referencedRelation: "production_records";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_stock_movements_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: true;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      material_leftovers: {
        Row: {
          id: string;
          material_id: string | null;
          quantity: number;
          unit: string;
          leftover_date: string;
          status: LeftoverStatusEnum;
          notes: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          material_id?: string | null;
          quantity: number;
          unit?: string;
          leftover_date?: string;
          status?: LeftoverStatusEnum;
          notes?: string | null;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["material_leftovers"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "material_leftovers_material_id_fkey";
            columns: ["material_id"];
            isOneToOne: false;
            referencedRelation: "materials";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "material_leftovers_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      material_movements: {
        Row: {
          id: string;
          material_id: string;
          type: MaterialMovementTypeEnum;
          quantity: number;
          unit_cost: number | null;
          movement_date: string;
          production_record_id: string | null;
          expense_id: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          material_id: string;
          type: MaterialMovementTypeEnum;
          quantity: number;
          unit_cost?: number | null;
          movement_date?: string;
          expense_id?: string | null;
          notes?: string | null;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["material_movements"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "material_movements_material_id_fkey";
            columns: ["material_id"];
            isOneToOne: false;
            referencedRelation: "materials";
            referencedColumns: ["id"];
          },
        ];
      };
      product_materials: {
        Row: {
          product_id: string;
          material_id: string;
          quantity_per_unit: number;
        };
        Insert: {
          product_id: string;
          material_id: string;
          quantity_per_unit: number;
        };
        Update: Partial<Database["public"]["Tables"]["product_materials"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "product_materials_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_materials_material_id_fkey";
            columns: ["material_id"];
            isOneToOne: false;
            referencedRelation: "materials";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      set_product_stock: {
        Args: { target_product_id: string; target_stock: number; note?: string | null };
        Returns: number;
      };
      current_member_id: { Args: Record<string, never>; Returns: string | null };
      // migration-penjualan-online.sql
      create_online_sale: {
        Args: {
          p_customer_name: string;
          p_customer_phone: string;
          p_customer_email: string | null;
          p_delivery_method: DeliveryMethodEnum;
          p_address: string | null;
          p_shipping_zone: string | null;
          p_notes: string | null;
          p_items: Json;
          // migration-ongkir-live.sql
          p_postal_code?: string | null;
          /** Hanya diterima dari service role. */
          p_live_shipping?: Json | null;
        };
        Returns: { code: string; public_token: string }[];
      };
      get_online_sale: { Args: { p_token: string }; Returns: Json | null };
      find_online_sale_token: { Args: { p_code: string; p_phone: string }; Returns: string | null };
      attach_payment_proof: { Args: { p_token: string; p_path: string }; Returns: undefined };
    };
    Enums: {
      user_role: UserRoleEnum;
      member_status: MemberStatusEnum;
      production_status: ProductionStatusEnum;
      order_status: OrderStatusEnum;
      transaction_type: TransactionTypeEnum;
      discount_type: DiscountTypeEnum;
      promo_status: PromoStatusEnum;
      material_movement_type: MaterialMovementTypeEnum;
      online_payment_status: OnlinePaymentStatusEnum;
      online_sale_status: OnlineSaleStatusEnum;
      delivery_method: DeliveryMethodEnum;
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
