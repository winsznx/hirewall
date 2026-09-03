"use client";

import { useEffect, useState } from "react";
import type { AuthorizationView } from "@/lib/types";
import { HashValue } from "./HashValue";

const STATUS_STYLE: Record<AuthorizationView["status"], string> = {
  ACTIVE: "text-authorize",
  EXPIRED: "text-ink-faint",
  REVOKED: "text-refuse",
  CONSUMED: "text-settlement-pending",
};

function useCountdown(expiresAt: string, active: boolean) {
  const [remainingMs, setRemainingMs] = useState(() => new Date(expiresAt).getTime() - Date.now());

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => {
      setRemainingMs(new Date(expiresAt).getTime() - Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, [expiresAt, active]);

  return remainingMs;
}

function formatRemaining(ms: number): string {
  if (ms <= 0) return "expired";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
}

export function AuthorizationLease({
  authorization,
  workerName,
}: {
  authorization: AuthorizationView;
  workerName?: string;
}) {
  const active = authorization.status === "ACTIVE";
  const remainingMs = useCountdown(authorization.expiresAt, active);
  const expired = active && remainingMs <= 0;
  const displayStatus = expired ? "EXPIRED" : authorization.status;

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Authorization</p>
        <span className={`text-[11px] font-semibold tracking-wide ${STATUS_STYLE[expired ? "EXPIRED" : authorization.status]}`}>
          {displayStatus}
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-[13px]">
        <div>
          <dt className="text-ink-faint">Worker</dt>
          <dd className="mt-0.5 font-medium text-ink">{workerName ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-ink-faint">Max amount</dt>
          <dd className="mt-0.5 font-medium text-ink">
            {authorization.amount} {authorization.currency}
          </dd>
        </div>
        <div>
          <dt className="text-ink-faint">Network</dt>
          <dd className="mt-0.5 font-medium text-ink">{authorization.network}</dd>
        </div>
        <div>
          <dt className="text-ink-faint">Authorization ID</dt>
          <dd className="mt-0.5">
            <HashValue value={authorization.id} label="authorization ID" />
          </dd>
        </div>
        <div>
          <dt className="text-ink-faint">Attestation hash</dt>
          <dd className="mt-0.5">
            <HashValue value={authorization.attestationHash} label="attestation hash" />
          </dd>
        </div>
        <div>
          <dt className="text-ink-faint">Policy hash</dt>
          <dd className="mt-0.5">
            <HashValue value={authorization.policyHash} label="policy hash" />
          </dd>
        </div>
      </dl>

      {active && !expired ? (
        <p className="mt-4 border-t border-border pt-4 text-[13px] font-medium text-ink">
          Expires in <span className="font-mono">{formatRemaining(remainingMs)}</span>
        </p>
      ) : expired ? (
        <div className="mt-4 border-t border-border pt-4">
          <p className="text-[13px] font-medium text-ink">Authorization expired</p>
          <p className="mt-1 text-[13px] text-ink-muted">Re-verify before dispatch.</p>
        </div>
      ) : (
        <p className="mt-4 border-t border-border pt-4 text-[13px] text-ink-muted">
          {authorization.status === "CONSUMED"
            ? "This authorization was consumed by a completed dispatch."
            : authorization.status === "REVOKED"
              ? "This authorization was revoked."
              : "This authorization is no longer active."}
        </p>
      )}
    </div>
  );
}
