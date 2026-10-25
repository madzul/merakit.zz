import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, MessageCircle, Package, XCircle } from "lucide-react";
import { ProductImage } from "@/components/produk/product-image";
import { PaymentProofUpload } from "@/components/katalog/payment-proof-upload";
import { OnlinePaymentButton } from "@/components/katalog/online-payment-button";
import { isMidtransEnabled } from "@/lib/penjualan/midtrans";
import { paymentTypeLabel } from "@/lib/penjualan/notification-templates";
import { SaleProgress } from "@/components/katalog/sale-progress";
import { getOrderWhatsAppNumber, saleWhatsAppLink, siteOrigin } from "@/lib/katalog";
import { getPaymentInfo, hasPaymentInfo } from "@/lib/penjualan/config";
import { DELIVERY_METHOD_LABELS, PAYMENT_STATUS_BADGE_STYLES, PAYMENT_STATUS_LABELS } from "@/lib/penjualan/constants";
import { getPublicOnlineSale } from "@/lib/supabase/repositories/online-sales-repository";
import { cn, formatRupiah } from "@/lib/utils";
import { shippingDetail } from "@/lib/penjualan/shipping";

export const metadata: Metadata = {
  title: "Status Pesanan — Katalog MERAKIT",
  // Tautan rahasia per pembeli: jangan diindeks mesin pencari.
  robots: { index: false, follow: false },
};

interface StatusPesananPageProps {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ baru?: string; bayar?: string }>;
}

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date(iso));
}

