import type { VerificationCheck, VerificationCheckStatus } from "@/lib/types";

const STATUS_LABEL: Record<VerificationCheckStatus, string> = {
  pending: "PENDING",
  active: "CHECKING",
  pass: "PASS",
  fail: "FAIL",
  skipped: "SKIPPED",
  unavailable: "UNAVAILABLE",
};

const STATUS_STYLE: Record<VerificationCheckStatus, string> = {
  pending: "text-ink-faint",
  active: "text-accent",
  pass: "text-authorize",
  fail: "text-refuse",
  skipped: "text-ink-faint",
  unavailable: "text-unverifiable",
};

export function VerificationChecklist({ checks }: { checks: VerificationCheck[] }) {
  if (checks.length === 0) {
    return <p className="text-[13px] text-ink-muted">No verification steps were run for this workflow.</p>;
  }

  return (
    <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
      {checks.map((check) => (
        <li key={check.id} className="flex flex-col gap-1 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[13px] font-medium text-ink">{check.label}</span>
            <span className={`text-[11px] font-semibold tracking-wide ${STATUS_STYLE[check.status]}`}>
              {STATUS_LABEL[check.status]}
            </span>
          </div>
          {check.status === "fail" && (check.expected || check.observed || check.code) ? (
            <div className="mt-1 space-y-0.5 text-[12px] text-ink-muted">
              {check.code ? (
                <p>
                  Code: <span className="font-mono text-ink">{check.code}</span>
                </p>
              ) : null}
              {check.expected ? <p>Expected: {check.expected}</p> : null}
              {check.observed ? <p>Observed: {check.observed}</p> : null}
            </div>
          ) : null}
          {check.detail ? <p className="mt-0.5 text-[12px] text-ink-muted">{check.detail}</p> : null}
        </li>
      ))}
    </ul>
  );
}
