"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ToastViewport, useToast } from "@/components/ui/toast";
import { deletePromoAction } from "@/lib/promo/actions";
import { PROMO_STATUS_BADGE, PROMO_STATUS_LABELS, formatPromoValue } from "@/lib/promo/logic";
import { cn, formatDate, formatRupiah } from "@/lib/utils";
import type { Promo, PromoStatus } from "@/lib/types";

export interface PromoRow extends Promo {
  effectiveStatus: PromoStatus;
  usageOrders: number;
  usageDiscount: number;
}

interface PromoListClientProps {
  promos: PromoRow[];
  canManage: boolean;
}

export function PromoListClient({ promos, canManage }: PromoListClientProps) {
  const router = useRouter();
  const { toast, showToast, dismissToast } = useToast();
  const [pendingDelete, setPendingDelete] = useState<PromoRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleConfirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    const result = await deletePromoAction(pendingDelete.id);
    setDeleting(false);
    setPendingDelete(null);
    if (result.error) return showToast(result.error, "danger");
    showToast("Promo dihapus.", "success");
    router.refresh();
  }

  if (promos.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-card">
        <EmptyState message={canManage ? "Belum ada promo. Buat kode promo pertama untuk pelanggan." : "Belum ada promo."} />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-card">
      <ul className="divide-y divide-neutral-100">
        {promos.map((promo) => (
          <li key={promo.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-primary-50 px-2 py-0.5 font-mono text-sm font-semibold text-primary-700">{promo.code}</span>
                <span className="text-sm font-semibold text-neutral-800">Diskon {formatPromoValue(promo)}</span>
                <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", PROMO_STATUS_BADGE[promo.effectiveStatus])}>
                  {PROMO_STATUS_LABELS[promo.effectiveStatus]}
                </span>
              </div>
              {promo.description && <p className="mt-1 text-sm text-neutral-600">{promo.description}</p>}
              <p className="mt-1 text-xs text-neutral-500">
                {promo.validUntil ? `Berlaku s.d. ${formatDate(promo.validUntil)}` : "Tanpa batas waktu"} · Dipakai {promo.usageOrders} pesanan
                {promo.usageDiscount > 0 ? ` · total potongan ${formatRupiah(promo.usageDiscount)}` : ""}
              </p>
            </div>
            {canManage && (
              <div className="flex flex-shrink-0 gap-2">
                <Link
                  href={`/promo/tambah?id=${promo.id}`}
                  className="flex items-center gap-1.5 rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                  Edit
                </Link>
                <button
                  type="button"
                  onClick={() => setPendingDelete(promo)}
                  className="flex items-center gap-1.5 rounded-md border border-danger-200 px-2.5 py-1.5 text-xs font-medium text-danger-600 hover:bg-danger-50"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Hapus
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Hapus promo?"
        description={pendingDelete ? `Kode ${pendingDelete.code} akan dihapus. Promo yang sudah dipakai pesanan tidak bisa dihapus — nonaktifkan saja.` : undefined}
        confirmLabel="Ya, Hapus"
        tone="danger"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => !deleting && setPendingDelete(null)}
      />
      <ToastViewport toast={toast} onDismiss={dismissToast} />
    </div>
  );
}
