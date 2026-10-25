"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Banknote, CreditCard, LoaderCircle, MapPin, Minus, Plus, Store, Trash2, Truck } from "lucide-react";
import { ProductImage } from "@/components/produk/product-image";
import { EmptyState } from "@/components/empty-state";
import {
  cartCount,
  clearCart,
  refreshCart,
  removeFromCart,
  setCartQuantity,
  useCart,
} from "@/lib/penjualan/cart-store";
import { checkoutAction, getCartProductsAction, quoteShippingAction } from "@/lib/penjualan/public-actions";
import type { OrderShippingQuote } from "@/lib/penjualan/shipping-quote";
import { detectShippingZone, formatKg, itemWeight, shippingCostFor, WEIGHT_TOLERANCE_GRAMS } from "@/lib/penjualan/shipping";
import { MAX_LINE_QUANTITY } from "@/lib/penjualan/constants";
import { cn, formatRupiah } from "@/lib/utils";
import type { ShippingZone } from "@/lib/types";

interface CheckoutClientProps {
  zones: ShippingZone[];
  /** Midtrans aktif → pembeli bisa memilih bayar online. */
  onlinePaymentEnabled?: boolean;
  /** Notifikasi otomatis aktif → beri tahu pembeli konfirmasi dikirim ke WA/email. */
  notificationsEnabled?: boolean;
  /** Tarif live kurir (RajaOngkir/AgenWebsite) aktif → ongkir dihitung server dari kode pos. */
  liveShippingEnabled?: boolean;
}

interface QuoteView {
  live: boolean;
  cost: number;
  billedKg: number;
  matchedPlace: string;
  /** Wilayah tarif (tabel) atau layanan kurir (live). */
  label: string | null;
  etd: string | null;
  byNearest: boolean;
  baseCost: number | null;
  extraPerKg: number | null;
}

const noopSubscribe = () => () => {};

const inputClass =
  "mt-1 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-800 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40";

