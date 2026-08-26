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
 * Lambang/placeholder logo MERAKIT — ilustrasi gulungan benang & jarum rajut,
 * mengikuti referensi screenshot desain (skrinshoot_sistem_merakit.pdf).
 * Komponen berdiri sendiri (tidak dipakai dashboard-sidebar.tsx), sehingga
 * penyesuaian visualnya tidak mengubah tampilan dashboard yang sudah ada.
 */
export function MerakitLogo({ size = "sm", showWordmark = true, className }: MerakitLogoProps) {
  return (
    <div className={cn("flex flex-col items-center", className)}>
      <svg
        viewBox="0 0 64 56"
        className={cn("flex-shrink-0", MARK_SIZE[size])}
        role="img"
        aria-label="Logo MERAKIT"
      >
        {/* Jarum rajut menyilang */}
        <line x1="12" y1="48" x2="43" y2="8" stroke="#4B4B48" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="43" cy="8" r="2.6" fill="#3F9686" />
        <line x1="52" y1="48" x2="21" y2="8" stroke="#4B4B48" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="21" cy="8" r="2.6" fill="#C2A05F" />

        {/* Gulungan benang */}
        <circle cx="32" cy="38" r="17" fill="#8D7CB8" />
        <path
          d="M17 34c6 8 24 8 30 0"
          fill="none"
          stroke="#6E5DA0"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.55"
        />
        <path
          d="M18 42c7 6 21 6 28 0"
          fill="none"
          stroke="#6E5DA0"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.4"
        />
        <path
          d="M22 24c4-2 16-2 20 0"
          fill="none"
          stroke="#6E5DA0"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.45"
        />

        {/* Aksen daun */}
        <path d="M41 46c4-2 6-6 4-10-4 2-6 6-4 10z" fill="#62B0A0" />
      </svg>

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
