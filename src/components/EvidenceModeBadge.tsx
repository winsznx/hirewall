import type { EvidenceMode } from "@/lib/types";

const LABEL: Record<EvidenceMode, string> = {
  live: "LIVE",
  fixture: "FIXTURE",
  fault_injection: "CONTROLLED FAULT INJECTION",
};

const STYLE: Record<EvidenceMode, string> = {
  live: "border-authorize-border bg-authorize-bg text-authorize",
  fixture: "border-border-strong bg-canvas text-ink-muted",
  fault_injection: "border-unverifiable-border bg-unverifiable-bg text-unverifiable",
};

export function EvidenceModeBadge({ mode }: { mode: EvidenceMode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${STYLE[mode]}`}
    >
      {LABEL[mode]}
    </span>
  );
}
