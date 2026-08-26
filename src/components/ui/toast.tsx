"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastTone = "success" | "danger" | "info";

export interface ToastState {
  id: number;
  message: string;
  tone: ToastTone;
}

const TOAST_TONE_STYLES: Record<ToastTone, string> = {
  success: "bg-success-600 text-white",
  danger: "bg-danger-600 text-white",
  info: "bg-neutral-800 text-white",
};

const TOAST_TONE_ICONS: Record<ToastTone, typeof CheckCircle2> = {
  success: CheckCircle2,
  danger: XCircle,
  info: Info,
};

/**
 * Hook toast sederhana (simulasi notifikasi), tanpa library eksternal.
 * State dikelola lokal per halaman — cukup untuk kebutuhan data dummy.
 */
export function useToast(durationMs = 3000) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const idRef = useRef(0);

  const showToast = useCallback((message: string, tone: ToastTone = "success") => {
    idRef.current += 1;
    setToast({ id: idRef.current, message, tone });
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), durationMs);
    return () => window.clearTimeout(timeout);
  }, [toast, durationMs]);

  return { toast, showToast, dismissToast };
}

interface ToastViewportProps {
  toast: ToastState | null;
  onDismiss: () => void;
}

export function ToastViewport({ toast, onDismiss }: ToastViewportProps) {
  if (!toast) return null;

  const Icon = TOAST_TONE_ICONS[toast.tone];

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-4 bottom-4 z-[60] flex justify-center sm:inset-x-auto sm:right-4 sm:justify-end"
    >
      <div
        className={cn(
          "flex w-full max-w-sm items-start gap-2.5 rounded-lg px-4 py-3 text-sm font-medium shadow-card-hover",
          TOAST_TONE_STYLES[toast.tone]
        )}
      >
        <Icon className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
        <span className="min-w-0">{toast.message}</span>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Tutup notifikasi"
          className="ml-auto flex-shrink-0 text-white/80 hover:text-white"
        >
          &times;
        </button>
      </div>
    </div>
  );
}
