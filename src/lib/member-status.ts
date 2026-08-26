import type { MemberStatus } from "@/lib/types";

export const MEMBER_STATUS_LABELS: Record<MemberStatus, string> = {
  aktif: "Aktif",
  nonaktif: "Nonaktif",
};

export const MEMBER_STATUS_BADGE_STYLES: Record<MemberStatus, string> = {
  aktif: "bg-success-50 text-success-600",
  nonaktif: "bg-neutral-200 text-neutral-600",
};

export const MEMBER_STATUS_OPTIONS: { value: MemberStatus; label: string }[] = (
  Object.keys(MEMBER_STATUS_LABELS) as MemberStatus[]
).map((value) => ({ value, label: MEMBER_STATUS_LABELS[value] }));

export const MEMBER_STATUS_FILTER_OPTIONS: { value: MemberStatus | "semua"; label: string }[] = [
  { value: "semua", label: "Semua Status" },
  ...MEMBER_STATUS_OPTIONS,
];
