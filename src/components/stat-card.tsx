import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StatCardTone } from "@/lib/types";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: StatCardTone;
  trend?: { value: string; direction: "up" | "down" };
  description?: string;
}

const toneStyles: Record<StatCardTone, string> = {
  primary: "bg-primary-50 text-primary-600",
  secondary: "bg-secondary-100 text-secondary-700",
  success: "bg-success-50 text-success-600",
  warning: "bg-warning-50 text-warning-600",
  danger: "bg-danger-50 text-danger-600",
  info: "bg-info-50 text-info-600",
};

export function StatCard({ label, value, icon: Icon, tone = "primary", trend, description }: StatCardProps) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-neutral-500">{label}</p>
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", toneStyles[tone])}>
          <Icon className="h-[18px] w-[18px]" />
        </div>
      </div>
      <p className="mt-3 text-2xl font-semibold text-neutral-800">{value}</p>
      {(trend || description) && (
        <div className="mt-2 flex items-center gap-1.5 text-xs">
          {trend && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 font-medium",
                trend.direction === "up" ? "text-success-600" : "text-danger-600"
              )}
            >
              {trend.direction === "up" ? (
                <ArrowUpRight className="h-3.5 w-3.5" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5" />
              )}
              {trend.value}
            </span>
          )}
          {description && <span className="text-neutral-400">{description}</span>}
        </div>
      )}
    </div>
  );
}
