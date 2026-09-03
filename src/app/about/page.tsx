import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About & Boundaries — HIREWALL",
  description:
    "What HIREWALL proves, what it does not prove, and the boundaries of buyer-side AI agent dispatch authorization.",
};

const PROVES = [
  "The Orion AgentBound credential was retrieved directly from the registry.",
  "Deterministic cryptographic checks (signature, trusted signer, Base chain, wallet binding) passed or failed.",
  "The buyer hiring policy (spend ceiling, freshness window) passed or failed.",
  "A short-lived HIREWALL payment authorization existed or did not exist.",
  "A payment was or was not attempted through HIREWALL.",
  "A recorded on-chain settlement is verifiable when evidence exists.",
];

const DOES_NOT_PROVE = [
  "Future worker output quality or agent competency on complex tasks.",
  "The empirical truth of unverified metrics inside an oracle-signed attestation.",
  "The absence of compromise across external blockchain or third-party infrastructure.",
  "Operator-independent execution custody, unless the specific backend proves sandbox isolation.",
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
      {/* Header */}
      <header className="border-b border-border pb-8">
        <p className="text-[12px] font-semibold uppercase tracking-wider text-accent">Product Boundaries</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink sm:text-4xl">About HIREWALL</h1>
        <p className="mt-4 text-[16px] leading-relaxed text-ink-muted">
          HIREWALL is an AI-agent dispatch firewall. A buyer is about to hire and pay an Orion agent. HIREWALL
          checks that worker&rsquo;s live Orion AgentBound credential, applies the buyer&rsquo;s hiring policy, and only
          authorizes the paid dispatch if the proof passes.
        </p>
        <p className="mt-3 text-[14px] font-medium text-ink">
          The simple product rule: <span className="font-semibold text-accent">No valid AgentBound authorization, no dispatch through HIREWALL.</span>
        </p>
      </header>

      {/* Main Narrative */}
      <div className="mt-10 space-y-12">
        {/* Section 1: What HIREWALL proves */}
        <section>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-authorize" />
            <h2 className="text-xl font-bold tracking-tight text-ink">What HIREWALL proves</h2>
          </div>
          <p className="mt-2 text-[14px] text-ink-muted">
            Every authorization and refusal is anchored by deterministic, reproducible cryptographic evidence:
          </p>
          <ul className="mt-4 space-y-3">
            {PROVES.map((item) => (
              <li key={item} className="flex items-start gap-3 text-[14px] leading-relaxed text-ink">
                <span className="mt-1.5 flex h-1.5 w-1.5 shrink-0 rounded-full bg-authorize" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Section 2: What HIREWALL does not prove */}
        <section className="border-t border-border pt-10">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-unverifiable" />
            <h2 className="text-xl font-bold tracking-tight text-ink">What HIREWALL does not prove</h2>
          </div>
          <p className="mt-2 text-[14px] text-ink-muted">
            HIREWALL enforces cryptographic identity and policy boundaries. It explicitly does not claim:
          </p>
          <ul className="mt-4 space-y-3">
            {DOES_NOT_PROVE.map((item) => (
              <li key={item} className="flex items-start gap-3 text-[14px] leading-relaxed text-ink">
                <span className="mt-1.5 flex h-1.5 w-1.5 shrink-0 rounded-full bg-unverifiable" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Section 3: Honesty as a product feature */}
        <section className="border-t border-border pt-10">
          <h2 className="text-xl font-bold tracking-tight text-ink">Honesty as a product feature</h2>
          <p className="mt-3 text-[14px] leading-relaxed text-ink-muted">
            Security and dispatch products must never obscure uncertainty. If a dependency is unreachable, HIREWALL
            issues an <span className="font-semibold text-unverifiable">UNVERIFIABLE</span> judgment rather than a
            misleading refusal. If an agent credential is expired, HIREWALL issues an explicit{" "}
            <span className="font-semibold text-refuse">REFUSE (ATTESTATION_EXPIRED)</span> judgment with $0 payment authority.
          </p>
          <p className="mt-3 text-[14px] leading-relaxed text-ink-muted">
            Furthermore, identity authorization is decoupled from payment transport. If an authorized agent fails to
            complete payment settlement, the original identity decision remains{" "}
            <span className="font-semibold text-authorize">AUTHORIZE</span> while settlement is recorded as{" "}
            <span className="font-semibold text-refuse">FAILED</span>.
          </p>
        </section>

        {/* Section 4: Independent Verification */}
        <section className="border-t border-border pt-10">
          <h2 className="text-xl font-bold tracking-tight text-ink">Independent verification</h2>
          <p className="mt-3 text-[14px] leading-relaxed text-ink-muted">
            Every dispatch workflow produces a public receipt that can be recomputed by any third party without
            trusting HIREWALL servers.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link
              href="/verify"
              className="rounded-lg bg-accent px-4 py-2 text-[13px] font-semibold text-accent-foreground hover:bg-accent-strong"
            >
              Open web verifier
            </Link>
            <Link
              href="/proof-lab"
              className="rounded-lg border border-border-strong bg-surface px-4 py-2 text-[13px] font-semibold text-ink hover:bg-canvas"
            >
              Challenge Proof Lab
            </Link>
            <code className="rounded-lg bg-canvas px-3 py-2 font-mono text-[12px] text-ink-muted border border-border">
              hirewall verify --receipt &lt;id&gt;
            </code>
          </div>
        </section>
      </div>
    </div>
  );
}
