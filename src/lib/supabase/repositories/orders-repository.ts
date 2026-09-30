import { createClient } from "@/lib/supabase/server";
import type { Order, OrderStatus } from "@/lib/types";
import type { Tables } from "@/lib/supabase/database.types";

type OrderRow = Tables<"orders"> & {
  products: { name: string } | null;
  promotions: { code: string } | null;
};

const SELECT_WITH_RELATIONS = "*, products(name), promotions(code)";

function mapOrder(row: OrderRow): Order {
  return {
    id: row.id,
    orderDate: row.order_date,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    productId: row.product_id,
    productName: row.products?.name ?? "-",
    quantity: row.quantity,
    unitPrice: Number(row.unit_price),
    totalAmount: Number(row.total_amount),
    status: row.status,
    notes: row.notes ?? "",
    source: row.source ?? "Langsung",
    promotionId: row.promotion_id ?? null,
    promotionCode: row.promotions?.code ?? "",
    discountAmount: Number(row.discount_amount ?? 0),
  };
}

export interface OrderInput {
  orderDate: string;
  customerName: string;
  customerPhone: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  status: OrderStatus;
  notes: string;
  source: string;
  promotionId: string | null;
  /** Sudah dihitung & divalidasi server action (lib/promo/logic.ts). */
  discountAmount: number;
}

function toRow(input: OrderInput) {
  const subtotal = input.unitPrice * input.quantity;
  return {
    order_date: input.orderDate,
    customer_name: input.customerName,
    customer_phone: input.customerPhone,
    product_id: input.productId,
    quantity: input.quantity,
    unit_price: input.unitPrice,
    // Total dihitung di server, bukan dipercaya dari input form.
    total_amount: subtotal - input.discountAmount,
    status: input.status,
    notes: input.notes,
    source: input.source,
    promotion_id: input.promotionId,
    discount_amount: input.discountAmount,
  };
}

/** Admin: kelola semua. Anggota: hanya baca (read-only, ditegakkan RLS). */
export async function getOrders(): Promise<Order[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(SELECT_WITH_RELATIONS)
    .order("order_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => mapOrder(row as OrderRow));
}

/** Pesanan dalam rentang tanggal (inklusif) — dipakai dashboard, keuangan, pemasaran. */
export async function getOrdersBetween(from: string, to: string): Promise<Order[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(SELECT_WITH_RELATIONS)
    .gte("order_date", from)
    .lte("order_date", to)
    .order("order_date", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => mapOrder(row as OrderRow));
}

export async function getOrderById(id: string): Promise<Order | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("orders").select(SELECT_WITH_RELATIONS).eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? mapOrder(data as OrderRow) : null;
}

/** Hanya admin — ditegakkan RLS. */
export async function createOrder(input: OrderInput): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("orders").insert(toRow(input));
  if (error) throw error;
}

/** Hanya admin — ditegakkan RLS. */
export async function updateOrder(id: string, input: OrderInput): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("orders").update(toRow(input)).eq("id", id);
  if (error) throw error;
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("orders").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function deleteOrder(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("orders").delete().eq("id", id);
  if (error) throw error;
}
