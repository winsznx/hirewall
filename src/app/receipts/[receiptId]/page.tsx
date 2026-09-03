import Link from "next/link";
import { notFound } from "next/navigation";
import { hirewallApi } from "@/lib/api/client";
import { DecisionStamp } from "@/components/DecisionStamp";
import { SettlementBadge } from "@/components/SettlementBadge";
import { EvidenceModeBadge } from "@/components/EvidenceModeBadge";
import { VerificationChecklist } from "@/components/VerificationChecklist";
import { AuthorizationLease } from "@/components/AuthorizationLease";
import { HashValue } from "@/components/HashValue";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-border py-6 first:border-t-0 first:pt-0">
      <h2 className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export default async function ReceiptPage({ params }: { params: Promise<{ receiptId: string }> }) {
  const { receiptId } = await params;
  const receipt = await hirewallApi.getReceipt(receiptId);

  if (!receipt) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">HIREWALL receipt</p>
          <p className="mt-1 font-mono text-[13px] text-ink-muted">{receipt.id}</p>
        </div>
        <EvidenceModeBadge mode={receipt.evidenceMode} />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <DecisionStamp decision={receipt.decision} size="sm" />
        <SettlementBadge state={receipt.settlement} />
        <span className="text-[12px] text-ink-faint">{receipt.timestamp}</span>
      </div>

      <div className="mt-8 rounded-xl border border-border bg-surface px-5 divide-y divide-border">
        <Section title="Request">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-[13px]">
            <div>
              <dt className="text-ink-faint">Task</dt>
              <dd className="font-medium text-ink">{receipt.request.taskSummary}</dd>
            </div>
            <div>
              <dt className="text-ink-faint">Budget</dt>
              <dd className="font-medium text-ink">{receipt.request.budget}</dd>
            </div>
            <div>
              <dt className="text-ink-faint">Network</dt>
              <dd className="font-medium text-ink">{receipt.request.network}</dd>
            </div>
            <div>
              <dt className="text-ink-faint">Context ID</dt>
              <dd>
                <HashValue value={receipt.request.contextId} label="context ID" />
              </dd>
            </div>
          </dl>
        </Section>

        {receipt.candidate ? (
          <Section title="Candidate">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-[13px]">
              <div>
                <dt className="text-ink-faint">Identity</dt>
                <dd className="font-medium text-ink">{receipt.candidate.name}</dd>
              </div>
              <div>
                <dt className="text-ink-faint">Wallet</dt>
                <dd>{receipt.candidate.wallet ? <HashValue value={receipt.candidate.wallet} label="wallet" /> : "—"}</dd>
              </div>
              {receipt.candidate.listingUrl ? (
                <div className="col-span-2">
                  <dt className="text-ink-faint">Listing</dt>
                  <dd>
                    <a href={receipt.candidate.listingUrl} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                      {receipt.candidate.listingUrl}
                    </a>
                  </dd>
                </div>
              ) : null}
            </dl>
          </Section>
        ) : null}

        {receipt.credential ? (
          <Section title="Orion credential">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-[13px]">
              <div>
                <dt className="text-ink-faint">Attestation hash</dt>
                <dd>
                  <HashValue value={receipt.credential.attestationHash} label="attestation hash" />
                </dd>
              </div>
              <div>
                <dt className="text-ink-faint">Signer</dt>
                <dd>
                  <HashValue value={receipt.credential.signer} label="signer" />
                </dd>
              </div>
              <div>
                <dt className="text-ink-faint">Issued</dt>
                <dd className="font-medium text-ink">{receipt.credential.issuedAt}</dd>
              </div>
              <div>
                <dt className="text-ink-faint">Expires</dt>
                <dd className="font-medium text-ink">{receipt.credential.expiresAt}</dd>
              </div>
              {receipt.credential.agentBoundId ? (
                <div className="col-span-2">
                  <dt className="text-ink-faint">AgentBound identifier</dt>
                  <dd className="font-mono text-ink">{receipt.credential.agentBoundId}</dd>
                </div>
              ) : null}
            </dl>
          </Section>
        ) : null}

        <Section title="Verification">
          <VerificationChecklist checks={receipt.verification} />
        </Section>

        <Section title="Policy">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-[13px]">
            <div>
              <dt className="text-ink-faint">Max spend</dt>
              <dd className="font-medium text-ink">
                {receipt.policy.maxSpend} {receipt.policy.currency}
              </dd>
            </div>
            {receipt.policy.policyHash ? (
              <div>
                <dt className="text-ink-faint">Policy hash</dt>
                <dd>
                  <HashValue value={receipt.policy.policyHash} label="policy hash" />
                </dd>
              </div>
            ) : null}
          </dl>
        </Section>

        <Section title="Authorization">
          {receipt.authorization ? (
            <AuthorizationLease authorization={receipt.authorization} workerName={receipt.candidate?.name} />
          ) : (
            <p className="text-[13px] text-ink-muted">No authorization created.</p>
          )}
        </Section>

        <Section title="Execution">
          {receipt.execution ? (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-[13px]">
              <div>
                <dt className="text-ink-faint">State</dt>
                <dd className="font-medium text-ink">{receipt.execution.state}</dd>
              </div>
              {receipt.execution.amount ? (
                <div>
                  <dt className="text-ink-faint">Amount</dt>
                  <dd className="font-medium text-ink">
                    {receipt.execution.amount} {receipt.execution.currency}
                  </dd>
                </div>
              ) : null}
              {receipt.execution.txId ? (
                <div className="col-span-2">
                  <dt className="text-ink-faint">Transaction</dt>
                  <dd>
                    <HashValue value={receipt.execution.txId.slice(0, 10) + "…"} full={receipt.execution.txId} label="transaction hash" />
                  </dd>
                </div>
              ) : null}
            </dl>
          ) : (
            <p className="text-[13px] text-ink-muted">No payment attempted.</p>
          )}
        </Section>

        <Section title="Reproduce">
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/verify" className="rounded-md border border-border-strong px-3 py-1.5 text-[13px] font-medium text-ink hover:border-ink-faint">
              Verify this receipt
            </Link>
            <code className="rounded-md bg-canvas px-2.5 py-1.5 font-mono text-[12px] text-ink-muted">
              hirewall verify --receipt {receipt.id}
            </code>
          </div>
        </Section>

        <Section title="Limitations">
          <ul className="space-y-2">
            {receipt.limitations.map((l) => (
              <li key={l} className="text-[13px] leading-relaxed text-ink-muted">
                {l}
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </div>
  );
}
