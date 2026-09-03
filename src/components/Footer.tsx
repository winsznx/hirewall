import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border-strong bg-surface text-ink">
      {/* Top Footer Grid */}
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-16">
        <div className="grid gap-10 md:grid-cols-12">
          {/* Brand & Overview */}
          <div className="space-y-4 md:col-span-5">
            <Link href="/" className="flex items-center gap-2 text-[16px] font-bold tracking-tight text-ink">
              <span aria-hidden className="inline-block h-2.5 w-2.5 rounded-full bg-accent" />
              HIREWALL
            </Link>
            <p className="max-w-sm text-[13px] leading-relaxed text-ink-muted">
              Buyer-side dispatch firewall for AI agents. Validates live Orion AgentBound credentials, applies
              buyer-defined hiring policy, and authorizes short-lived payment leases only when cryptographic proofs
              pass.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border-strong bg-canvas px-2.5 py-1 text-[11px] font-semibold text-ink-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-authorize" />
                Base Mainnet Ready
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border-strong bg-canvas px-2.5 py-1 text-[11px] font-semibold text-ink-muted">
                Ed25519 Verified
              </span>
            </div>
          </div>

          {/* Column 1: Dispatch & Product */}
          <div className="space-y-3 md:col-span-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Product</p>
            <ul className="space-y-2 text-[13px]">
              <li>
                <Link href="/dispatch" className="text-ink-muted transition hover:text-ink">
                  Dispatch Workspace
                </Link>
              </li>
              <li>
                <Link href="/proof-lab" className="text-ink-muted transition hover:text-ink">
                  Proof Lab
                </Link>
              </li>
              <li>
                <Link href="/catalog" className="text-ink-muted transition hover:text-ink">
                  Catalog Experiment
                </Link>
              </li>
              <li>
                <Link href="/verify" className="text-ink-muted transition hover:text-ink">
                  Receipt Verifier
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-ink-muted transition hover:text-ink">
                  About & Boundaries
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Protocol & Checks */}
          <div className="space-y-3 md:col-span-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Security Architecture</p>
            <ul className="space-y-2 text-[13px]">
              <li className="text-ink-muted">Orion AgentBound v1</li>
              <li className="text-ink-muted">Deterministic Boolean Gates</li>
              <li className="text-ink-muted">Short-Lived Leases (Countdown)</li>
              <li className="text-ink-muted">x402 Transport Guard</li>
              <li className="text-ink-muted">Zero Pre-Signing Payment Leakage</li>
            </ul>
          </div>

          {/* Column 3: CLI & Reproduce */}
          <div className="space-y-3 md:col-span-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Verification</p>
            <p className="text-[12px] leading-relaxed text-ink-muted">
              Verify any receipt hash independently:
            </p>
            <code className="block rounded-lg bg-canvas px-2.5 py-1.5 font-mono text-[11px] text-ink-muted border border-border">
              hirewall verify
            </code>
          </div>
        </div>

        {/* Product Boundary Note */}
        <div className="mt-12 rounded-xl border border-border bg-canvas p-4 text-[12px] leading-relaxed text-ink-muted">
          <span className="font-semibold text-ink">Product Guarantee & Boundaries: </span>
          HIREWALL proves that the recorded Orion credential was retrieved, deterministic signature and wallet checks
          passed, and buyer policies were enforced before payment authority was issued. It does not evaluate future
          worker performance or off-chain operator trustworthiness.
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 text-[12px] text-ink-faint sm:flex-row">
          <p>© {new Date().getFullYear()} HIREWALL. No valid AgentBound. No dispatch.</p>
          <div className="flex items-center gap-4">
            <Link href="/about" className="hover:text-ink hover:underline">
              Methodology
            </Link>
            <Link href="/verify" className="hover:text-ink hover:underline">
              Public Verifier
            </Link>
            <Link href="/proof-lab" className="hover:text-ink hover:underline">
              Fault Injection
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
