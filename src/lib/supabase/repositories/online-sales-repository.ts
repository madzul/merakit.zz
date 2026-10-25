import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json, Tables } from "@/lib/supabase/database.types";
import type {
  OnlinePaymentStatus,
  OnlineSale,
  OnlineSaleStatus,
  PublicOnlineSale,
  SaleNotificationLog,
  ShippingZone,
} from "@/lib/types";

type SaleRow = Tables<"online_sales"> & {
  orders: {
    id: string;
    product_id: string | null;
    quantity: number;
    unit_price: number;
    total_amount: number;
    created_at: string;
    products: { name: string; image_url: string | null } | null;
  }[];
};

const SELECT_WITH_ITEMS =
  "*, orders(id, product_id, quantity, unit_price, total_amount, created_at, products(name, image_url))";

function mapSale(row: SaleRow): OnlineSale {
  return {
    id: row.id,
    code: row.code,
    createdAt: row.created_at,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerEmail: row.customer_email,
    deliveryMethod: row.delivery_method,
    address: row.address,
    shippingZoneLabel: row.shipping_zone_label,
    shippingCost: Number(row.shipping_cost),
    shippingWeightGrams: row.shipping_weight_grams ?? null,
    shippingBilledKg: row.shipping_billed_kg ?? null,
    shippingProvider: row.shipping_provider ?? null,
    shippingService: row.shipping_service ?? null,
    shippingPostalCode: row.shipping_postal_code ?? null,
    shippingEtd: row.shipping_etd ?? null,
    subtotal: Number(row.subtotal),
    totalAmount: Number(row.total_amount),
    notes: row.notes,
    paymentStatus: row.payment_status,
    paymentProofPath: row.payment_proof_path,
    paymentProofUploadedAt: row.payment_proof_uploaded_at,
    paymentNote: row.payment_note,
    paidAt: row.paid_at,
    status: row.status,
    courier: row.courier,
    trackingNumber: row.tracking_number,
    publicToken: row.public_token,
    paymentMethod: row.payment_method ?? "manual",
    midtransOrderId: row.midtrans_order_id ?? null,
    midtransPaymentType: row.midtrans_payment_type ?? null,
    midtransStatus: row.midtrans_status ?? null,
    items: [...(row.orders ?? [])]
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map((order) => ({
        orderId: order.id,
        productId: order.product_id,
        productName: order.products?.name ?? "Produk dihapus",
        imageUrl: order.products?.image_url ?? null,
        quantity: order.quantity,
        unitPrice: Number(order.unit_price),
        totalAmount: Number(order.total_amount),
      })),
  };
}

/** Khusus admin (RLS online_sales_select_admin). */
export async function getOnlineSales(): Promise<OnlineSale[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("online_sales")
    .select(SELECT_WITH_ITEMS)
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data ?? []).map((row) => mapSale(row as unknown as SaleRow));
}

export async function getOnlineSaleById(id: string): Promise<OnlineSale | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("online_sales").select(SELECT_WITH_ITEMS).eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? mapSale(data as unknown as SaleRow) : null;
}

/** Jumlah penjualan yang perlu ditindaklanjuti admin (untuk penanda di menu). */
export async function countSalesNeedingAction(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("online_sales")
    .select("id", { count: "exact", head: true })
    .or("payment_status.eq.menunggu_verifikasi,status.eq.Baru")
    .neq("status", "Dibatalkan");
  if (error) throw error;
  return count ?? 0;
}

export async function updateOnlineSale(
  id: string,
  patch: {
    paymentStatus?: OnlinePaymentStatus;
    paymentNote?: string | null;
    paidAt?: string | null;
    status?: OnlineSaleStatus;
    courier?: string | null;
    trackingNumber?: string | null;
  }
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("online_sales")
    .update({
      ...(patch.paymentStatus !== undefined && { payment_status: patch.paymentStatus }),
      ...(patch.paymentNote !== undefined && { payment_note: patch.paymentNote }),
      ...(patch.paidAt !== undefined && { paid_at: patch.paidAt }),
      ...(patch.status !== undefined && { status: patch.status }),
      ...(patch.courier !== undefined && { courier: patch.courier }),
      ...(patch.trackingNumber !== undefined && { tracking_number: patch.trackingNumber }),
    })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteOnlineSale(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("online_sales").delete().eq("id", id);
  if (error) throw error;
}

/** Tautan sementara (10 menit) untuk melihat bukti bayar di bucket privat. */
export async function getPaymentProofUrl(path: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from("payment-proofs").createSignedUrl(path, 600);
  if (error) return null;
  return data.signedUrl;
}

// ---------- Tarif ongkir ----------

export async function getShippingZones(activeOnly = false): Promise<ShippingZone[]> {
  const supabase = await createClient();
  let query = supabase.from("shipping_zones").select("*").order("sort_order").order("label");
  if (activeOnly) query = query.eq("is_active", true);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    label: row.label,
    cost: Number(row.cost),
    // Sebelum migrasi ongkir berat: tarif per kg berikutnya = tarif 1 kg pertama.
    extraPerKg: Number(row.extra_per_kg ?? row.cost),
    isActive: row.is_active,
    sortOrder: row.sort_order,
  }));
}

export async function updateShippingZone(id: string, cost: number, extraPerKg: number, isActive: boolean): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("shipping_zones").update({ cost, extra_per_kg: extraPerKg, is_active: isActive }).eq("id", id);
  if (error) throw error;
}

// ---------- Publik (tanpa login, lewat fungsi SECURITY DEFINER) ----------

