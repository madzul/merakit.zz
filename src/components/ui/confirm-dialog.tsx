"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle, LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  tone?: "danger" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Dialog konfirmasi generik (mis. sebelum menghapus data). Tidak menggunakan
 * library dialog eksternal — mengikuti pola custom modal yang sama dengan
 * `Sheet` di komponen ini.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Ya, lanjutkan",
  cancelLabel = "Batal",
  loading = false,
  tone = "danger",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    // Fokus ke tombol "Batal" secara default — lebih aman untuk dialog
    // destruktif dibanding auto-fokus ke tombol konfirmasi.
    cancelButtonRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) {
        onCancel();
        return;
      }
      // Focus trap sederhana: siklus Tab tetap di dalam dialog.
      if (e.key === "Tab") {
        const dialogEl = document.getElementById("confirm-dialog-panel");
        if (!dialogEl) return;
        const focusable = dialogEl.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      // Kembalikan fokus ke elemen pemicu dialog saat ditutup.
      previouslyFocusedRef.current?.focus();
    };
  }, [open, loading, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="presentation">
      <div
        onClick={() => !loading && onCancel()}
        className="absolute inset-0 bg-neutral-900/40"
        aria-hidden="true"
      />
      <div
        id="confirm-dialog-panel"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="relative w-full max-w-sm rounded-xl bg-white p-5 shadow-card-hover"
      >
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full",
              tone === "danger" ? "bg-danger-50 text-danger-600" : "bg-primary-50 text-primary-600"
            )}
          >
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 id="confirm-dialog-title" className="text-sm font-semibold text-neutral-800">
              {title}
            </h2>
            {description && <p className="mt-1 text-sm text-neutral-500">{description}</p>}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            ref={cancelButtonRef}
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border border-neutral-200 px-3.5 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70",
              tone === "danger" ? "bg-danger-600 hover:bg-danger-700" : "bg-primary-700 hover:bg-primary-800"
            )}
          >
            {loading && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
