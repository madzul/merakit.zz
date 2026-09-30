"use client";

import { useRef, useState } from "react";
import { Camera, ImageOff, LoaderCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PRODUCT_IMAGE_BUCKET, isUploadedProductImage } from "@/lib/produk/images";
import { PRODUCT_IMAGE_OPTIONS, PRODUCT_PLACEHOLDER_IMAGE } from "@/lib/product-status";
import { cn } from "@/lib/utils";

interface ProductImageInputProps {
  value: string;
  onChange: (url: string) => void;
  onUploadingChange?: (uploading: boolean) => void;
}

const MAX_DIMENSION = 1200;

/** Perkecil & kompres foto di browser (maks. 1200 px, WebP/JPEG) sebelum diunggah. */
async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas tidak tersedia");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const toBlob = (type: string) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.85));
  const webp = await toBlob("image/webp");
  if (webp && webp.type === "image/webp") return webp;
  const jpeg = await toBlob("image/jpeg");
  if (!jpeg) throw new Error("Gagal memproses gambar");
  return jpeg;
}

/**
 * Pilih foto produk: unggah dari galeri/kamera (disimpan di Supabase Storage)
 * atau pakai gambar contoh. Foto lama di Storage dihapus server saat produk
 * disimpan dengan foto lain.
 */
export function ProductImageInput({ value, onChange, onUploadingChange }: ProductImageInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isUploaded = isUploadedProductImage(value);

  function setBusy(busy: boolean) {
    setUploading(busy);
    onUploadingChange?.(busy);
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Berkas harus berupa gambar (JPG, PNG, atau WebP).");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setError("Ukuran foto terlalu besar (maks. 15 MB sebelum dikompres).");
      return;
    }

    setBusy(true);
    try {
      const blob = await compressImage(file);
      const extension = blob.type === "image/webp" ? "webp" : "jpg";
      const path = `produk/${crypto.randomUUID()}.${extension}`;
      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from(PRODUCT_IMAGE_BUCKET)
        .upload(path, blob, { contentType: blob.type, cacheControl: "31536000", upsert: false });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(path);
      onChange(data.publicUrl);
    } catch {
      setError("Gagal mengunggah foto. Periksa koneksi lalu coba lagi.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
      <div className="relative aspect-square w-32 flex-shrink-0 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50">
        {/* eslint-disable-next-line @next/next/no-img-element -- pratinjau foto unggahan / placeholder lokal */}
        <img
          src={value || PRODUCT_PLACEHOLDER_IMAGE}
          alt="Pratinjau foto produk"
          className={cn("absolute inset-0 h-full w-full", isUploaded ? "object-cover" : "object-contain p-3")}
        />
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <LoaderCircle className="h-6 w-6 animate-spin text-primary-700" aria-label="Mengunggah" />
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <input
          ref={inputRef}
          id="product-photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(event) => handleFile(event.target.files?.[0])}
        />
        <div className="flex flex-wrap gap-2">
          <label
            htmlFor="product-photo"
            className={cn(
              "flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary-700 px-3.5 py-2 text-sm font-semibold text-white hover:bg-primary-800",
              uploading && "pointer-events-none opacity-60"
            )}
          >
            <Camera className="h-4 w-4" aria-hidden="true" />
            {isUploaded ? "Ganti Foto" : "Unggah Foto"}
          </label>
          {isUploaded && (
            <button
              type="button"
              onClick={() => onChange(PRODUCT_PLACEHOLDER_IMAGE)}
              disabled={uploading}
              className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3.5 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              <ImageOff className="h-4 w-4" aria-hidden="true" />
              Hapus Foto
            </button>
          )}
        </div>
        <p className="text-xs text-neutral-500">
          Foto dari galeri atau kamera HP. Otomatis diperkecil sebelum diunggah. Foto tampil di katalog publik.
        </p>
        {!isUploaded && (
          <div className="flex flex-col gap-1">
            <label htmlFor="placeholder-image" className="text-xs font-medium text-neutral-600">
              Atau pakai gambar contoh
            </label>
            <select
              id="placeholder-image"
              value={PRODUCT_IMAGE_OPTIONS.some((option) => option.value === value) ? value : ""}
              onChange={(event) => onChange(event.target.value)}
              className="w-full rounded-lg border border-neutral-200 bg-white py-2 pl-3 pr-8 text-sm text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40 sm:max-w-xs"
            >
              <option value="">— tanpa gambar —</option>
              {PRODUCT_IMAGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label.replace("Placeholder — ", "")}
                </option>
              ))}
            </select>
          </div>
        )}
        {error && (
          <p role="alert" className="text-xs text-danger-600">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