export interface CheckoutInput {
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  deliveryMethod: "kirim" | "ambil";
  address: string | null;
  shippingZone: string | null;
  notes: string | null;
  items: { productId: string; quantity: number }[];
  postalCode?: string | null;
  /** Tarif live kurir dari server (RajaOngkir/AgenWebsite). */
  liveShipping?: { provider: string; service: string | null; cost: number; etd: string | null; billedKg: number } | null;
}

/** Melempar Error berisi pesan dari database (sudah berbahasa Indonesia) bila ditolak. */
export async function createOnlineSale(input: CheckoutInput): Promise<{ code: string; publicToken: string }> {
  // Tarif live hanya diterima database dari service role (lihat migration-ongkir-live.sql).
  const admin = input.liveShipping ? createAdminClient() : null;
  if (input.liveShipping && !admin) throw new Error("SUPABASE_SERVICE_ROLE_KEY belum diisi");
  const supabase = admin ?? (await createClient());
  const { data, error } = await supabase.rpc("create_online_sale", {
    p_customer_name: input.customerName,
    p_customer_phone: input.customerPhone,
    p_customer_email: input.customerEmail,
    p_delivery_method: input.deliveryMethod,
    p_address: input.address,
    p_shipping_zone: input.shippingZone,
    p_notes: input.notes,
    p_items: input.items.map((item) => ({ product_id: item.productId, quantity: item.quantity })) as unknown as Json,
    // Dikirim hanya bila ada, agar tetap jalan sebelum migration-ongkir-live.sql.
    ...(input.postalCode && { p_postal_code: input.postalCode }),
    ...(input.liveShipping && {
      p_live_shipping: {
        provider: input.liveShipping.provider,
        service: input.liveShipping.service,
        cost: input.liveShipping.cost,
        etd: input.liveShipping.etd,
        billed_kg: input.liveShipping.billedKg,
      } as unknown as Json,
    }),
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : null;
  if (!row) throw new Error("Pesanan gagal dibuat.");
  return { code: row.code, publicToken: row.public_token };
}

interface PublicSaleJson {
  code: string;
  created_at: string;
  customer_name: string;
  customer_phone_masked: string;
  delivery_method: "kirim" | "ambil";
  address: string | null;
  shipping_zone_label: string | null;
  shipping_cost: number;
  shipping_weight_grams?: number | null;
  shipping_billed_kg?: number | null;
  shipping_service?: string | null;
  shipping_postal_code?: string | null;
  shipping_etd?: string | null;
  subtotal: number;
  total_amount: number;
  notes: string | null;
  payment_status: OnlinePaymentStatus;
  payment_note: string | null;
  has_payment_proof: boolean;
  paid_at: string | null;
  status: OnlineSaleStatus;
  courier: string | null;
  tracking_number: string | null;
  payment_method?: "manual" | "midtrans";
  payment_type?: string | null;
  online_payment_pending?: boolean;
  items: {
    product_id: string | null;
    product_name: string;
    image_url: string | null;
    quantity: number;
    unit_price: number;
    total_amount: number;
  }[];
}

export async function getPublicOnlineSale(token: string): Promise<PublicOnlineSale | null> {
  if (!/^[0-9a-f]{64}$/.test(token)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_online_sale", { p_token: token });
  if (error) throw error;
  if (!data) return null;
  const row = data as unknown as PublicSaleJson;
  return {
    code: row.code,
    createdAt: row.created_at,
    customerName: row.customer_name,
    customerPhoneMasked: row.customer_phone_masked,
    deliveryMethod: row.delivery_method,
    address: row.address,
    shippingZoneLabel: row.shipping_zone_label,
    shippingCost: Number(row.shipping_cost),
    shippingWeightGrams: row.shipping_weight_grams ?? null,
    shippingBilledKg: row.shipping_billed_kg ?? null,
    shippingService: row.shipping_service ?? null,
    shippingPostalCode: row.shipping_postal_code ?? null,
    shippingEtd: row.shipping_etd ?? null,
    subtotal: Number(row.subtotal),
    totalAmount: Number(row.total_amount),
    notes: row.notes,
    paymentStatus: row.payment_status,
    paymentNote: row.payment_note,
    hasPaymentProof: row.has_payment_proof,
    paidAt: row.paid_at,
    status: row.status,
    courier: row.courier,
    trackingNumber: row.tracking_number,
    paymentMethod: row.payment_method ?? "manual",
    paymentType: row.payment_type ?? null,
    onlinePaymentPending: Boolean(row.online_payment_pending),
    items: (row.items ?? []).map((item) => ({
      productId: item.product_id,
      productName: item.product_name,
      imageUrl: item.image_url,
      quantity: item.quantity,
      unitPrice: Number(item.unit_price),
      totalAmount: Number(item.total_amount),
    })),
  };
}

export async function findOnlineSaleToken(code: string, phone: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("find_online_sale_token", { p_code: code, p_phone: phone });
  if (error) throw error;
  return data ?? null;
}

export async function attachPaymentProof(token: string, path: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("attach_payment_proof", { p_token: token, p_path: path });
  if (error) throw error;
}

/** Riwayat notifikasi email/WhatsApp sebuah penjualan (khusus admin). */
export async function getSaleNotifications(saleId: string): Promise<SaleNotificationLog[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sale_notifications")
    .select("*")
    .eq("sale_id", saleId)
    .order("created_at", { ascending: true });
  if (error) return [];
  return (data ?? []).map((row) => ({
    eventKey: row.event_key,
    channel: row.channel,
    recipient: row.recipient,
    status: row.status,
    error: row.error,
    createdAt: row.created_at,
  }));
}
