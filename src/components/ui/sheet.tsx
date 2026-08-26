"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  side?: "left" | "right";
  title?: string;
}

export function Sheet({ open, onOpenChange, children, side = "left", title }: SheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onOpenChange]);

  return (
    <div
      className={cn("fixed inset-0 z-50 lg:hidden", open ? "pointer-events-auto" : "pointer-events-none")}
      aria-hidden={!open}
    >
      <div
        onClick={() => onOpenChange(false)}
        className={cn(
          "absolute inset-0 bg-neutral-900/40 transition-opacity duration-200",
          open ? "opacity-100" : "opacity-0"
        )}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "absolute top-0 h-full w-72 max-w-[85vw] bg-white shadow-card-hover transition-transform duration-200 ease-out",
          side === "left" ? "left-0" : "right-0",
          open ? "translate-x-0" : side === "left" ? "-translate-x-full" : "translate-x-full"
        )}
      >
        <button
          onClick={() => onOpenChange(false)}
          aria-label="Tutup menu"
          className="absolute right-3 top-3 rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="h-full overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