/** Keranjang + form pembeli + ringkasan ongkir → buat penjualan online. */
export function CheckoutClient({
  zones,
  onlinePaymentEnabled = false,
  notificationsEnabled = false,
  liveShippingEnabled = false,
}: CheckoutClientProps) {
  const router = useRouter();
  const items = useCart();
  // false saat render server & hidrasi awal (keranjang di localStorage belum terbaca).
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const [refreshDone, setRefreshDone] = useState(false);
  const [refreshNotice, setRefreshNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    deliveryMethod: "kirim" as "kirim" | "ambil",
    postalCode: "",
    address: "",
    notes: "",
  });
  const refreshedOnce = useRef(false);
  const [paymentChoice, setPaymentChoice] = useState<"online" | "manual">(onlinePaymentEnabled ? "online" : "manual");

  // Segarkan harga & ketersediaan produk sekali saat halaman dibuka.
  useEffect(() => {
    if (!hydrated || refreshedOnce.current) return;
    refreshedOnce.current = true;
    const snapshot = items;
    if (snapshot.length === 0) return;
    getCartProductsAction(snapshot.map((item) => item.productId))
      .then((fresh) => {
        if (!fresh) return;
        const freshById = new Map(fresh.map((product) => [product.id, product]));
        const removed = snapshot.filter((item) => !freshById.has(item.productId));
        const repriced = snapshot.filter((item) => freshById.has(item.productId) && freshById.get(item.productId)!.price !== item.price);
        refreshCart(fresh);
        if (removed.length > 0) {
          setRefreshNotice(`${removed.map((item) => item.name).join(", ")} sudah tidak tersedia dan dikeluarkan dari keranjang.`);
        } else if (repriced.length > 0) {
          setRefreshNotice("Harga beberapa produk telah diperbarui.");
        }
      })
      .catch(() => null)
      .finally(() => setRefreshDone(true));
  }, [hydrated, items]);
  const refreshing = items.length > 0 && !refreshDone;

  const zoneById = useMemo(() => new Map(zones.map((zone) => [zone.id, zone])), [zones]);
  const shippingMatch = form.deliveryMethod === "kirim" && form.address.trim().length >= 5 ? detectShippingZone(form.address) : null;
  const shippingZone = shippingMatch ? (zoneById.get(shippingMatch.zone) ?? null) : null;
  // Ongkir berdasarkan total berat (pembaruan IOM-ITB); angka final dihitung database.
  const totalWeight = items.reduce((sum, item) => sum + itemWeight(item.weightGrams) * item.quantity, 0);
  const shippingQuote = shippingZone ? shippingCostFor(shippingZone, totalWeight) : null;
  const tableView: QuoteView | null =
    shippingMatch && shippingZone && shippingQuote
      ? {
          live: false,
          cost: shippingQuote.cost,
          billedKg: shippingQuote.billedKg,
          matchedPlace: shippingMatch.matchedPlace,
          label: shippingZone.label,
          etd: null,
          byNearest: shippingMatch.byNearest,
          baseCost: shippingZone.cost,
          extraPerKg: shippingZone.extraPerKg,
        }
      : null;

  // Tarif live (pembaruan IOM-ITB): server menghitung dari kode pos tujuan,
  // cadangan tabel zona — tunggu pembeli berhenti mengetik (600 ms).
  const validPostal = /^\d{5}$/.test(form.postalCode) ? form.postalCode : "";
  const [serverQuote, setServerQuote] = useState<{ key: string; quote: OrderShippingQuote | null } | null>(null);
  const quoteKey =
    liveShippingEnabled && form.deliveryMethod === "kirim" && items.length > 0 && (validPostal || form.address.trim().length >= 5)
      ? JSON.stringify([form.address.trim(), validPostal, items.map((item) => [item.productId, item.quantity])])
      : null;
  useEffect(() => {
    if (!quoteKey) return;
    const [address, postalCode, lines] = JSON.parse(quoteKey) as [string, string, [string, number][]];
    const timer = window.setTimeout(async () => {
      const result = await quoteShippingAction({
        address,
        postalCode,
        items: lines.map(([productId, quantity]) => ({ productId, quantity })),
      }).catch(() => ({ quote: null }));
      setServerQuote({ key: quoteKey, quote: result.quote });
    }, 600);
    return () => window.clearTimeout(timer);
  }, [quoteKey]);
  const quoteLoading = quoteKey !== null && serverQuote?.key !== quoteKey;
  const activeServerQuote = quoteKey !== null && serverQuote?.key === quoteKey ? serverQuote.quote : null;
  const serverView: QuoteView | null = activeServerQuote
    ? {
        live: activeServerQuote.provider !== "table",
        cost: activeServerQuote.cost,
        billedKg: activeServerQuote.billedKg,
        matchedPlace: activeServerQuote.matchedPlace,
        label: activeServerQuote.service ?? activeServerQuote.zoneLabel,
        etd: activeServerQuote.etd,
        byNearest: activeServerQuote.byNearest,
        baseCost: activeServerQuote.baseCost,
        extraPerKg: activeServerQuote.extraPerKg,
      }
    : null;
  const quoteView = liveShippingEnabled ? serverView : tableView;
  const shippingCost = form.deliveryMethod === "ambil" ? 0 : (quoteView?.cost ?? null);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (form.deliveryMethod === "kirim" && liveShippingEnabled && !validPostal) {
      setError("Isi kode pos tujuan (5 digit) agar ongkir kurir bisa dihitung.");
      return;
    }
    if (form.deliveryMethod === "kirim" && !quoteView) {
      setError(
        quoteLoading
          ? "Ongkir sedang dihitung, tunggu sebentar lalu coba lagi."
          : "Ongkir belum bisa dihitung. Periksa kode pos, atau lengkapi alamat sampai nama kota/kabupaten dan provinsi."
      );
      return;
    }
    setSubmitting(true);
    const result = await checkoutAction({
      ...form,
      items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
    });
    if (result.error || !result.token) {
      setError(result.error ?? "Pesanan gagal dibuat.");
      setSubmitting(false);
      return;
    }
    clearCart();
    router.push(`/katalog/pesanan/${result.token}?baru=1${paymentChoice === "online" && onlinePaymentEnabled ? "&bayar=1" : ""}`);
  }

  if (!hydrated) {
    return <div className="h-64 animate-pulse rounded-2xl bg-neutral-100" aria-label="Memuat keranjang" />;
  }

  if (items.length === 0 && !submitting) {
    return (
      <div className="space-y-4">
        <EmptyState message="Keranjang masih kosong." />
        <div className="text-center">
          <Link href="/katalog" className="inline-block rounded-lg bg-primary-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-800">
            Lihat katalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        <section className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-neutral-800">Isi keranjang</h2>
            <Link href="/katalog" className="text-sm font-medium text-primary-700 hover:underline">
              + Tambah produk lain
            </Link>
          </div>
          {refreshNotice && <p className="mb-3 rounded-lg bg-warning-50 px-3 py-2 text-sm text-warning-600">{refreshNotice}</p>}
          <ul className="divide-y divide-neutral-100">
            {items.map((item) => (
              <li key={item.productId} className="flex gap-3 py-3">
                <Link href={`/katalog/${item.productId}`} className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border border-neutral-100 bg-neutral-50">
                  <ProductImage src={item.imageUrl} name={item.name} placeholderPadding="p-2" />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link href={`/katalog/${item.productId}`} className="line-clamp-2 text-sm font-semibold text-neutral-800 hover:text-primary-700">
                        {item.name}
                      </Link>
                      <p className="text-xs text-neutral-500">{formatRupiah(item.price)} / pcs</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.productId)}
                      aria-label={`Hapus ${item.name} dari keranjang`}
                      className="rounded-md p-1.5 text-neutral-400 hover:bg-danger-50 hover:text-danger-600"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="inline-flex items-center rounded-lg border border-neutral-200">
                      <button
                        type="button"
                        onClick={() => setCartQuantity(item.productId, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        aria-label={`Kurangi ${item.name}`}
                        className="px-2.5 py-1.5 text-neutral-600 disabled:opacity-40"
                      >
                        <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => setCartQuantity(item.productId, item.quantity + 1)}
                        disabled={item.quantity >= MAX_LINE_QUANTITY}
                        aria-label={`Tambah ${item.name}`}
                        className="px-2.5 py-1.5 text-neutral-600 disabled:opacity-40"
                      >
                        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                    <p className="text-sm font-semibold text-neutral-800">{formatRupiah(item.price * item.quantity)}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-neutral-400">
            Produk yang sedang kosong tetap bisa dipesan — perajin kami akan membuatkannya dulu. Admin akan mengabarkan perkiraan waktunya.
          </p>
        </section>

        <section className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6">
          <h2 className="text-base font-semibold text-neutral-800">Data pembeli</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-neutral-700">
              Nama lengkap <span className="text-danger-600">*</span>
              <input required minLength={2} maxLength={100} autoComplete="name" value={form.customerName} onChange={(e) => update("customerName", e.target.value)} className={inputClass} />
            </label>
            <label className="block text-sm font-medium text-neutral-700">
              Nomor WhatsApp <span className="text-danger-600">*</span>
              <input
                required
                inputMode="tel"
                autoComplete="tel"
                placeholder="08xxxxxxxxxx"
                maxLength={20}
                value={form.customerPhone}
                onChange={(e) => update("customerPhone", e.target.value.replace(/[^\d+\s-]/g, ""))}
                className={inputClass}
              />
            </label>
          </div>
          <label className="block text-sm font-medium text-neutral-700">
            Email <span className="font-normal text-neutral-400">(opsional)</span>
            <input type="email" maxLength={120} autoComplete="email" value={form.customerEmail} onChange={(e) => update("customerEmail", e.target.value)} className={inputClass} />
          </label>

          <fieldset>
            <legend className="text-sm font-medium text-neutral-700">Pengiriman</legend>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {(
                [
                  { value: "kirim", label: "Kirim ke alamat", hint: "Ongkir flat per pesanan", Icon: Truck },
                  { value: "ambil", label: "Ambil sendiri", hint: "Kampung Rajut Binong — gratis", Icon: Store },
                ] as const
              ).map(({ value, label, hint, Icon }) => (
                <label
                  key={value}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm",
                    form.deliveryMethod === value ? "border-primary-700 bg-primary-50" : "border-neutral-200 hover:bg-neutral-50"
                  )}
                >
                  <input type="radio" name="delivery" value={value} checked={form.deliveryMethod === value} onChange={() => update("deliveryMethod", value)} className="sr-only" />
                  <Icon className={cn("mt-0.5 h-5 w-5 flex-shrink-0", form.deliveryMethod === value ? "text-primary-700" : "text-neutral-400")} aria-hidden="true" />
                  <span>
                    <span className="block font-semibold text-neutral-800">{label}</span>
                    <span className="block text-xs text-neutral-500">{hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {form.deliveryMethod === "kirim" ? (
            <div>
              <label className="block text-sm font-medium text-neutral-700">
                Alamat lengkap <span className="text-danger-600">*</span>
                <textarea
                  required
                  rows={3}
                  minLength={10}
                  maxLength={500}
                  autoComplete="street-address"
                  placeholder="Jalan, nomor rumah, RT/RW, kelurahan, kecamatan, kota/kabupaten, provinsi, kode pos"
                  value={form.address}
                  onChange={(e) => update("address", e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="mt-3 block text-sm font-medium text-neutral-700">
                Kode pos {liveShippingEnabled ? <span className="text-danger-600">*</span> : <span className="font-normal text-neutral-400">(disarankan)</span>}
                <input
                  required={liveShippingEnabled}
                  inputMode="numeric"
                  autoComplete="postal-code"
                  maxLength={5}
                  placeholder="mis. 40275"
                  value={form.postalCode}
                  onChange={(e) => update("postalCode", e.target.value.replace(/\D/g, "").slice(0, 5))}
                  className={cn(inputClass, "sm:w-40")}
                />
              </label>
              <p className="mt-1 text-xs text-neutral-400">
                Ongkir dihitung dari {liveShippingEnabled ? "kode pos tujuan" : "kota/kabupaten pada alamat"} dan total berat pesanan (±
                {formatKg(totalWeight)}).
              </p>
              {(form.address.trim().length >= 5 || validPostal) &&
                (quoteView ? (
                  <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-success-50 px-3 py-2 text-sm text-neutral-700">
                    <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-success-600" aria-hidden="true" />
                    <span>
                      Ongkir ke <strong>{quoteView.matchedPlace}</strong>: <strong>{formatRupiah(quoteView.cost)}</strong>{" "}
                      <span className="text-neutral-500">
                        {quoteView.live ? (
                          <>
                            ({quoteView.label}
                            {quoteView.etd ? `, estimasi ${quoteView.etd}` : ""}; ditagih {quoteView.billedKg} kg)
                          </>
                        ) : (
                          <>
                            (tarif {quoteView.label}
                            {quoteView.byNearest ? ", wilayah tarif terdekat" : ""}; ditagih {quoteView.billedKg} kg
                            {quoteView.billedKg > 1 && quoteView.baseCost !== null && quoteView.extraPerKg !== null
                              ? ` = ${formatRupiah(quoteView.baseCost)} + ${quoteView.billedKg - 1} × ${formatRupiah(quoteView.extraPerKg)}`
                              : ""}
                            )
                          </>
                        )}
                      </span>
                    </span>
                  </p>
                ) : liveShippingEnabled && quoteLoading ? (
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-neutral-500">
                    <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Menghitung ongkir…
                  </p>
                ) : (
                  <p className="mt-2 rounded-lg bg-warning-50 px-3 py-2 text-sm text-warning-600">
                    {!liveShippingEnabled && shippingMatch
                      ? "Pengiriman ke wilayah ini sedang tidak tersedia. Hubungi kami via WhatsApp atau pilih ambil sendiri."
                      : "Ongkir belum bisa dihitung. Periksa kode pos, atau lengkapi alamat sampai nama kota/kabupaten dan provinsi."}
                  </p>
                ))}
              {zones.length > 0 && !quoteView?.live && (
                <details className="mt-2 text-sm text-neutral-600">
                  <summary className="cursor-pointer select-none text-primary-700">Lihat tarif ongkir</summary>
                  <ul className="mt-2 grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
                    {zones.map((zone) => (
                      <li key={zone.id} className="flex justify-between gap-4">
                        <span>{zone.label}</span>
                        <span className="font-medium">
                          {formatRupiah(zone.cost)}
                          <span className="font-normal text-neutral-400"> + {formatRupiah(zone.extraPerKg)}/kg</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-1 text-xs text-neutral-400">
                    Tarif untuk 1 kg pertama, ditambah tarif per kg berikutnya. Berat dibulatkan ke atas bila sisanya lebih
                    dari {formatKg(WEIGHT_TOLERANCE_GRAMS)}. Alamat di luar daftar memakai tarif
                    wilayah terdekat.
                  </p>
                </details>
              )}
            </div>
          ) : (
            <p className="rounded-lg bg-neutral-100 px-3 py-2 text-sm text-neutral-600">
              Ambil di Kampung Wisata Rajut Binong, Jl. Binong Jati No. 124, Bandung. Kami kabari via WhatsApp saat pesanan siap.
            </p>
          )}

          {onlinePaymentEnabled && (
            <fieldset>
              <legend className="text-sm font-medium text-neutral-700">Pembayaran</legend>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {(
                  [
                    { value: "online", label: "Bayar online", hint: "QRIS, VA, e-wallet, kartu — otomatis terkonfirmasi", Icon: CreditCard },
                    { value: "manual", label: "Transfer manual", hint: "Transfer/QRIS lalu unggah bukti", Icon: Banknote },
                  ] as const
                ).map(({ value, label, hint, Icon }) => (
                  <label
                    key={value}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm",
                      paymentChoice === value ? "border-primary-700 bg-primary-50" : "border-neutral-200 hover:bg-neutral-50"
                    )}
                  >
                    <input type="radio" name="payment" value={value} checked={paymentChoice === value} onChange={() => setPaymentChoice(value)} className="sr-only" />
                    <Icon className={cn("mt-0.5 h-5 w-5 flex-shrink-0", paymentChoice === value ? "text-primary-700" : "text-neutral-400")} aria-hidden="true" />
                    <span>
                      <span className="block font-semibold text-neutral-800">{label}</span>
                      <span className="block text-xs text-neutral-500">{hint}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          <label className="block text-sm font-medium text-neutral-700">
            Catatan <span className="font-normal text-neutral-400">(opsional)</span>
            <textarea rows={2} maxLength={500} placeholder="Mis. warna pilihan, ukuran, untuk kado" value={form.notes} onChange={(e) => update("notes", e.target.value)} className={inputClass} />
          </label>
        </section>
      </div>

      <aside className="h-fit space-y-4 rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6 lg:sticky lg:top-6">
        <h2 className="text-base font-semibold text-neutral-800">Ringkasan</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-neutral-500">Subtotal ({cartCount(items)} pcs)</dt>
            <dd className="font-medium text-neutral-800">{formatRupiah(subtotal)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-neutral-500">
              Ongkir
              {form.deliveryMethod === "kirim" && quoteView ? ` (${quoteView.billedKg} kg)` : ""}
            </dt>
            <dd className="font-medium text-neutral-800">
              {shippingCost === null ? <span className="text-neutral-400">lengkapi alamat</span> : shippingCost === 0 ? "Gratis" : formatRupiah(shippingCost)}
            </dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-neutral-100 pt-2 text-base">
            <dt className="font-semibold text-neutral-800">Total</dt>
            <dd className="font-semibold text-primary-700">{formatRupiah(subtotal + (shippingCost ?? 0))}</dd>
          </div>
        </dl>

        {error && (
          <p role="alert" className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || refreshing || items.length === 0}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-700 px-5 py-3.5 text-base font-semibold text-white hover:bg-primary-800 disabled:opacity-60"
        >
          {(submitting || refreshing) && <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />}
          {submitting
            ? "Memproses…"
            : refreshing
              ? "Memperbarui harga…"
              : paymentChoice === "online" && onlinePaymentEnabled
                ? "Pesan & Bayar Online"
                : "Buat Pesanan"}
        </button>
        <p className="text-xs leading-relaxed text-neutral-500">
          Setelah pesanan dibuat, Anda mendapat kode pesanan dan tautan untuk membayar serta memantau status pesanan.
          {notificationsEnabled && " Konfirmasi dan kabar status pesanan juga kami kirim ke WhatsApp (dan email, bila diisi)."}
        </p>
      </aside>
    </form>
  );
}
