"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Copy, ExternalLink, ImageOff, MessageCircle, RotateCcw, Trash2, XCircle } from "lucide-react";
import { ProductImage } from "@/components/produk/product-image";
import { PaymentStatusBadge, SaleStatusBadge } from "@/components/penjualan/sale-badges";
import { SaleProgress } from "@/components/katalog/sale-progress";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ToastViewport, useToast } from "@/components/ui/toast";
import {
  confirmPaymentAction,
  deleteSaleAction,
  rejectPaymentAction,
  undoPaymentAction,
  updateSaleStatusAction,
} from "@/lib/penjualan/actions";
import { DELIVERY_METHOD_LABELS, SALE_STATUS_LABELS, SALE_STATUS_OPTIONS, STATUSES_REQUIRING_PAYMENT } from "@/lib/penjualan/constants";
import { formatPhoneDisplay, formatRupiah } from "@/lib/utils";
import type { ActionResult } from "@/lib/action-utils";
import type { OnlineSale, OnlineSaleStatus } from "@/lib/types";

interface SaleDetailClientProps {
  sale: OnlineSale;
  proofUrl: string | null;
  /** Tautan lacak untuk pembeli (absolut bila NEXT_PUBLIC_SITE_URL diisi). */
  trackingUrl: string;
}

const inputClass =
  "mt-1 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40";

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date(iso));
}

/** Pesan WhatsApp ke pembeli sesuai tahap pesanan saat ini. */
function buyerMessage(sale: OnlineSale, trackingUrl: string): string {
  const greeting = `Halo ${sale.customerName}, terima kasih sudah memesan di MERAKIT.`;
  const code = `Kode pesanan: *${sale.code}*`;
  let body: string;
  if (sale.status === "Dibatalkan") body = "Mohon maaf, pesanan Anda kami batalkan.";
  else if (sale.paymentStatus === "ditolak") body = `Bukti pembayaran belum dapat kami terima${sale.paymentNote ? ` (${sale.paymentNote})` : ""}. Mohon unggah ulang lewat tautan di bawah.`;
  else if (sale.paymentStatus !== "lunas") body = `Total pembayaran ${formatRupiah(sale.totalAmount)}. Setelah membayar, unggah buktinya lewat tautan di bawah ya.`;
  else if (sale.status === "Dikirim")
    body =
      sale.deliveryMethod === "ambil"
        ? "Pesanan Anda sudah siap diambil di Kampung Rajut Binong, Jl. Binong Jati No. 124."
        : `Pesanan Anda sudah dikirim${sale.courier ? ` via ${sale.courier}` : ""}${sale.trackingNumber ? `, no. resi ${sale.trackingNumber}` : ""}.`;
  else if (sale.status === "Selesai") body = "Pesanan sudah selesai. Semoga suka dengan karya perajin kami!";
  else body = "Pembayaran sudah kami terima dan pesanan sedang kami siapkan.";
  return [greeting, code, body, `Pantau pesanan: ${trackingUrl}`].join("\n");
}

function whatsAppLink(phone: string, text: string) {
  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}

