import "server-only";

/**
 * Tarif ongkir live dari API gratis RajaOngkir (Komerce) dan AgenWebsite —
 * port dari utils/shippingProviders.js IOM-ITB. Dipakai bergiliran
 * (round-robin) agar kuota harian gratis keduanya terbagi:
 *   - RajaOngkir Starter: ±100 hit/hari (cari tujuan + hitung = 2 hit; id
 *     tujuan per kode pos di-cache sehingga berikutnya cukup 1 hit).
 *   - AgenWebsite Free: 150 request/hari, 20/menit.
 * Provider yang gagal (timeout, kuota habis, tujuan tidak ditemukan)
 * dilewati ke provider berikutnya. Bila semua gagal, pemanggil memakai tabel
 * zona (shipping_zones).
 *
 * Tujuan & asal memakai KODE POS. Berat yang dikirim = kg ditagih × 1000
 * sehingga harga konsisten dengan "N kg" yang ditampilkan.
 *
 * Env server (nilai rahasia tidak pernah di-log):
 *   RAJAONGKIR_API_KEY, AGENWEBSITE_API_KEY  provider tanpa key dilewati
 *   SHIPPING_ORIGIN_POSTAL_CODE              bawaan 40275 (Binong, Batununggal, Bandung)
 *   SHIPPING_COURIERS                        bawaan "jnt"; pisahkan dengan koma
 *   RAJAONGKIR_ORIGIN_ID                     opsional, lewati pencarian asal
 *
 * Cache tarif ada di memori proses (per instance serverless di Vercel) —
 * sama dengan IOM; cukup untuk meredam pratinjau berulang saat pembeli mengetik.
 */

// *_BASE_URL hanya untuk pengujian (server tiruan); biarkan kosong.
const RAJAONGKIR_BASE_URL = () => process.env.RAJAONGKIR_BASE_URL || "https://rajaongkir.komerce.id/api/v1";
const AGENWEBSITE_BASE_URL = () => process.env.AGENWEBSITE_BASE_URL || "https://api.agenwebsite.com/v1";
const REQUEST_TIMEOUT_MS = 8000;
const QUOTE_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const QUOTE_CACHE_MAX = 500;
const DESTINATION_CACHE_MAX = 2000;
const POSTAL_CODE_PATTERN = /^\d{5}$/;
// Layanan kargo/trucking punya minimal berat & alur drop-off berbeda.
const EXCLUDED_SERVICE_PATTERN = /cargo|kargo|trucking|jtr/i;

export type LiveProvider = "rajaongkir" | "agenwebsite";

export interface LiveRate {
  provider: LiveProvider;
  providerLabel: string;
  courierName: string;
  service: string;
  cost: number;
  etd: string | null;
  destinationLabel: string | null;
}

class ProviderError extends Error {
  constructor(
    public provider: string,
    public code: string,
    message?: string
  ) {
    super(message || code);
  }
}

const originPostalCode = () => String(process.env.SHIPPING_ORIGIN_POSTAL_CODE || "40275").trim();

const couriers = () =>
  String(process.env.SHIPPING_COURIERS || "jnt")
    .split(",")
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean);

export function normalizePostalCode(value: unknown): string | null {
  const code = String(value ?? "").trim();
  return POSTAL_CODE_PATTERN.test(code) ? code : null;
}

/** Kode pos 5 digit terakhir yang disebut di teks alamat. */
export function postalCodeFromAddress(address: string | null | undefined): string | null {
  const matches = String(address || "").match(/\b\d{5}\b/g);
  return matches ? matches[matches.length - 1] : null;
}

