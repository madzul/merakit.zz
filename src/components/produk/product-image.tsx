import { isUploadedProductImage } from "@/lib/produk/images";
import { PRODUCT_PLACEHOLDER_IMAGE } from "@/lib/product-status";
import { cn } from "@/lib/utils";

interface ProductImageProps {
  src: string;
  name: string;
  /** Jarak dalam untuk gambar contoh (placeholder), mis. "p-6". */
  placeholderPadding?: string;
  className?: string;
}

/**
 * Gambar produk dalam wadah `relative` berukuran tetap. Foto unggahan
 * memenuhi bingkai (object-cover); gambar contoh ditampilkan utuh dengan jarak.
 */
export function ProductImage({ src, name, placeholderPadding = "p-6", className }: ProductImageProps) {
  const isPhoto = isUploadedProductImage(src);
  return (
    // eslint-disable-next-line @next/next/no-img-element -- foto dari Supabase Storage / SVG lokal; tanpa next/image agar tidak perlu remotePatterns
    <img
      src={src || PRODUCT_PLACEHOLDER_IMAGE}
      alt={isPhoto ? `Foto produk ${name}` : `Ilustrasi produk ${name}`}
      loading="lazy"
      className={cn("absolute inset-0 h-full w-full", isPhoto ? "object-cover" : `object-contain ${placeholderPadding}`, className)}
    />
  );
}
