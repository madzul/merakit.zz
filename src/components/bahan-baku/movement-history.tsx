"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ToastViewport, useToast } from "@/components/ui/toast";
import { deleteMovementAction } from "@/lib/bahan-baku/actions";
import { MOVEMENT_TYPE_SHORT, formatQuantity } from "@/lib/bahan-baku/constants";
import { cn, formatDate, formatRupiah } from "@/lib/utils";
import type { MaterialMovement } from "@/lib/types";

interface MovementHistoryProps {
  movements: MaterialMovement[];
  unit: string;
  canManage: boolean;
}

function signedQuantity(movement: MaterialMovement): number {
  return movement.type === "keluar" ? -movement.quantity : movement.quantity;
}

export function MovementHistory({ movements, unit, canManage }: MovementHistoryProps) {
  const router = useRouter();
  const { toast, showToast, dismissToast } = useToast();
  const [pendingDelete, setPendingDelete] = useState<MaterialMovement | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleConfirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    const result = await deleteMovementAction(pendingDelete.id);
    setDeleting(false);
    setPendingDelete(null);
    if (result.error) return showToast(result.error, "danger");
    showToast("Riwayat dihapus dan stok dihitung ulang.", "success");
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white shadow-card">
      <div className="border-b border-neutral-100 px-5 py-4">
        <h2 className="text-sm font-semibold text-neutral-800">Riwayat Stok</h2>
        <p className="mt-0.5 text-xs text-neutral-500">200 pergerakan terakhir. Stok = jumlah seluruh riwayat.</p>
      </div>

      {movements.length === 0 ? (
        <div className="p-6">
          <EmptyState message="Belum ada riwayat stok untuk bahan ini." />
        </div>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {movements.map((movement) => {
            const quantity = signedQuantity(movement);
            const isAuto = Boolean(movement.productionRecordId);
            return (
              <li key={movement.id} className="flex items-start justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="text-sm text-neutral-800">
                    <span className="font-medium">{isAuto ? "Pemakaian produksi" : MOVEMENT_TYPE_SHORT[movement.type]}</span>
                    {movement.unitCost !== null && movement.unitCost > 0 && (
                      <span className="text-neutral-500"> · @{formatRupiah(movement.unitCost)}</span>
                    )}
                    {movement.expenseId && <span className="ml-1.5 rounded bg-info-50 px-1.5 py-0.5 text-[11px] text-info-600">tercatat di Keuangan</span>}
                  </p>
                  <p className="truncate text-xs text-neutral-500">
                    {formatDate(movement.date)}
                    {movement.notes ? ` · ${movement.notes}` : ""}
                  </p>
                </div>
                <div className="flex flex-shrink-0 items-center gap-2">
                  <span className={cn("text-sm font-semibold", quantity < 0 ? "text-danger-600" : "text-success-600")}>
                    {quantity > 0 ? "+" : "−"}
                    {formatQuantity(Math.abs(quantity))} {unit}
                  </span>
                  {canManage && !isAuto && (
                    <button
                      type="button"
                      onClick={() => setPendingDelete(movement)}
                      aria-label="Hapus riwayat ini"
                      className="rounded-md p-1.5 text-neutral-400 hover:bg-danger-50 hover:text-danger-600"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Hapus riwayat stok?"
        description={
          pendingDelete?.expenseId
            ? "Stok akan dihitung ulang, dan pengeluaran yang tertaut di Keuangan juga ikut dihapus."
            : "Stok akan dihitung ulang tanpa riwayat ini."
        }
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
