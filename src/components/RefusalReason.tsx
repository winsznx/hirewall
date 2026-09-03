import type { Decision } from "@/lib/types";

export function RefusalReason({
  decision,
  code,
  detail,
}: {
  decision: Decision;
  code?: string;
  detail?: string;
}) {
  if (decision === "AUTHORIZE" || !code) return null;

  const tone = decision === "UNVERIFIABLE" ? "text-unverifiable" : "text-refuse";

  return (
    <div className="mt-2">
      <p className={`text-[13px] font-semibold tracking-wide ${tone}`}>{code}</p>
      {detail ? <p className="mt-1 max-w-md text-[13px] leading-relaxed text-ink-muted">{detail}</p> : null}
    </div>
  );
}
