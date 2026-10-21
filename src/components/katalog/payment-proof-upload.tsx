"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, LoaderCircle, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/image-compress";
import { attachPaymentProofAction } from "@/lib/penjualan/public-actions";
import { PAYMENT_PROOF_BUCKET } from "@/lib/penjualan/constants";

/**
 * Unggah foto/tangkapan layar bukti transfer. Berkas diperkecil di browser lalu
 * dikirim langsung ke bucket privat payment-proofs/<token>/ (hanya admin yang
 * bisa melihatnya), kemudian dicatat ke pesanan.
 */
export function PaymentProofUpload({ token, hasProof }: { token: string; hasProof: boolean }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<"idle" | "uploading" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Unggah foto atau tangkapan layar (JPG/PNG).");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setError("Ukuran berkas terlalu besar (maks. 15 MB sebelum dikompres).");
      return;
    }
    setState("uploading");
    try {
      const blob = await compressImage(file, 1600);
      const extension = blob.type === "image/webp" ? "webp" : "jpg";
      const path = `${token}/${Date.now()}.${extension}`;
      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from(PAYMENT_PROOF_BUCKET)
        .upload(path, blob, { contentType: blob.type, upsert: false });
      if (uploadError) throw uploadError;
      const result = await attachPaymentProofAction(token, path);
      if (result.error) {
        setError(result.error);
        setState("idle");
        return;
      }
      setState("done");
      router.refresh();
    } catch {
      setError("Gagal mengunggah bukti. Periksa koneksi lalu coba lagi.");
      setState("idle");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        id="bukti-bayar"
        onChange={(event) => handleFile(event.target.files?.[0])}
        disabled={state === "uploading"}
      />
      <label
        htmlFor="bukti-bayar"
        className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary-300 bg-primary-50 px-4 py-4 text-sm font-semibold text-primary-700 hover:bg-primary-100"
      >
        {state === "uploading" ? (
          <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
        ) : state === "done" ? (
          <Check className="h-5 w-5" aria-hidden="true" />
        ) : (
          <Upload className="h-5 w-5" aria-hidden="true" />
        )}
        {state === "uploading"
          ? "Mengunggah…"
          : state === "done"
            ? "Bukti terkirim — ganti berkas"
            : hasProof
              ? "Ganti bukti pembayaran"
              : "Unggah bukti pembayaran"}
      </label>
      {error && (
        <p role="alert" className="text-sm text-danger-600">
          {error}
        </p>
      )}
    </div>
  );
}