async function requestJson(provider: string, url: string, options: RequestInit): Promise<Record<string, unknown> | null> {
  let response: Response;
  try {
    response = await fetch(url, { ...options, cache: "no-store", signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  } catch (error) {
    throw new ProviderError(provider, error instanceof Error && error.name === "TimeoutError" ? "timeout" : "network_error");
  }
  const body = (await response.json().catch(() => null)) as Record<string, unknown> | null;
  if (!response.ok) {
    const err = body?.error as { code?: string } | undefined;
    const meta = body?.meta as { message?: string } | undefined;
    throw new ProviderError(provider, String(err?.code || meta?.message || `http_${response.status}`).slice(0, 120));
  }
  return body;
}

interface RawRate {
  courierName: string;
  service: string;
  cost: number;
  etd: string | null;
}

function pickCheapest(provider: string, rates: RawRate[]): RawRate {
  const usable = rates.filter((r) => Number(r.cost) > 0 && !EXCLUDED_SERVICE_PATTERN.test(`${r.courierName} ${r.service}`));
  if (!usable.length) throw new ProviderError(provider, "no_rates");
  return usable.reduce((best, r) => (Number(r.cost) < Number(best.cost) ? r : best));
}

// ---------- RajaOngkir (Komerce) ----------

const rajaOngkirDestinations = new Map<string, { id: string | number; label: string | null }>();

const rajaOngkirHeaders = () => ({ key: process.env.RAJAONGKIR_API_KEY ?? "" });

async function rajaOngkirDestination(postalCode: string) {
  const cached = rajaOngkirDestinations.get(postalCode);
  if (cached) return cached;
  const url = `${RAJAONGKIR_BASE_URL()}/destination/domestic-destination?search=${encodeURIComponent(postalCode)}&limit=50&offset=0`;
  const body = await requestJson("rajaongkir", url, { headers: rajaOngkirHeaders() });
  const list = Array.isArray(body?.data) ? (body!.data as { id: string | number; label?: string; zip_code?: string }[]) : [];
  const match = list.find((d) => String(d.zip_code || "").trim() === postalCode);
  if (!match) throw new ProviderError("rajaongkir", "destination_not_found");
  const destination = { id: match.id, label: match.label || null };
  if (rajaOngkirDestinations.size >= DESTINATION_CACHE_MAX) rajaOngkirDestinations.clear();
  rajaOngkirDestinations.set(postalCode, destination);
  return destination;
}

const rajaOngkir = {
  name: "rajaongkir" as const,
  label: "RajaOngkir",
  configured: () => Boolean(process.env.RAJAONGKIR_API_KEY),
  async quote(postalCode: string, weightGrams: number) {
    const originId = process.env.RAJAONGKIR_ORIGIN_ID || (await rajaOngkirDestination(originPostalCode())).id;
    const destination = await rajaOngkirDestination(postalCode);
    const form = new URLSearchParams({
      origin: String(originId),
      destination: String(destination.id),
      weight: String(weightGrams),
      courier: couriers().join(":"),
      price: "lowest",
    });
    const body = await requestJson("rajaongkir", `${RAJAONGKIR_BASE_URL()}/calculate/domestic-cost`, {
      method: "POST",
      headers: { ...rajaOngkirHeaders(), "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });
    const list = Array.isArray(body?.data) ? (body!.data as { name?: string; code?: string; service?: string; cost: number; etd?: string }[]) : [];
    const rates = list.map((r) => ({
      courierName: r.name || String(r.code || "").toUpperCase(),
      service: r.service || "",
      cost: Number(r.cost),
      etd: r.etd || null,
    }));
    return { ...pickCheapest("rajaongkir", rates), destinationLabel: destination.label };
  },
};

// ---------- AgenWebsite ----------

const agenWebsite = {
  name: "agenwebsite" as const,
  label: "AgenWebsite",
  configured: () => Boolean(process.env.AGENWEBSITE_API_KEY),
  async quote(postalCode: string, weightGrams: number) {
    const body = await requestJson("agenwebsite", `${AGENWEBSITE_BASE_URL()}/rates`, {
      method: "POST",
      headers: { "x-api-key": process.env.AGENWEBSITE_API_KEY ?? "", "Content-Type": "application/json" },
      body: JSON.stringify({
        shipper: { zipcode: originPostalCode() },
        destination: { zipcode: postalCode },
        weight: weightGrams,
        couriers: couriers(),
        sort: "cheapest",
      }),
    });
    const data = body?.data as { rates?: { courier_name?: string; courier_code?: string; service_name?: string; service_code?: string; cost: number; etd_text?: string }[] } | undefined;
    const rates = (Array.isArray(data?.rates) ? data!.rates! : []).map((r) => ({
      courierName: r.courier_name || String(r.courier_code || "").toUpperCase(),
      service: r.service_name || r.service_code || "",
      // `cost` = tarif kurir; discounted_cost hanya berlaku bila kirim lewat AgenWebsite.
      cost: Number(r.cost),
      etd: r.etd_text || null,
    }));
    return { ...pickCheapest("agenwebsite", rates), destinationLabel: null };
  },
};

// ---------- Round-robin + cache ----------

const PROVIDERS = [rajaOngkir, agenWebsite];
let nextProvider = 0;
const quoteCache = new Map<string, { expiresAt: number; quote: LiveRate }>();

export function liveShippingConfigured(): boolean {
  return PROVIDERS.some((p) => p.configured());
}

/** Tarif live termurah untuk kode pos tujuan & kg ditagih, atau null bila tidak dikonfigurasi/semua gagal. */
export async function quoteLiveShipping(postalCode: string, billedKg: number): Promise<LiveRate | null> {
  const configured = PROVIDERS.filter((p) => p.configured());
  if (!configured.length || !normalizePostalCode(postalCode)) return null;

  const key = `${postalCode}:${billedKg}`;
  const cached = quoteCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.quote;

  const start = nextProvider % configured.length;
  nextProvider = (nextProvider + 1) % configured.length;
  for (let i = 0; i < configured.length; i += 1) {
    const provider = configured[(start + i) % configured.length];
    try {
      const rate = await provider.quote(postalCode, billedKg * 1000);
      const quote: LiveRate = { provider: provider.name, providerLabel: provider.label, ...rate };
      if (quoteCache.size >= QUOTE_CACHE_MAX) quoteCache.delete(quoteCache.keys().next().value!);
      quoteCache.set(key, { expiresAt: Date.now() + QUOTE_CACHE_TTL_MS, quote });
      return quote;
    } catch (error) {
      const code = error instanceof ProviderError ? error.code : error instanceof Error ? error.message : "error";
      console.warn(`[ongkir] ${provider.name} gagal untuk ${postalCode}/${billedKg}kg: ${code}`);
    }
  }
  return null;
}
