/** Utilitas URL foto produk — aman dipakai di server maupun browser. */

export const PRODUCT_IMAGE_BUCKET = "product-images";

function bucketPublicPrefix(): string {
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
  return `${base}/storage/v1/object/public/${PRODUCT_IMAGE_BUCKET}/`;
}

/** Foto hasil unggah ke bucket Supabase milik project ini. */
export function isUploadedProductImage(url: string): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) && url.startsWith(bucketPublicPrefix());
}

/**
 * Hanya terima gambar placeholder lokal atau foto di bucket project sendiri —
 * mencegah URL eksternal sembarangan tersimpan dan tampil di katalog publik.
 */
export function isAllowedProductImage(url: string): boolean {
  if (url === "") return true;
  if (/^\/products\/[\w.-]+\.(svg|png|jpe?g|webp)$/.test(url)) return true;
  return isUploadedProductImage(url) && !url.includes("..");
}

/** Path objek di dalam bucket dari URL publiknya, atau null bila bukan foto unggahan. */
export function storagePathFromUrl(url: string): string | null {
  if (!isUploadedProductImage(url)) return null;
  return decodeURIComponent(url.slice(bucketPublicPrefix().length).split("?")[0]);
}
