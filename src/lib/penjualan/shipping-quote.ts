import "server-only";
import { isServiceRoleConfigured } from "@/lib/supabase/admin";
import { getActiveProducts } from "@/lib/supabase/repositories/products-repository";
import { getShippingZones } from "@/lib/supabase/repositories/online-sales-repository";
import { billableKg, detectShippingZone, itemWeight, shippingCostFor } from "@/lib/penjualan/shipping";
import {
  liveShippingConfigured,
  normalizePostalCode,
  postalCodeFromAddress,
  quoteLiveShipping,
  type LiveProvider,
} from "@/lib/penjualan/shipping-providers";

/**
 * Ongkir pesanan — port dari services/transactions/shippingQuote.js IOM-ITB:
 *  1. Tarif live (RajaOngkir / AgenWebsite bergiliran) bila kode pos ada.
 *  2. Tabel zona (shipping_zones) dari teks alamat bila API tidak
 *     dikonfigurasi atau gagal.
 * Angka final selalu disimpan lewat create_online_sale; tarif live hanya
 * diterima database dari service role, jadi fitur ini butuh
 * SUPABASE_SERVICE_ROLE_KEY.
 */

export interface OrderShippingQuote {
  provider: LiveProvider | "table";
  /** "RajaOngkir" / "AgenWebsite"; null untuk tabel zona. */
  providerLabel: string | null;
  /** Layanan kurir (live), mis. "J&T Express EZ". */
  service: string | null;
  etd: string | null;
  cost: number;
  billedKg: number;
  weightGrams: number;
  /** Tempat tujuan yang dikenali, mis. "Kota Surabaya" / "Kode pos 60264". */
  matchedPlace: string;
  /** Tabel zona saja. */
  zone: string | null;
  zoneLabel: string | null;
  baseCost: number | null;
  extraPerKg: number | null;
  byNearest: boolean;
  postalCode: string | null;
}

export function isLiveShippingEnabled(): boolean {
  return liveShippingConfigured() && isServiceRoleConfigured();
}

/** Perkiraan total berat (gram) dari data produk aktif — produk tidak dikenal diabaikan. */
async function estimateOrderWeight(items: { productId: string; quantity: number }[]): Promise<number | null> {
  const products = await getActiveProducts().catch(() => null);
  if (!products) return null;
  const byId = new Map(products.map((product) => [product.id, product]));
  return items.reduce((sum, item) => {
    const product = byId.get(item.productId);
    return product ? sum + itemWeight(product.weightGrams) * item.quantity : sum;
  }, 0);
}

export async function quoteOrderShipping(
  destination: { address: string; postalCode?: string | null },
  items: { productId: string; quantity: number }[]
): Promise<OrderShippingQuote | null> {
  const weightGrams = await estimateOrderWeight(items);
  if (weightGrams === null) return null;
  const billedKg = billableKg(weightGrams);
  const postalCode = normalizePostalCode(destination.postalCode) || postalCodeFromAddress(destination.address);

  if (postalCode && isLiveShippingEnabled()) {
    const live = await quoteLiveShipping(postalCode, billedKg);
    if (live) {
      return {
        provider: live.provider,
        providerLabel: live.providerLabel,
        service: `${live.courierName} ${live.service}`.trim(),
        etd: live.etd,
        cost: Math.round(live.cost),
        billedKg,
        weightGrams,
        matchedPlace: live.destinationLabel || `Kode pos ${postalCode}`,
        zone: null,
        zoneLabel: null,
        baseCost: null,
        extraPerKg: null,
        byNearest: false,
        postalCode,
      };
    }
  }

  const match = detectShippingZone(destination.address);
  if (!match) return null;
  const zones = await getShippingZones(true).catch(() => []);
  const zone = zones.find((z) => z.id === match.zone);
  if (!zone) return null;
  return {
    provider: "table",
    providerLabel: null,
    service: null,
    etd: null,
    cost: shippingCostFor(zone, weightGrams).cost,
    billedKg,
    weightGrams,
    matchedPlace: match.matchedPlace,
    zone: zone.id,
    zoneLabel: zone.label,
    baseCost: zone.cost,
    extraPerKg: zone.extraPerKg,
    byNearest: match.byNearest,
    postalCode,
  };
}