export default async function StatusPesananPage({ params, searchParams }: StatusPesananPageProps) {
  const [{ token }, { baru, bayar }] = await Promise.all([params, searchParams]);
  const sale = await getPublicOnlineSale(token).catch(() => null);
  if (!sale) notFound();

  const payment = getPaymentInfo();
  const whatsappNumber = getOrderWhatsAppNumber();
  const origin = siteOrigin();
  const pageUrl = origin ? `${origin}/katalog/pesanan/${token}` : undefined;
  const canPay = sale.status !== "Dibatalkan" && sale.paymentStatus !== "lunas";
  const onlinePayment = isMidtransEnabled();
  // Bukti transfer yang sedang diperiksa: jangan dorong pembeli membayar dua kali.
  const showOnlineButton = onlinePayment && sale.paymentStatus !== "menunggu_verifikasi";

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {baru === "1" && (
        <div role="status" className="flex items-start gap-3 rounded-2xl bg-success-50 p-4 text-sm text-success-600">
          <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold">Terima kasih, pesanan Anda sudah kami terima!</p>
            <p className="mt-0.5 text-neutral-600">
              Simpan tautan halaman ini (bookmark atau screenshot) untuk mengunggah bukti bayar dan memantau status.
              Anda juga bisa melacaknya di menu <strong>Lacak Pesanan</strong> dengan kode di bawah + nomor WhatsApp.
            </p>
          </div>
        </div>
      )}

      <section className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">Kode pesanan</p>
            <p className="text-2xl font-semibold tracking-wide text-neutral-800">{sale.code}</p>
            <p className="mt-0.5 text-sm text-neutral-500">
              {sale.customerName} · {sale.customerPhoneMasked} · {formatDateTime(sale.createdAt)}
            </p>
          </div>
          <span className={cn("w-fit rounded-full px-3 py-1 text-xs font-semibold", PAYMENT_STATUS_BADGE_STYLES[sale.paymentStatus])}>
            {PAYMENT_STATUS_LABELS[sale.paymentStatus]}
          </span>
        </div>
        <div className="mt-5">
          <SaleProgress status={sale.status} deliveryMethod={sale.deliveryMethod} />
        </div>
        {(sale.courier || sale.trackingNumber) && (
          <p className="mt-4 flex items-center gap-2 rounded-lg bg-primary-50 px-3 py-2 text-sm text-primary-800">
            <Package className="h-4 w-4" aria-hidden="true" />
            {sale.courier ?? "Kurir"}
            {sale.trackingNumber && (
              <>
                {" "}· No. resi <strong className="select-all">{sale.trackingNumber}</strong>
              </>
            )}
          </p>
        )}
      </section>

      {canPay && (
        <section className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6">
          <h2 className="text-base font-semibold text-neutral-800">Pembayaran</h2>
          {sale.paymentStatus === "ditolak" && (
            <p className="flex items-start gap-2 rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600">
              <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
              <span>
                Bukti pembayaran belum dapat kami terima{sale.paymentNote ? `: ${sale.paymentNote}` : "."} Silakan unggah ulang.
              </span>
            </p>
          )}
          {sale.paymentStatus === "menunggu_verifikasi" && (
            <p className="flex items-start gap-2 rounded-lg bg-warning-50 px-3 py-2 text-sm text-warning-600">
              <Clock className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
              Bukti pembayaran sudah diterima dan sedang diperiksa admin (biasanya dalam 1×24 jam).
            </p>
          )}

          <p className="text-sm text-neutral-700">
            Total yang perlu dibayar: <strong className="text-lg text-primary-700">{formatRupiah(sale.totalAmount)}</strong>
          </p>

          {showOnlineButton && (
            <OnlinePaymentButton token={token} autoStart={bayar === "1"} resume={sale.onlinePaymentPending} />
          )}

          <details open={!showOnlineButton} className="group rounded-xl border border-neutral-200 p-4">
            <summary className="cursor-pointer select-none text-sm font-semibold text-neutral-700">
              {showOnlineButton ? "Atau transfer manual & unggah bukti" : "Transfer & unggah bukti pembayaran"}
            </summary>
            <div className="mt-3 space-y-4">
              {hasPaymentInfo(payment) ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {payment.bankLines.length > 0 && (
                    <div className="rounded-xl bg-neutral-50 p-4 text-sm text-neutral-700">
                      <p className="font-semibold">Transfer bank</p>
                      {payment.bankLines.map((line) => (
                        <p key={line} className="mt-1 select-all">
                          {line}
                        </p>
                      ))}
                    </div>
                  )}
                  {payment.qrisImageUrl && (
                    <div className="rounded-xl bg-neutral-50 p-4 text-sm text-neutral-700">
                      <p className="font-semibold">Scan QRIS</p>
                      <a href={payment.qrisImageUrl} target="_blank" rel="noopener noreferrer" title="Buka QRIS ukuran penuh">
                        {/* eslint-disable-next-line @next/next/no-img-element -- gambar QRIS statis dari env */}
                        <img src={payment.qrisImageUrl} alt="QRIS pembayaran MERAKIT" className="mt-2 w-full max-w-[220px] rounded-lg border border-neutral-200" />
                      </a>
                      <p className="mt-1 text-xs text-neutral-500">Ketik nominal {formatRupiah(sale.totalAmount)} saat membayar.</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="rounded-lg bg-neutral-100 px-3 py-2 text-sm text-neutral-600">
                  Admin MERAKIT akan mengirimkan instruksi pembayaran lewat WhatsApp. Setelah membayar, unggah buktinya di sini.
                </p>
              )}

              <PaymentProofUpload token={token} hasProof={sale.hasPaymentProof} />
            </div>
          </details>
        </section>
      )}

      {sale.paymentStatus === "lunas" && sale.status !== "Dibatalkan" && (
        <p className="flex items-center gap-2 rounded-2xl bg-success-50 px-4 py-3 text-sm font-medium text-success-600">
          <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
          Pembayaran sudah dikonfirmasi{sale.paymentMethod === "midtrans" ? ` (${paymentTypeLabel(sale.paymentType)})` : ""}. Terima kasih
          telah mendukung perajin MERAKIT!
        </p>
      )}

      <section className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6">
        <h2 className="text-base font-semibold text-neutral-800">Rincian pesanan</h2>
        <ul className="mt-2 divide-y divide-neutral-100">
          {sale.items.map((item, index) => (
            <li key={`${item.productId ?? "x"}-${index}`} className="flex items-center gap-3 py-3">
              <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border border-neutral-100 bg-neutral-50">
                <ProductImage src={item.imageUrl ?? ""} name={item.productName} placeholderPadding="p-2" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-neutral-800">{item.productName}</p>
                <p className="text-xs text-neutral-500">
                  {item.quantity} × {formatRupiah(item.unitPrice)}
                </p>
              </div>
              <p className="text-sm font-semibold text-neutral-800">{formatRupiah(item.totalAmount)}</p>
            </li>
          ))}
        </ul>
        <dl className="mt-2 space-y-1.5 border-t border-neutral-100 pt-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-neutral-500">Subtotal</dt>
            <dd>{formatRupiah(sale.subtotal)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-neutral-500">Ongkir{shippingDetail(sale.shippingZoneLabel, sale.shippingBilledKg)}</dt>
            <dd>{sale.shippingCost === 0 ? "Gratis" : formatRupiah(sale.shippingCost)}</dd>
          </div>
          <div className="flex justify-between gap-4 text-base font-semibold">
            <dt>Total</dt>
            <dd className="text-primary-700">{formatRupiah(sale.totalAmount)}</dd>
          </div>
        </dl>
        <div className="mt-4 space-y-1 rounded-lg bg-neutral-50 px-3 py-2 text-sm text-neutral-600">
          <p className="font-medium text-neutral-700">{DELIVERY_METHOD_LABELS[sale.deliveryMethod]}</p>
          {sale.deliveryMethod === "kirim" && (sale.shippingPostalCode || sale.shippingEtd) && (
            <p className="text-neutral-500">
              {[sale.shippingPostalCode && `Kode pos ${sale.shippingPostalCode}`, sale.shippingEtd && `Estimasi kirim ${sale.shippingEtd}`]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
          {sale.address && <p className="whitespace-pre-line">{sale.address}</p>}
          {sale.notes && <p className="text-neutral-500">Catatan: {sale.notes}</p>}
        </div>
      </section>

      <div className="flex flex-col gap-2 sm:flex-row">
        {whatsappNumber && (
          <a
            href={saleWhatsAppLink(whatsappNumber, sale, pageUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-success-600 px-5 py-3 text-sm font-semibold text-white hover:opacity-90"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            Tanya admin via WhatsApp
          </a>
        )}
        <Link href="/katalog" className="flex flex-1 items-center justify-center rounded-xl border border-neutral-200 bg-white px-5 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">
          Kembali ke katalog
        </Link>
      </div>
    </div>
  );
}
