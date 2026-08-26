import { AlertTriangle, RotateCcw } from "lucide-react";

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

/**
 * Error state untuk simulasi kegagalan memuat data (data dummy, belum
 * terhubung backend/Supabase sungguhan).
 */
export function ErrorState({ message, onRetry, retryLabel = "Coba Lagi" }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-danger-200 bg-danger-50/40 px-6 py-12 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-danger-50 text-danger-600">
        <AlertTriangle className="h-5 w-5" aria-hidden="true" />
      </div>
      <p className="max-w-sm text-sm text-neutral-600">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3.5 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          {retryLabel}
        </button>
      )}
    </div>
  );
}
