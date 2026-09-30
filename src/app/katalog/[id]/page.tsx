import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { ProductImage } from "@/components/produk/product-image";
import { getOrderWhatsAppNumber, orderWhatsAppLink, siteOrigin } from "@/lib/katalog";
import { getProductById } from "@/lib/supabase/repositories/products-repository";
import { formatRupiah } from "@/lib/utils";

interface KatalogDetailPageProps {
  params: Promise<{ id: string }>;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function loadActiveProduct(id: string) {
  if (!UUID_PATTERN.test(id)) return null;
  const product = await getProductById(id).catch(() => null);
  // Admin yang sedang login bisa membaca produk nonaktif lewat RLS — tetap
  // sembunyikan dari halaman publik.
  return product && product.isActive ? product : null;
}

export async function generateMetadata({ params }: KatalogDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await loadActiveProduct(id);
  if (!product) return { title: "Produk tidak ditemukan — MERAKIT" };
  return {
    title: `${product.name} — Katalog MERAKIT`,
    description: product.description.slice(0, 160) || `${product.name}, produk rajut Komunitas MERAKIT Bandung.`,
  };
}

export default async function KatalogDetailPage({ params }: KatalogDetailPageProps) {
  const { id } = await params;
  const product = await loadActiveProduct(id);
  if (!product) notFound();

  const whatsappNumber = getOrderWhatsAppNumber();
  const origin = siteOrigin();
  const pageUrl = origin ? `${origin}/katalog/${product.id}` : undefined;

  return (
    <div className="space-y-4">
      <Link href="/katalog" className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-600 hover:text-primary-700">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Kembali ke katalog
      </Link>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-neutral-200 bg-white">
          <ProductImage src={product.imageUrl} name={product.name} placeholderPadding="p-12" />
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">{product.category}</p>
            <h1 className="mt-1 text-2xl font-semibold text-neutral-800">{product.name}</h1>
            <p className="mt-2 text-2xl font-semibold text-primary-700">{formatRupiah(product.price)}</p>
            <p className="mt-1 text-sm text-neutral-500">
              {product.stock > 0 ? "Siap kirim" : "Saat ini kosong — bisa dipesan, dibuatkan oleh perajin kami."}
            </p>
          </div>

          {product.description && <p className="whitespace-pre-line text-sm leading-relaxed text-neutral-700">{product.description}</p>}

          {whatsappNumber ? (
            <a
              href={orderWhatsAppLink(whatsappNumber, product, pageUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl bg-success-600 px-5 py-3.5 text-base font-semibold text-white hover:opacity-90"
            >
              <MessageCircle className="h-5 w-5" aria-hidden="true" />
              Pesan via WhatsApp
            </a>
          ) : (
            <p className="rounded-lg bg-neutral-100 px-4 py-3 text-sm text-neutral-600">
              Untuk pemesanan, silakan kunjungi Kampung Wisata Rajut Binong, Jl. Binong Jati No. 124, Bandung.
            </p>
          )}

          <p className="text-xs text-neutral-400">
            Dirajut tangan oleh anggota Komunitas Rajut Inklusif MERAKIT. Warna & ukuran bisa sedikit berbeda karena dibuat
            satu per satu.
          </p>
        </div>
      </div>
    </div>
  );
}
