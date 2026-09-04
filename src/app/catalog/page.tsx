import { hirewallApi } from "@/lib/api/client";
import { EmptyState } from "@/components/EmptyState";
import { CatalogTable } from "@/components/CatalogTable";
import { HashValue } from "@/components/HashValue";
import { EvidenceModeBadge } from "@/components/EvidenceModeBadge";

export default async function CatalogPage() {
  const run = await hirewallApi.getLatestCatalogRun();

  if (!run) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <EmptyState title="No catalog run yet" description="No frozen field run has been published yet." />
      </div>
    );
  }

  const total = run.counts.authorize + run.counts.refuse + run.counts.unverifiable;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="flex items-center gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Frozen Orion catalog run</p>
        <EvidenceModeBadge mode={run.evidenceMode} />
      </div>
      <h1 className="mt-1 text-xl font-semibold tracking-tight text-ink">
        {run.runTimestamp} · {run.cohortDenominator} candidates
      </h1>

      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl border border-border bg-surface p-5 text-[13px] sm:grid-cols-3">
        <div>
          <dt className="text-ink-faint">Snapshot</dt>
          <dd>
            <HashValue value={run.snapshotHash} label="snapshot hash" />
          </dd>
        </div>
        <div>
          <dt className="text-ink-faint">Software commit</dt>
          <dd className="font-mono text-ink">{run.softwareCommit}</dd>
        </div>
        <div>
          <dt className="text-ink-faint">Policy</dt>
          <dd className="font-medium text-ink">
            Max {run.policy.maxSpend} {run.policy.currency} · {run.policy.network}
          </dd>
        </div>
        <div className="col-span-2 sm:col-span-3">
          <dt className="text-ink-faint">Baseline rule</dt>
          <dd className="text-ink">{run.baselineRule}</dd>
        </div>
        <div className="col-span-2 sm:col-span-3">
          <dt className="text-ink-faint">HIREWALL rule</dt>
          <dd className="text-ink">{run.hirewallRule}</dd>
        </div>
      </dl>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-authorize-border bg-authorize-bg px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-authorize">Authorize</p>
          <p className="mt-1 text-2xl font-semibold text-authorize">{run.counts.authorize}</p>
          <p className="text-[12px] text-authorize/80">of {total}</p>
        </div>
        <div className="rounded-lg border border-refuse-border bg-refuse-bg px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-refuse">Refuse</p>
          <p className="mt-1 text-2xl font-semibold text-refuse">{run.counts.refuse}</p>
          <p className="text-[12px] text-refuse/80">of {total}</p>
        </div>
        <div className="rounded-lg border border-unverifiable-border bg-unverifiable-bg px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-unverifiable">Unverifiable</p>
          <p className="mt-1 text-2xl font-semibold text-unverifiable">{run.counts.unverifiable}</p>
          <p className="text-[12px] text-unverifiable/80">of {total}</p>
        </div>
      </div>

      <div className="mt-8">
        <CatalogTable rows={run.candidates} />
      </div>

      <div className="mt-6 flex flex-wrap gap-4 text-[13px] font-medium text-accent">
        <a href="#" className="hover:underline">
          Download raw JSON
        </a>
        <a href="#" className="hover:underline">
          Reproduce run
        </a>
        <a href="#" className="hover:underline">
          Methodology
        </a>
        <a href="#" className="hover:underline">
          How could this result be misleading?
        </a>
      </div>
    </div>
  );
}
