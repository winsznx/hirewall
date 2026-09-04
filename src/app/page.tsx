"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { DecisionStamp } from "@/components/DecisionStamp";
import { HashValue } from "@/components/HashValue";
import { EvidenceModeBadge } from "@/components/EvidenceModeBadge";
import { WorkflowStickyScroll } from "@/components/WorkflowStickyScroll";
import { FIXTURE_WORKFLOWS } from "@/lib/api/fixture-data";

const authorizeExample = FIXTURE_WORKFLOWS.valid_authorized;
const refuseExample = FIXTURE_WORKFLOWS.attestation_expired;

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<"authorize" | "refuse">("authorize");
  const [leaseRemaining, setLeaseRemaining] = useState(1185); // seconds

  useEffect(() => {
    const timer = setInterval(() => {
      setLeaseRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}m ${s.toString().padStart(2, "0")}s`;
  };

  return (
    <div className="relative min-h-screen bg-canvas">
      {/* Hero Section with Grid Lines strictly scoped to this container */}
      <section className="relative overflow-hidden border-b border-border-strong/60 pb-16 pt-8 sm:pb-24 sm:pt-14">
        {/* Grid pattern strictly bounded inside the hero */}
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#e6e5e1_1px,transparent_1px),linear-gradient(to_bottom,#e6e5e1_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_65%_at_50%_0%,#000_50%,transparent_100%)] opacity-70"
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          {/* Eyebrow badge */}
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-border-strong bg-surface/90 px-3.5 py-1 text-[12px] font-medium text-ink-muted shadow-xs backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-authorize animate-pulse" />
              <span>Orion AgentBound Verified</span>
              <span className="text-ink-faint">•</span>
              <span className="text-accent font-semibold">Buyer-Side Dispatch Firewall</span>
            </div>
          </div>

          {/* Hero Title & Subtitle */}
          <div className="mx-auto mt-6 max-w-3xl text-center">
            <h1 className="text-[2.6rem] font-semibold leading-[1.12] tracking-tight text-ink sm:text-[3.5rem]">
              Verify the worker <br className="hidden sm:block" />
              <span className="text-accent">before money leaves.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-[15px] leading-relaxed text-ink-muted sm:text-[16px]">
              HIREWALL checks a worker&rsquo;s live Orion AgentBound credential, applies your policy, and only grants
              short-lived payment authority when the proof passes.
            </p>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
              <Link
                href="/dispatch"
                className="inline-flex items-center justify-center rounded-lg bg-accent px-5 py-2.5 text-[14px] font-semibold text-accent-foreground shadow-sm transition hover:bg-accent-strong focus:outline-hidden focus:ring-2 focus:ring-accent focus:ring-offset-2"
              >
                Dispatch a task
              </Link>
              <Link
                href="/proof-lab"
                className="inline-flex items-center justify-center rounded-lg border border-border-strong bg-surface px-5 py-2.5 text-[14px] font-semibold text-ink shadow-xs transition hover:border-ink-faint hover:bg-canvas focus:outline-hidden focus:ring-2 focus:ring-accent focus:ring-offset-2"
              >
                Challenge HIREWALL
              </Link>
            </div>

            <p className="mt-3 text-[13px] font-medium text-ink-faint">No valid AgentBound. No dispatch.</p>
          </div>

          {/* Hero Dashboard / Interactive Console Card */}
          <div className="mt-12 rounded-2xl border border-border-strong bg-surface p-4 shadow-xl sm:p-6 lg:p-8">
            {/* Dashboard Header Bar with Interactive Scenario Switcher */}
            <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-[12px] font-bold text-accent-foreground">
                  HW
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-ink">HIREWALL Dispatch Gateway</p>
                  <p className="text-[12px] text-ink-muted">Base Network • Deterministic Verification</p>
                </div>
              </div>

              {/* Interactive Tab Switcher */}
              <div className="inline-flex items-center rounded-lg border border-border bg-canvas p-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("authorize")}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-semibold transition ${
                    activeTab === "authorize"
                      ? "bg-surface text-authorize shadow-xs"
                      : "text-ink-muted hover:text-ink"
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-authorize" />
                  Live Authorization (Courier-7)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("refuse")}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-semibold transition ${
                    activeTab === "refuse"
                      ? "bg-surface text-refuse shadow-xs"
                      : "text-ink-muted hover:text-ink"
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-refuse" />
                  Refusal Stamp (Expired Credential)
                </button>
              </div>
            </div>

            {/* Main Console Layout */}
            <div className="mt-6 grid gap-6 lg:grid-cols-12">
              {/* Left Console Sidebar / Policy Column */}
              <div className="space-y-4 lg:col-span-4">
                <div className="rounded-xl border border-border bg-canvas p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Dispatch Policy</p>
                  <dl className="mt-3 space-y-2 text-[13px]">
                    <div className="flex justify-between">
                      <dt className="text-ink-muted">Network</dt>
                      <dd className="font-semibold text-ink">Base</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-ink-muted">Max Budget</dt>
                      <dd className="font-semibold text-ink">0.10 USDC</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-ink-muted">Fresh Credential</dt>
                      <dd className="font-medium text-authorize">Required</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-ink-muted">Wallet Binding</dt>
                      <dd className="font-medium text-authorize">Enforced</dd>
                    </div>
                  </dl>
                </div>

                <div className="rounded-xl border border-border bg-canvas p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Candidate Identity</p>
                  {activeTab === "authorize" ? (
                    <div className="mt-2.5">
                      <p className="text-[14px] font-semibold text-ink">Courier-7</p>
                      <p className="font-mono text-[12px] text-ink-muted">0xA11c...9F02</p>
                      <span className="mt-2 inline-flex items-center rounded-full bg-authorize-bg px-2 py-0.5 text-[11px] font-medium text-authorize">
                        Valid AgentBound
                      </span>
                    </div>
                  ) : (
                    <div className="mt-2.5">
                      <p className="text-[14px] font-semibold text-ink">Meridian Runner</p>
                      <p className="font-mono text-[12px] text-ink-muted">0x89D2...4B11</p>
                      <span className="mt-2 inline-flex items-center rounded-full bg-refuse-bg px-2 py-0.5 text-[11px] font-medium text-refuse">
                        Attestation Expired
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Main Panel / Live Trace & Decision */}
              <div className="space-y-4 lg:col-span-8">
                {/* 3 Metric Stat Cards */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-border bg-canvas p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Payment Authority</p>
                    <p className="mt-1 text-2xl font-bold text-ink">
                      {activeTab === "authorize" ? "0.05 USDC" : "$0.00"}
                    </p>
                    <p className="mt-0.5 text-[12px] text-ink-muted">
                      {activeTab === "authorize" ? "Short-lived lease" : "No authority granted"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-border bg-canvas p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Decision</p>
                    <div className="mt-1">
                      <DecisionStamp decision={activeTab === "authorize" ? "AUTHORIZE" : "REFUSE"} size="sm" />
                    </div>
                    <p className="mt-1 text-[12px] text-ink-muted">
                      {activeTab === "authorize" ? "All checks passed" : "ATTESTATION_EXPIRED"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-border bg-canvas p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Settlement State</p>
                    <p className="mt-1 text-[14px] font-semibold text-ink">
                      {activeTab === "authorize" ? "NOT ATTEMPTED" : "NO PAYMENT ATTEMPTED"}
                    </p>
                    <p className="mt-0.5 text-[12px] text-ink-muted">x402 Transport Guard</p>
                  </div>
                </div>

                {/* Verification Checklist Timeline */}
                <div className="rounded-xl border border-border bg-surface p-4">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-faint">
                      Live Decision Trace
                    </p>
                    <EvidenceModeBadge mode="fixture" />
                  </div>

                  {activeTab === "authorize" ? (
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between rounded-lg bg-canvas px-3 py-2 text-[13px]">
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-authorize-bg text-[10px] font-bold text-authorize">
                            ✓
                          </span>
                          <span className="font-medium text-ink">Orion AgentBound Attestation</span>
                        </div>
                        <span className="font-mono text-[11px] text-authorize">PASS (Ed25519)</span>
                      </div>

                      <div className="flex items-center justify-between rounded-lg bg-canvas px-3 py-2 text-[13px]">
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-authorize-bg text-[10px] font-bold text-authorize">
                            ✓
                          </span>
                          <span className="font-medium text-ink">Wallet Binding & Chain (Base)</span>
                        </div>
                        <span className="font-mono text-[11px] text-authorize">PASS (0xA11c Matches)</span>
                      </div>

                      <div className="flex items-center justify-between rounded-lg bg-canvas px-3 py-2 text-[13px]">
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-authorize-bg text-[10px] font-bold text-authorize">
                            ✓
                          </span>
                          <span className="font-medium text-ink">Freshness at Dispatch</span>
                        </div>
                        <span className="font-mono text-[11px] text-authorize">PASS (Active)</span>
                      </div>

                      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                        <div className="text-[13px] text-ink-muted">
                          Lease expires in: <span className="font-mono font-semibold text-ink">{formatCountdown(leaseRemaining)}</span>
                        </div>
                        <Link
                          href={`/dispatch/${authorizeExample.id}`}
                          className="text-[13px] font-medium text-accent hover:underline"
                        >
                          Inspect full workflow →
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between rounded-lg bg-canvas px-3 py-2 text-[13px]">
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-authorize-bg text-[10px] font-bold text-authorize">
                            ✓
                          </span>
                          <span className="font-medium text-ink">Orion AgentBound Attestation</span>
                        </div>
                        <span className="font-mono text-[11px] text-authorize">PASS</span>
                      </div>

                      <div className="flex items-center justify-between rounded-lg border border-refuse-border bg-refuse-bg/40 px-3 py-2 text-[13px]">
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-refuse text-[10px] font-bold text-white">
                            ✕
                          </span>
                          <span className="font-semibold text-refuse">Freshness at Dispatch</span>
                        </div>
                        <span className="font-mono text-[11px] font-bold text-refuse">ATTESTATION_EXPIRED</span>
                      </div>

                      <div className="rounded-lg bg-canvas p-3 text-[12px] leading-relaxed text-ink-muted">
                        Credential expired 00:04:12 before dispatch. HIREWALL created no payment authority and refused execution.
                      </div>

                      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                        <span className="font-mono text-[12px] text-ink-faint">rcpt_attestation_expired</span>
                        <Link
                          href={`/receipts/${refuseExample.receiptId}`}
                          className="text-[13px] font-medium text-accent hover:underline"
                        >
                          Verify refusal receipt →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/*
        Measured-results surface intentionally omitted.
        BUILD_CONTRACT.md section 5: numbers here must be generated from
        submission-facts.json once a real catalog run and gate log exist.
        Do not hard-code experiment figures.
      */}

      {/* Section 3: 3-Column Core Value Props */}
      <section className="border-b border-border bg-canvas py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              Deterministic Authorization for AI Workers
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">
              Verify cryptographic identity, enforce spend caps, and prevent unauthorized payment leakage before dispatch.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs transition hover:border-border-strong">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent font-bold">
                01
              </div>
              <h3 className="mt-4 text-[16px] font-semibold text-ink">Cryptographic Identity</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">
                Resolves live Orion AgentBound credentials and verifies Ed25519 signatures from authorized oracles.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs transition hover:border-border-strong">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent font-bold">
                02
              </div>
              <h3 className="mt-4 text-[16px] font-semibold text-ink">Buyer Policy Gate</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">
                Enforces network alignment on Base, maximum spend limits in USDC, and strict wallet-to-listing binding.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs transition hover:border-border-strong">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent font-bold">
                03
              </div>
              <h3 className="mt-4 text-[16px] font-semibold text-ink">Short-Lived Leases</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">
                Grants short-lived payment leases that expire automatically to prevent replay attacks and budget drift.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Alternating Deep-Dive Showcases */}
      <section className="border-b border-border bg-surface py-20">
        <div className="mx-auto max-w-6xl space-y-20 px-4 sm:px-6">
          {/* Feature 1: Verification Engine */}
          <div className="grid items-center gap-10 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <span className="text-[12px] font-semibold uppercase tracking-wide text-accent">Technical Proof Surface</span>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                Deterministic checklist, not a black-box score.
              </h3>
              <p className="mt-4 text-[14px] leading-relaxed text-ink-muted">
                HIREWALL does not create an arbitrary trust score. Every check is a deterministic boolean evaluating
                signature validity, signer key authorization, chain target, and timestamp freshness.
              </p>
              <div className="mt-6">
                <Link
                  href="/verify"
                  className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-accent hover:underline"
                >
                  Try the independent receipt verifier →
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-canvas p-5 shadow-xs lg:col-span-7">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Verification Checklist</p>
              <ul className="mt-3 divide-y divide-border rounded-xl border border-border bg-surface text-[13px]">
                <li className="flex items-center justify-between px-4 py-3">
                  <span className="font-medium text-ink">Attestation present & parses</span>
                  <span className="font-semibold text-authorize">PASS</span>
                </li>
                <li className="flex items-center justify-between px-4 py-3">
                  <span className="font-medium text-ink">Ed25519 oracle signature</span>
                  <span className="font-semibold text-authorize">PASS</span>
                </li>
                <li className="flex items-center justify-between px-4 py-3">
                  <span className="font-medium text-ink">Signer in trusted Orion set</span>
                  <span className="font-semibold text-authorize">PASS</span>
                </li>
                <li className="flex items-center justify-between px-4 py-3">
                  <span className="font-medium text-ink">Wallet matches declared listing</span>
                  <span className="font-semibold text-authorize">PASS</span>
                </li>
                <li className="flex items-center justify-between px-4 py-3">
                  <span className="font-medium text-ink">Fresh at dispatch timestamp</span>
                  <span className="font-semibold text-authorize">PASS</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Feature 2: Winning Refusal Scene */}
          <div className="grid items-center gap-10 lg:grid-cols-12">
            <div className="order-2 rounded-2xl border border-refuse-border/60 bg-refuse-bg/20 p-6 lg:order-1 lg:col-span-7">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Worker</p>
                  <p className="text-[15px] font-medium text-ink">{refuseExample.candidate?.name}</p>
                </div>
                <DecisionStamp decision="REFUSE" size="sm" />
              </div>
              <p className="mt-4 font-mono text-[13px] font-bold text-refuse">{refuseExample.refusalCode}</p>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">{refuseExample.refusalDetail}</p>
              <div className="mt-4 rounded-lg bg-surface p-3 text-[13px] font-medium text-ink">
                Consequence: No payment authority created ($0 authorized)
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                <HashValue value="rcpt_attestation_expired" label="receipt ID" />
                <Link
                  href={`/receipts/${refuseExample.receiptId}`}
                  className="text-[13px] font-medium text-accent hover:underline"
                >
                  View receipt →
                </Link>
              </div>
            </div>

            <div className="order-1 lg:order-2 lg:col-span-5">
              <span className="text-[12px] font-semibold uppercase tracking-wide text-refuse">Zero-Trust Refusal</span>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                Refusal is an operational success, not an error.
              </h3>
              <p className="mt-4 text-[14px] leading-relaxed text-ink-muted">
                When credentials expire, keys mismatch, or budgets are exceeded, HIREWALL halts dispatch and issues an
                immutable refusal receipt.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: Step-by-Step Workflow (Sticky Stop-and-Scroll Split) */}
      <section className="border-b border-border bg-canvas py-24 sm:py-32">
        <WorkflowStickyScroll />
      </section>

      {/* Section 6: Proof Lab Challenge CTA Banner */}
      <section className="bg-surface py-16 sm:py-20">
        <div className="mx-auto max-w-4xl rounded-2xl border border-border-strong bg-canvas p-8 text-center sm:p-12 shadow-sm">
          <span className="inline-flex items-center rounded-full border border-unverifiable-border bg-unverifiable-bg px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-unverifiable">
            Controlled Fault Injection Lab
          </span>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Challenge the dispatch gate.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-[14px] leading-relaxed text-ink-muted">
            Flip a byte in the signed attestation payload, expire a credential, or swap the bound wallet to test the
            verifier against controlled attack vectors.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/proof-lab"
              className="rounded-lg bg-accent px-5 py-2.5 text-[14px] font-semibold text-accent-foreground shadow-sm transition hover:bg-accent-strong"
            >
              Open Proof Lab
            </Link>
            <Link
              href="/catalog"
              className="rounded-lg border border-border-strong bg-surface px-5 py-2.5 text-[14px] font-semibold text-ink transition hover:border-ink-faint hover:bg-canvas"
            >
              View Frozen Catalog Run
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
