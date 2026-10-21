"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, LoaderCircle } from "lucide-react";
import { startOnlinePaymentAction, verifyOnlinePaymentAction } from "@/lib/penjualan/public-actions";

interface SnapCallbacks {
  onSuccess?: () => void;
  onPending?: () => void;
  onError?: () => void;
  onClose?: () => void;
}

declare global {
  interface Window {
    snap?: { pay: (token: string, callbacks: SnapCallbacks) => void };
  }
}

let snapScriptPromise: Promise<void> | null = null;

/** Muat snap.js Midtrans sekali per halaman. */
function loadSnap(scriptUrl: string, clientKey: string): Promise<void> {
  if (window.snap) return Promise.resolve();
  if (!snapScriptPromise) {
    snapScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = scriptUrl;
      script.setAttribute("data-client-key", clientKey);
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        snapScriptPromise = null;
        reject(new Error("snap.js gagal dimuat"));
      };
      document.head.appendChild(script);
    });
  }
  return snapScriptPromise;
}

/**
 * Tombol "Bayar Online" — membuka popup Midtrans Snap (QRIS, VA, e-wallet,
 * kartu), seperti CartView/PendingPaymentBanner IOM-ITB. Setelah popup
 * selesai/ditutup, status dicek langsung ke Midtrans lalu halaman dimuat ulang.
 */
export function OnlinePaymentButton({ token, autoStart = false, resume = false }: { token: string; autoStart?: boolean; resume?: boolean }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "loading" | "checking">("idle");
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  async function verifyAndRefresh() {
    setState("checking");
    await verifyOnlinePaymentAction(token).catch(() => null);
    setState("idle");
    router.refresh();
  }

  async function handlePay() {
    setError(null);
    setState("loading");
    const result = await startOnlinePaymentAction(token).catch(() => ({ error: "Koneksi bermasalah. Coba lagi." }));
    if ("error" in result) {
      setError(result.error);
      setState("idle");
      return;
    }
    if ("paid" in result) {
      setState("idle");
      router.refresh();
      return;
    }
    try {
      await loadSnap(result.snapScriptUrl, result.clientKey);
    } catch {
      setError("Halaman pembayaran gagal dimuat. Periksa koneksi lalu coba lagi.");
      setState("idle");
      return;
    }
    setState("idle");
    window.snap!.pay(result.snapToken, {
      onSuccess: verifyAndRefresh,
      onPending: verifyAndRefresh,
      onError: () => setError("Pembayaran gagal. Silakan coba lagi atau pilih metode lain."),
      onClose: verifyAndRefresh,
    });
  }

  useEffect(() => {
    if (!autoStart || started.current) return;
    started.current = true;
    // Dibuka otomatis setelah checkout dengan pilihan "Bayar online".
    const timer = window.setTimeout(() => void handlePay(), 300);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hanya sekali saat halaman dibuka
  }, [autoStart]);

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handlePay}
        disabled={state !== "idle"}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-700 px-5 py-3.5 text-base font-semibold text-white hover:bg-primary-800 disabled:opacity-60"
      >
        {state === "idle" ? <CreditCard className="h-5 w-5" aria-hidden="true" /> : <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />}
        {state === "checking" ? "Mengecek pembayaran…" : resume ? "Lanjutkan Pembayaran Online" : "Bayar Online"}
      </button>
      <p className="text-center text-xs text-neutral-500">QRIS · Virtual Account · GoPay/ShopeePay · Kartu — terkonfirmasi otomatis</p>
      {error && (
        <p role="alert" className="text-sm text-danger-600">
          {error}
        </p>
      )}
    </div>
  );
}
