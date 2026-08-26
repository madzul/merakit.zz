import { ORDER_LIST } from "@/lib/mock-data";
import type { Order, OrderStatus } from "@/lib/types";

/**
 * Store data dummy in-memory untuk modul Data Pesanan (tahap 6).
 *
 * Catatan: ini BUKAN state management global/backend sungguhan — hanya array
 * bertingkat modul (module-level) yang menyalin `ORDER_LIST` sebagai seed
 * awal, agar tambah/ubah/hapus data terasa nyata selama satu sesi pengguna
 * tanpa perlu Supabase atau API eksternal. Data akan kembali ke seed awal
 * setiap kali aplikasi di-reload penuh.
 */
let orders: Order[] = [...ORDER_LIST];
let nextId = orders.length + 1;

export function getOrders(): Order[] {
  return orders;
}

export function getOrderById(id: string): Order | undefined {
  return orders.find((order) => order.id === id);
}

export function addOrder(input: Omit<Order, "id">): Order {
  const newOrder: Order = { ...input, id: `psn-${nextId++}` };
  orders = [newOrder, ...orders];
  return newOrder;
}

export function updateOrder(id: string, input: Omit<Order, "id">): Order | undefined {
  let updated: Order | undefined;
  orders = orders.map((order) => {
    if (order.id !== id) return order;
    updated = { ...input, id };
    return updated;
  });
  return updated;
}

export function updateOrderStatus(id: string, status: OrderStatus): Order | undefined {
  let updated: Order | undefined;
  orders = orders.map((order) => {
    if (order.id !== id) return order;
    updated = { ...order, status };
    return updated;
  });
  return updated;
}

export function deleteOrder(id: string): void {
  orders = orders.filter((order) => order.id !== id);
}
