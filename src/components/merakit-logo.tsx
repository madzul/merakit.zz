import { Icon } from "lucide-react";
import { yarnBall } from "@lucide/lab";
import { cn } from "@/lib/utils";

interface MerakitLogoProps {
  /** Ukuran lambang. "sm" untuk konteks padat, "lg" untuk halaman auth. */
  size?: "sm" | "lg";
  /** Tampilkan nama & tagline di bawah lambang. */
  showWordmark?: boolean;
  className?: string;
}

const MARK_SIZE: Record<NonNullable<MerakitLogoProps["size"]>, string> = {
  sm: "h-10 w-10",
  lg: "h-16 w-16",
};

const WORDMARK_SIZE: Record<NonNullable<MerakitLogoProps["size"]>, string> = {
  sm: "text-sm",
  lg: "text-xl",
};

const TAGLINE_SIZE: Record<NonNullable<MerakitLogoProps["size"]>, string> = {
  sm: "text-[11px]",
  lg: "text-sm",
};

/**
 * Lambang logo MERAKIT — ikon gulungan benang (yarnBall) dari @lucide/lab,
 * dipakai konsisten dengan ikon Lucide lain di seluruh aplikasi (lihat
 * src/lib/navigation.ts). Ikon lab ini monokrom (stroke tunggal, ikut warna
 * teks lewat currentColor) — beda dari ilustrasi multi-warna versi
 * sebelumnya, jadi warnanya diatur lewat kelas Tailwind (text-primary-600)
 * bukan hardcode di dalam SVG.
 */
export function MerakitLogo({ size = "sm", showWordmark = true, className }: MerakitLogoProps) {
  return (
    <div className={cn("flex flex-col items-center", className)}>
      <Icon
        iconNode={yarnBall}
        className={cn("flex-shrink-0 text-primary-600", MARK_SIZE[size])}
        strokeWidth={1.75}
        aria-label="Logo MERAKIT"
      />

      {showWordmark && (
        <div className="mt-2 text-center">
          <p className={cn("font-bold leading-tight tracking-wide text-neutral-800", WORDMARK_SIZE[size])}>
            MERAKIT
          </p>
          <p className={cn("leading-tight text-neutral-500", TAGLINE_SIZE[size])}>Merajut Asa Kita</p>
        </div>
      )}
    </div>
  );
}
