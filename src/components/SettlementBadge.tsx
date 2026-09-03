import type { SettlementState } from "@/lib/types";

const STYLES: Record<SettlementState, { bg: string; fg: string; label: string }> = {
  NOT_ATTEMPTED: { bg: "bg-settlement-idle-bg", fg: "text-settlement-idle", label: "NOT ATTEMPTED" },
  PENDING: { bg: "bg-settlement-pending-bg", fg: "text-settlement-pending", label: "PENDING" },
  SUCCEEDED: { bg: "bg-settlement-succeeded-bg", fg: "text-settlement-succeeded", label: "SUCCEEDED" },
  FAILED: { bg: "bg-settlement-failed-bg", fg: "text-settlement-failed", label: "FAILED" },
  UNKNOWN: { bg: "bg-settlement-unknown-bg", fg: "text-settlement-unknown", label: "UNKNOWN" },
};

// Deliberately styled as an outlined pill (not a solid stamp) so
// settlement state never reads as the same signal as the decision stamp.
export function SettlementBadge({ state }: { state: SettlementState }) {
  const s = STYLES[state];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-current/20 ${s.bg} ${s.fg} px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide`}
    >
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />
      {s.label}
    </span>
  );
}
