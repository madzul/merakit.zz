import { createClient } from "@/lib/supabase/server";
import type { Order, OrderStatus } from "@/lib/types";
import type { Tables } from "@/lib/supabase/database.types";

type OrderRow = Tables<"orders"> & { products: { name: string } | null };

function mapOrder(row: OrderRow): Order {
  return {
    id: row.id,
    orderDate: row.order_date,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    productName: row.products?.name ?? "-",
    quantity: row.quantity,
    unitPrice: Number(row.unit_price),
    totalAmount: Number(row.total_amount),
    status: row.status,
    notes: row.notes ?? "",
  };
}

/** Admin: kelola semua. Anggota: hanya baca (read-only, ditegakkan RLS). */
export async function getOrders(): Promise<Order[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*, products(name)")
    .order("order_date", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => mapOrder(row as OrderRow));
}

/** Hanya admin — ditegakkan RLS. */
export async function createOrder(input: {
  orderDate: string;
  customerName: string;
  customerPhone: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  notes: string;
}): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("orders").insert({
    order_date: input.orderDate,
    customer_name: input.customerName,
    customer_phone: input.customerPhone,
    product_id: input.productId,
    quantity: input.quantity,
    unit_price: input.unitPrice,
    total_amount: input.unitPrice * input.quantity,
    notes: input.notes,
  });
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
