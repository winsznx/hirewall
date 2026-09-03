import type { Decision } from "@/lib/types";

const STYLES: Record<Decision, { bg: string; border: string; fg: string; label: string }> = {
  AUTHORIZE: {
    bg: "bg-authorize-bg",
    border: "border-authorize-border",
    fg: "text-authorize",
    label: "AUTHORIZE",
  },
  REFUSE: {
    bg: "bg-refuse-bg",
    border: "border-refuse-border",
    fg: "text-refuse",
    label: "REFUSE",
  },
  UNVERIFIABLE: {
    bg: "bg-unverifiable-bg",
    border: "border-unverifiable-border",
    fg: "text-unverifiable",
    label: "UNVERIFIABLE",
  },
};

export function DecisionStamp({
  decision,
  size = "lg",
}: {
  decision: Decision;
  size?: "sm" | "lg";
}) {
  const s = STYLES[decision];
  const sizing = size === "lg" ? "px-4 py-2 text-lg" : "px-2.5 py-1 text-xs";
  return (
    <span
      role="status"
      className={`inline-flex items-center gap-2 rounded-lg border ${s.bg} ${s.border} ${s.fg} ${sizing} font-semibold tracking-tight`}
    >
      {s.label}
    </span>
  );
}
