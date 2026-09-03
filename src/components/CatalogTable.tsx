"use client";

import { useState } from "react";
import Link from "next/link";
import type { CatalogCandidateRow, Decision } from "@/lib/types";
import { DecisionStamp } from "./DecisionStamp";

const FILTERS: Array<{ id: Decision | "all"; label: string }> = [
  { id: "all", label: "All" },
  { id: "AUTHORIZE", label: "Authorize" },
  { id: "REFUSE", label: "Refuse" },
  { id: "UNVERIFIABLE", label: "Unverifiable" },
];

export function CatalogTable({ rows }: { rows: CatalogCandidateRow[] }) {
  const [filter, setFilter] = useState<Decision | "all">("all");
  const visible = filter === "all" ? rows : rows.filter((r) => r.decision === filter);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`rounded-full border px-3 py-1 text-[12px] font-medium transition ${
              filter === f.id ? "border-accent bg-accent text-accent-foreground" : "border-border text-ink-muted hover:text-ink"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full min-w-[640px] text-left text-[13px]">
          <thead className="border-b border-border text-[11px] uppercase tracking-wide text-ink-faint">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Candidate</th>
              <th className="px-4 py-2.5 font-semibold">Baseline eligible</th>
              <th className="px-4 py-2.5 font-semibold">HIREWALL decision</th>
              <th className="px-4 py-2.5 font-semibold">Reason</th>
              <th className="px-4 py-2.5 font-semibold">Freshness at run</th>
              <th className="px-4 py-2.5 font-semibold">Receipt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {visible.map((row) => (
              <tr key={row.candidateId}>
                <td className="px-4 py-2.5 font-medium text-ink">{row.name}</td>
                <td className="px-4 py-2.5 text-ink-muted">{row.baselineEligible ? "Yes" : "No"}</td>
                <td className="px-4 py-2.5">
                  <DecisionStamp decision={row.decision} size="sm" />
                </td>
                <td className="px-4 py-2.5 font-mono text-[12px] text-ink-muted">{row.refusalCode ?? "—"}</td>
                <td className="px-4 py-2.5 text-ink-muted">{row.attestationFreshnessAtRun}</td>
                <td className="px-4 py-2.5">
                  <Link href={`/receipts/${row.receiptId}`} className="font-medium text-accent hover:underline">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {visible.length === 0 ? (
          <p className="px-4 py-6 text-[13px] text-ink-muted">No candidates match this filter.</p>
        ) : null}
      </div>
    </div>
  );
}
