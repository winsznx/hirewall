"use client";

import { useState } from "react";
import Link from "next/link";
import { hirewallApi } from "@/lib/api/client";
import { PROOF_LAB_SCENARIOS } from "@/lib/api/fixture-data";
import { DecisionStamp } from "@/components/DecisionStamp";
import { VerificationChecklist } from "@/components/VerificationChecklist";
import type { ProofLabRun } from "@/lib/types";

const SOURCE_FIXTURES = [{ id: "valid_authorized", label: "Courier-7 — valid, authorized" }];

export default function ProofLabPage() {
  const [sourceFixtureId, setSourceFixtureId] = useState(SOURCE_FIXTURES[0].id);
  const [scenarioId, setScenarioId] = useState(PROOF_LAB_SCENARIOS[1].id);
  const [run, setRun] = useState<ProofLabRun | null>(null);
  const [running, setRunning] = useState(false);

  const scenario = PROOF_LAB_SCENARIOS.find((s) => s.id === scenarioId)!;

  async function handleRun() {
    setRunning(true);
    try {
      const result = await hirewallApi.runProofLab({ sourceFixtureId, scenarioId });
      setRun(result);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <span className="inline-flex items-center rounded-full border border-unverifiable-border bg-unverifiable-bg px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-unverifiable">
        Controlled fault injection
      </span>
      <h1 className="mt-3 text-xl font-semibold tracking-tight text-ink">Challenge the dispatch gate.</h1>
      <p className="mt-1 text-[13px] text-ink-muted">
        Run the same verifier and authorization logic against controlled failure cases.
      </p>

      <div className="mt-6 space-y-4 rounded-xl border border-border bg-surface p-5">
        <div>
          <label htmlFor="source" className="block text-[13px] font-medium text-ink">
            Source fixture
          </label>
          <select
            id="source"
            value={sourceFixtureId}
            onChange={(e) => setSourceFixtureId(e.target.value)}
            className="mt-1.5 w-full rounded-md border border-border-strong bg-canvas px-3 py-2 text-[14px] text-ink outline-none focus:border-accent"
          >
            {SOURCE_FIXTURES.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="scenario" className="block text-[13px] font-medium text-ink">
            Scenario
          </label>
          <select
            id="scenario"
            value={scenarioId}
            onChange={(e) => {
              setScenarioId(e.target.value);
              setRun(null);
            }}
            className="mt-1.5 w-full rounded-md border border-border-strong bg-canvas px-3 py-2 text-[14px] text-ink outline-none focus:border-accent"
          >
            {PROOF_LAB_SCENARIOS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-[12px] text-ink-muted">{scenario.description}</p>
        </div>

        <button
          type="button"
          onClick={handleRun}
          disabled={running}
          className="w-full rounded-lg bg-accent px-4 py-2.5 text-[14px] font-semibold text-accent-foreground transition hover:bg-accent-strong disabled:opacity-60"
        >
          {running ? "Running…" : "Run"}
        </button>
      </div>

      {run ? (
        <div className="mt-6 space-y-6 rounded-xl border border-border bg-surface p-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Mutation</p>
            <dl className="mt-2 space-y-1 text-[13px]">
              <div className="flex gap-2">
                <dt className="shrink-0 text-ink-faint">Changed:</dt>
                <dd className="text-ink">{run.mutation.description}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="shrink-0 text-ink-faint">Expected:</dt>
                <dd className="text-ink">{run.mutation.expected}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="shrink-0 text-ink-faint">Observed:</dt>
                <dd className="font-mono text-ink">{run.mutation.observed}</dd>
              </div>
            </dl>
          </div>

          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Verification</p>
            <VerificationChecklist checks={run.verification} />
          </div>

          <div>
            <DecisionStamp decision={run.decision} size="sm" />
            {run.refusalCode ? <span className="ml-2 font-mono text-[12px] text-ink-faint">{run.refusalCode}</span> : null}
          </div>

          <div className="flex items-center gap-3 border-t border-border pt-4">
            <Link href={`/receipts/${run.receiptId}`} className="text-[13px] font-medium text-accent hover:underline">
              View fault-injection receipt →
            </Link>
            <Link href="/verify" className="text-[13px] font-medium text-accent hover:underline">
              Verify receipt →
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
