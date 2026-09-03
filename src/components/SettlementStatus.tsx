import type { ExecutionView, SettlementState } from "@/lib/types";
import { SettlementBadge } from "./SettlementBadge";
import { HashValue } from "./HashValue";

const COPY: Record<SettlementState, string> = {
  NOT_ATTEMPTED: "No payment attempted.",
  PENDING: "Submitting paid request.",
  SUCCEEDED: "Payment succeeded.",
  FAILED: "The worker was authorized, but payment did not complete.",
  UNKNOWN: "Execution status is uncertain. HIREWALL will not blindly retry a paid request.",
};

export function SettlementStatus({
  settlement,
  execution,
}: {
  settlement: SettlementState;
  execution?: ExecutionView;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Settlement</p>
        <SettlementBadge state={settlement} />
      </div>
      <p className="mt-3 text-[13px] text-ink-muted">{COPY[settlement]}</p>

      {execution?.amount ? (
        <p className="mt-3 text-[13px] font-medium text-ink">
          {execution.amount} {execution.currency}
        </p>
      ) : null}

      {execution?.txId ? (
        <div className="mt-3 flex items-center gap-2">
          <HashValue value={execution.txId.slice(0, 10) + "…"} full={execution.txId} label="transaction hash" />
          {execution.explorerUrl ? (
            <a
              href={execution.explorerUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[12px] font-medium text-accent hover:underline"
            >
              View on explorer
            </a>
          ) : null}
        </div>
      ) : null}

      {execution?.x402RequestId ? (
        <p className="mt-2 text-[12px] text-ink-faint">x402 request {execution.x402RequestId}</p>
      ) : null}
    </div>
  );
}
