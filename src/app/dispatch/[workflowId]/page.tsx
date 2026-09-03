import Link from "next/link";
import { notFound } from "next/navigation";
import { hirewallApi } from "@/lib/api/client";
import { DecisionStamp } from "@/components/DecisionStamp";
import { EvidenceModeBadge } from "@/components/EvidenceModeBadge";
import { VerificationChecklist } from "@/components/VerificationChecklist";
import { RefusalReason } from "@/components/RefusalReason";
import { AuthorizationLease } from "@/components/AuthorizationLease";
import { SettlementStatus } from "@/components/SettlementStatus";
import { HashValue } from "@/components/HashValue";

export default async function DispatchWorkflowPage({
  params,
}: {
  params: Promise<{ workflowId: string }>;
}) {
  const { workflowId } = await params;
  const workflow = await hirewallApi.getDispatch(workflowId);

  if (!workflow) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Dispatch workflow</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-ink">{workflow.task}</h1>
        </div>
        <EvidenceModeBadge mode={workflow.evidenceMode} />
      </div>

      {/* Policy summary */}
      <div className="mt-6 rounded-xl border border-border bg-surface p-5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Dispatch policy</p>
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-[13px] sm:grid-cols-4">
          <div>
            <dt className="text-ink-faint">Network</dt>
            <dd className="font-medium text-ink">{workflow.policy.network}</dd>
          </div>
          <div>
            <dt className="text-ink-faint">Max spend</dt>
            <dd className="font-medium text-ink">
              {workflow.policy.maxSpend} {workflow.policy.currency}
            </dd>
          </div>
          <div>
            <dt className="text-ink-faint">Fresh attestation</dt>
            <dd className="font-medium text-ink">{workflow.policy.freshAttestationRequired ? "Required" : "—"}</dd>
          </div>
          <div>
            <dt className="text-ink-faint">Wallet match</dt>
            <dd className="font-medium text-ink">{workflow.policy.walletMatchRequired ? "Required" : "—"}</dd>
          </div>
        </dl>
      </div>

      {/* Attempted candidates (agent loop) */}
      {workflow.attemptedCandidates && workflow.attemptedCandidates.length > 0 ? (
        <div className="mt-6">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
            Candidates inspected: {workflow.attemptedCandidates.length}
          </p>
          <ul className="mt-2 space-y-2">
            {workflow.attemptedCandidates.map((attempt) => (
              <li
                key={attempt.candidate.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-2.5"
              >
                <span className="text-[13px] font-medium text-ink">{attempt.candidate.name}</span>
                <span className="flex items-center gap-2">
                  <DecisionStamp decision={attempt.decision} size="sm" />
                  {attempt.refusalCode ? (
                    <span className="font-mono text-[11px] text-ink-faint">{attempt.refusalCode}</span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Decision */}
      <div className="mt-8">
        {workflow.decision ? (
          <>
            <DecisionStamp decision={workflow.decision} />
            <RefusalReason decision={workflow.decision} code={workflow.refusalCode} detail={workflow.refusalDetail} />
            {workflow.decision === "AUTHORIZE" ? (
              <p className="mt-2 max-w-md text-[13px] leading-relaxed text-ink-muted">
                This worker passed the required Orion identity and buyer-policy checks.
              </p>
            ) : null}
          </>
        ) : (
          <p className="text-[13px] text-ink-muted">Verification is in progress.</p>
        )}
      </div>

      {/* Verification checklist */}
      <div className="mt-6">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Verification</p>
        <VerificationChecklist checks={workflow.verification} />
      </div>

      {/* Authorization + settlement */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {workflow.authorization ? (
          <AuthorizationLease authorization={workflow.authorization} workerName={workflow.candidate?.name} />
        ) : (
          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Authorization</p>
            <p className="mt-3 text-[13px] text-ink-muted">No authorization created.</p>
          </div>
        )}
        <SettlementStatus settlement={workflow.settlement} execution={workflow.execution} />
      </div>

      {workflow.receiptId ? (
        <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-border pt-6">
          <Link href={`/receipts/${workflow.receiptId}`} className="text-[13px] font-medium text-accent hover:underline">
            View receipt →
          </Link>
          <Link href="/verify" className="text-[13px] font-medium text-accent hover:underline">
            Verify receipt →
          </Link>
          <HashValue value={workflow.receiptId} label="receipt ID" />
        </div>
      ) : null}

      <div className="mt-6">
        <Link href="/dispatch" className="text-[13px] font-medium text-ink-muted hover:text-ink">
          ← Start another dispatch
        </Link>
      </div>
    </div>
  );
}