export function SaleDetailClient({ sale, proofUrl, trackingUrl }: SaleDetailClientProps) {
  const router = useRouter();
  const { toast, showToast, dismissToast } = useToast();
  const [busy, setBusy] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [statusForm, setStatusForm] = useState({
    status: sale.status,
    courier: sale.courier ?? "",
    trackingNumber: sale.trackingNumber ?? "",
  });

  async function run(action: () => Promise<ActionResult>, successMessage: string) {
    setBusy(true);
    const result = await action();
    setBusy(false);
    if (result.error) {
      showToast(result.error, "danger");
      return false;
    }
    showToast(successMessage, "success");
    router.refresh();
    return true;
  }

  const isPaid = sale.paymentStatus === "lunas";
  const isCancelled = sale.status === "Dibatalkan";
  const statusChanged =
    statusForm.status !== sale.status ||
    statusForm.courier !== (sale.courier ?? "") ||
    statusForm.trackingNumber !== (sale.trackingNumber ?? "");

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-card sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-mono text-lg font-semibold text-primary-700">{sale.code}</p>
            <p className="text-sm text-neutral-500">Dipesan {formatDateTime(sale.createdAt)}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <PaymentStatusBadge status={sale.paymentStatus} />
              <SaleStatusBadge status={sale.status} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={whatsAppLink(sale.customerPhone, buyerMessage(sale, trackingUrl))}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-success-500/30 px-3.5 py-2 text-sm font-medium text-success-600 hover:bg-success-50"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              Kabari pembeli
            </a>
            <button
              type="button"
              onClick={() => navigator.clipboard?.writeText(trackingUrl).then(() => showToast("Tautan lacak disalin.", "info"))}
              className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3.5 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              <Copy className="h-4 w-4" aria-hidden="true" />
              Salin tautan lacak
            </button>
          </div>
        </div>
        <div className="mt-5">
          <SaleProgress status={sale.status} deliveryMethod={sale.deliveryMethod} />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-card">
          <h2 className="text-sm font-semibold text-neutral-800">Produk</h2>
          <ul className="mt-2 divide-y divide-neutral-100">
            {sale.items.map((item) => (
              <li key={item.orderId} className="flex items-center gap-3 py-2.5">
                <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border border-neutral-100 bg-neutral-50">
                  <ProductImage src={item.imageUrl ?? ""} name={item.productName} placeholderPadding="p-1.5" />
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
          <dl className="mt-2 space-y-1 border-t border-neutral-100 pt-2 text-sm">
            <div className="flex justify-between"><dt className="text-neutral-500">Subtotal</dt><dd>{formatRupiah(sale.subtotal)}</dd></div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">Ongkir{sale.shippingZoneLabel ? ` (${sale.shippingZoneLabel})` : ""}</dt>
              <dd>{sale.shippingCost === 0 ? "Gratis" : formatRupiah(sale.shippingCost)}</dd>
            </div>
            <div className="flex justify-between text-base font-semibold"><dt>Total ditagihkan</dt><dd className="text-primary-700">{formatRupiah(sale.totalAmount)}</dd></div>
          </dl>
        </section>

        <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-card">
          <h2 className="text-sm font-semibold text-neutral-800">Pembeli &amp; Pengiriman</h2>
          <dl className="mt-2 space-y-2 text-sm text-neutral-700">
            <div><dt className="text-xs text-neutral-400">Nama</dt><dd className="font-medium">{sale.customerName}</dd></div>
            <div><dt className="text-xs text-neutral-400">WhatsApp</dt><dd>{formatPhoneDisplay(sale.customerPhone)}</dd></div>
            {sale.customerEmail && <div><dt className="text-xs text-neutral-400">Email</dt><dd>{sale.customerEmail}</dd></div>}
            <div><dt className="text-xs text-neutral-400">Metode</dt><dd>{DELIVERY_METHOD_LABELS[sale.deliveryMethod]}</dd></div>
            {sale.address && <div><dt className="text-xs text-neutral-400">Alamat</dt><dd className="whitespace-pre-line select-all">{sale.address}</dd></div>}
            {sale.notes && <div><dt className="text-xs text-neutral-400">Catatan pembeli</dt><dd className="whitespace-pre-line">{sale.notes}</dd></div>}
          </dl>
        </section>
      </div>

      <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-card sm:p-6">
        <h2 className="text-sm font-semibold text-neutral-800">Pembayaran</h2>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-[200px_1fr]">
          {proofUrl ? (
            <a href={proofUrl} target="_blank" rel="noreferrer" className="group block overflow-hidden rounded-lg border border-neutral-200" title="Buka ukuran penuh">
              {/* eslint-disable-next-line @next/next/no-img-element -- signed URL bucket privat, berlaku 10 menit */}
              <img src={proofUrl} alt={`Bukti pembayaran ${sale.code}`} className="h-48 w-full object-cover group-hover:opacity-90" />
              <span className="flex items-center justify-center gap-1 py-1.5 text-xs text-neutral-500">
                <ExternalLink className="h-3 w-3" aria-hidden="true" /> Perbesar
              </span>
            </a>
          ) : (
            <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-neutral-300 text-center text-xs text-neutral-400">
              <ImageOff className="h-5 w-5" aria-hidden="true" />
              Belum ada bukti pembayaran
            </div>
          )}
          <div className="space-y-3 text-sm">
            {sale.paymentProofUploadedAt && <p className="text-neutral-500">Bukti diunggah {formatDateTime(sale.paymentProofUploadedAt)}.</p>}
            {sale.paidAt && isPaid && <p className="text-success-600">Dikonfirmasi lunas {formatDateTime(sale.paidAt)}.</p>}
            {sale.paymentStatus === "ditolak" && sale.paymentNote && <p className="text-danger-600">Ditolak: {sale.paymentNote}</p>}
            <p className="text-neutral-500">
              Cocokkan nominal <strong className="text-neutral-800">{formatRupiah(sale.totalAmount)}</strong> dengan mutasi rekening/QRIS sebelum
              mengonfirmasi. Untuk pembayaran tunai saat diambil, cukup tandai lunas.
            </p>

            {!isCancelled && (
              <div className="flex flex-wrap gap-2">
                {!isPaid ? (
                  <>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => run(() => confirmPaymentAction(sale.id), "Pembayaran dikonfirmasi lunas.")}
                      className="flex items-center gap-1.5 rounded-lg bg-success-600 px-3.5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
                    >
                      <BadgeCheck className="h-4 w-4" aria-hidden="true" />
                      Konfirmasi Lunas
                    </button>
                    {sale.paymentProofPath && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setRejectOpen((open) => !open)}
                        className="flex items-center gap-1.5 rounded-lg border border-danger-200 px-3.5 py-2 text-sm font-medium text-danger-600 hover:bg-danger-50 disabled:opacity-60"
                      >
                        <XCircle className="h-4 w-4" aria-hidden="true" />
                        Tolak Bukti
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => run(() => undoPaymentAction(sale.id), "Konfirmasi pembayaran dibatalkan.")}
                    className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3.5 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-60"
                  >
                    <RotateCcw className="h-4 w-4" aria-hidden="true" />
                    Batalkan Konfirmasi
                  </button>
                )}
              </div>
            )}

            {rejectOpen && !isPaid && (
              <div className="rounded-lg bg-danger-50/50 p-3">
                <label className="block text-xs font-medium text-neutral-700">
                  Alasan penolakan (dilihat pembeli)
                  <textarea
                    rows={2}
                    maxLength={300}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Mis. nominal transfer kurang Rp5.000 / foto tidak terbaca"
                    className={inputClass}
                  />
                </label>
                <button
                  type="button"
                  disabled={busy || !rejectReason.trim()}
                  onClick={async () => {
                    if (await run(() => rejectPaymentAction(sale.id, rejectReason), "Bukti pembayaran ditolak. Kabari pembeli via WhatsApp.")) {
                      setRejectOpen(false);
                      setRejectReason("");
                    }
                  }}
                  className="mt-2 rounded-lg bg-danger-600 px-3.5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
                >
                  Simpan penolakan
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-card sm:p-6">
        <h2 className="text-sm font-semibold text-neutral-800">Status &amp; Pengiriman</h2>
        <p className="mt-1 text-xs text-neutral-400">
          Status ikut mengubah baris di menu Pesanan. &quot;Selesai&quot; mengurangi stok produk dan mencatat pemasukan di Keuangan.
        </p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="block text-sm font-medium text-neutral-700">
            Status
            <select
              value={statusForm.status}
              onChange={(e) => setStatusForm((f) => ({ ...f, status: e.target.value as OnlineSaleStatus }))}
              className={inputClass}
            >
              {SALE_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} disabled={!isPaid && STATUSES_REQUIRING_PAYMENT.includes(option.value)}>
                  {option.label}
                  {!isPaid && STATUSES_REQUIRING_PAYMENT.includes(option.value) ? " (perlu lunas)" : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-neutral-700">
            Kurir <span className="font-normal text-neutral-400">(opsional)</span>
            <input
              value={statusForm.courier}
              maxLength={60}
              placeholder="JNE, J&T, Gojek…"
              onChange={(e) => setStatusForm((f) => ({ ...f, courier: e.target.value }))}
              className={inputClass}
            />
          </label>
          <label className="block text-sm font-medium text-neutral-700">
            No. resi <span className="font-normal text-neutral-400">(opsional)</span>
            <input
              value={statusForm.trackingNumber}
              maxLength={60}
              onChange={(e) => setStatusForm((f) => ({ ...f, trackingNumber: e.target.value }))}
              className={inputClass}
            />
          </label>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            disabled={busy || !statusChanged}
            onClick={() => run(() => updateSaleStatusAction(sale.id, statusForm), `Status diperbarui: ${SALE_STATUS_LABELS[statusForm.status]}.`)}
            className="rounded-lg bg-primary-700 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-800 disabled:opacity-50"
          >
            Simpan Status
          </button>
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-danger-600 hover:bg-danger-50"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Hapus penjualan
          </button>
        </div>
      </section>

      <ConfirmDialog
        open={deleteOpen}
        title={`Hapus penjualan ${sale.code}?`}
        description="Baris pesanannya ikut terhapus dari menu Pesanan (dan dari perhitungan stok & keuangan bila sudah selesai). Untuk pesanan yang batal, lebih baik ubah status ke Dibatalkan agar tetap tercatat."
        confirmLabel="Ya, hapus"
        loading={busy}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={async () => {
          setBusy(true);
          const result = await deleteSaleAction(sale.id);
          setBusy(false);
          setDeleteOpen(false);
          if (result.error) return showToast(result.error, "danger");
          router.push("/penjualan");
        }}
      />
      <ToastViewport toast={toast} onDismiss={dismissToast} />
    </div>
  );
}
