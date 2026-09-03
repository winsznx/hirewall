"use client";

import { useState } from "react";
import { hirewallApi } from "@/lib/api/client";
import { DecisionStamp } from "@/components/DecisionStamp";
import type { ReceiptVerification } from "@/lib/types";

const STATUS_LABEL: Record<string, string> = {
  pass: "PASS",
  fail: "FAIL",
  not_claimed: "NOT CLAIMED",
};

const STATUS_STYLE: Record<string, string> = {
  pass: "text-authorize",
  fail: "text-refuse",
  not_claimed: "text-ink-faint",
};

export default function VerifyPage() {
  const [tab, setTab] = useState<"id" | "json">("id");
  const [receiptId, setReceiptId] = useState("");
  const [receiptJson, setReceiptJson] = useState("");
  const [result, setResult] = useState<ReceiptVerification | null>(null);
  const [checking, setChecking] = useState(false);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setChecking(true);
    try {
      const res = await hirewallApi.verifyReceipt(
        tab === "id" ? { receiptId: receiptId.trim() } : { receiptJson }
      );
      setResult(res);
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-xl font-semibold tracking-tight text-ink">Receipt verifier</h1>
      <p className="mt-1 text-[13px] text-ink-muted">
        Independently recompute a HIREWALL receipt&rsquo;s integrity and decision.
      </p>

      <div className="mt-6 inline-flex rounded-lg border border-border bg-surface p-1">
        {(["id", "json"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-md px-3.5 py-1.5 text-[13px] font-medium transition ${
              tab === t ? "bg-canvas text-ink" : "text-ink-muted hover:text-ink"
            }`}
          >
            {t === "id" ? "Receipt URL / ID" : "Paste receipt JSON"}
          </button>
        ))}
      </div>

      <form onSubmit={handleVerify} className="mt-4 space-y-3 rounded-xl border border-border bg-surface p-5">
        {tab === "id" ? (
          <input
            required
            value={receiptId}
            onChange={(e) => setReceiptId(e.target.value)}
            placeholder="rcpt_valid_authorized"
            className="w-full rounded-md border border-border-strong bg-canvas px-3 py-2 font-mono text-[13px] text-ink outline-none focus:border-accent"
          />
        ) : (
          <textarea
            required
            value={receiptJson}
            onChange={(e) => setReceiptJson(e.target.value)}
            rows={8}
            placeholder="{ ...receipt JSON... }"
            className="w-full rounded-md border border-border-strong bg-canvas px-3 py-2 font-mono text-[12px] text-ink outline-none focus:border-accent"
          />
        )}
        <button
          type="submit"
          disabled={checking}
          className="rounded-lg bg-accent px-4 py-2 text-[13px] font-semibold text-accent-foreground transition hover:bg-accent-strong disabled:opacity-60"
        >
          {checking ? "Verifying…" : "Verify"}
        </button>
      </form>

      {result ? (
        <div className="mt-6 rounded-xl border border-border bg-surface p-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[13px] font-medium text-ink">Dispatch decision:</span>
            <DecisionStamp decision={result.decision} size="sm" />
            {result.refusalCode ? <span className="font-mono text-[12px] text-ink-faint">{result.refusalCode}</span> : null}
          </div>
          <ul className="mt-4 divide-y divide-border">
            {result.checks.map((c) => (
              <li key={c.id} className="flex flex-col gap-1 py-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-medium text-ink">{c.label}</span>
                  <span className={`text-[11px] font-semibold tracking-wide ${STATUS_STYLE[c.status]}`}>
                    {STATUS_LABEL[c.status]}
                  </span>
                </div>
                {c.status === "not_claimed" && c.detail ? (
                  <p className="text-[12px] text-ink-muted">{c.detail}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
