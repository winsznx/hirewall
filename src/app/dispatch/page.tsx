"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { hirewallApi } from "@/lib/api/client";
import { EmptyState } from "@/components/EmptyState";

const EXAMPLES: Array<{ id: string; label: string }> = [
  { id: "valid_authorized", label: "Authorized dispatch" },
  { id: "attestation_expired", label: "Refused — expired credential" },
  { id: "wallet_mismatch", label: "Refused — wallet mismatch" },
  { id: "dependency_unavailable", label: "Unverifiable — dependency unavailable" },
  { id: "fallback_first_refused_second_authorized", label: "Fallback — first refused, second authorized" },
  { id: "all_candidates_rejected", label: "All candidates rejected" },
];

export default function DispatchWorkspacePage() {
  const router = useRouter();
  const [mode, setMode] = useState<"find" | "check">("find");
  const [task, setTask] = useState("");
  const [budget, setBudget] = useState("0.10");
  const [category, setCategory] = useState("");
  const [allowFallback, setAllowFallback] = useState(true);
  const [workerIdentifier, setWorkerIdentifier] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!task.trim()) return;
    setSubmitting(true);
    try {
      const { workflowId } = await hirewallApi.createDispatch({
        mode,
        task,
        maxBudget: budget,
        category: category || undefined,
        allowFallback,
        workerIdentifier: mode === "check" ? workerIdentifier : undefined,
      });
      router.push(`/dispatch/${workflowId}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-xl font-semibold tracking-tight text-ink">Dispatch a task</h1>
      <p className="mt-1 text-[13px] text-ink-muted">
        Describe a task or check a specific Orion worker. HIREWALL verifies identity before any payment authority
        is created.
      </p>

      <div className="mt-6 inline-flex rounded-lg border border-border bg-surface p-1">
        {(["find", "check"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`rounded-md px-3.5 py-1.5 text-[13px] font-medium transition ${
              mode === m ? "bg-canvas text-ink" : "text-ink-muted hover:text-ink"
            }`}
          >
            {m === "find" ? "Find a worker" : "Check a specific worker"}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4 rounded-xl border border-border bg-surface p-5">
        <div>
          <label htmlFor="task" className="block text-[13px] font-medium text-ink">
            Task
          </label>
          <textarea
            id="task"
            required
            value={task}
            onChange={(e) => setTask(e.target.value)}
            rows={2}
            className="mt-1.5 w-full rounded-md border border-border-strong bg-canvas px-3 py-2 text-[14px] text-ink outline-none focus:border-accent"
            placeholder="Deliver a signed package to 44 Harbor St by 6pm"
          />
        </div>

        {mode === "check" ? (
          <div>
            <label htmlFor="workerIdentifier" className="block text-[13px] font-medium text-ink">
              Orion slug, wallet, or listing identifier
            </label>
            <input
              id="workerIdentifier"
              required
              value={workerIdentifier}
              onChange={(e) => setWorkerIdentifier(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-border-strong bg-canvas px-3 py-2 text-[14px] text-ink outline-none focus:border-accent"
              placeholder="courier-7"
            />
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="budget" className="block text-[13px] font-medium text-ink">
              Max budget (USDC)
            </label>
            <input
              id="budget"
              required
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              inputMode="decimal"
              className="mt-1.5 w-full rounded-md border border-border-strong bg-canvas px-3 py-2 text-[14px] text-ink outline-none focus:border-accent"
            />
          </div>
          {mode === "find" ? (
            <div>
              <label htmlFor="category" className="block text-[13px] font-medium text-ink">
                Category <span className="text-ink-faint">(optional)</span>
              </label>
              <input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-border-strong bg-canvas px-3 py-2 text-[14px] text-ink outline-none focus:border-accent"
                placeholder="logistics.courier"
              />
            </div>
          ) : null}
        </div>

        {mode === "find" ? (
          <label className="flex items-center gap-2 text-[13px] text-ink">
            <input
              type="checkbox"
              checked={allowFallback}
              onChange={(e) => setAllowFallback(e.target.checked)}
              className="h-4 w-4 rounded border-border-strong accent-accent"
            />
            Allow fallback to the next eligible candidate
          </label>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-accent px-4 py-2.5 text-[14px] font-semibold text-accent-foreground transition hover:bg-accent-strong disabled:opacity-60"
        >
          {submitting ? "Dispatching…" : "Dispatch"}
        </button>
      </form>

      <div className="mt-10">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
          Development fixture scenarios
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.id}
              type="button"
              onClick={() => router.push(`/dispatch/${ex.id}`)}
              className="rounded-lg border border-border bg-surface px-3.5 py-2.5 text-left text-[13px] font-medium text-ink transition hover:border-border-strong"
            >
              {ex.label}
            </button>
          ))}
        </div>
      </div>

      {!task ? (
        <div className="mt-8">
          <EmptyState title="No workflow yet" description="Describe a task or check a specific Orion worker." />
        </div>
      ) : null}
    </div>
  );
}
