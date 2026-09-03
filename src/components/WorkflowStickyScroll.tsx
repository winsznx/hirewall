"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

interface WorkflowStep {
  step: string;
  title: string;
  badge: string;
  desc: string;
  details: string[];
}

const STEPS: WorkflowStep[] = [
  {
    step: "01",
    title: "Resolve Orion Worker",
    badge: "Step 1 • Discovery & Resolution",
    desc: "HIREWALL looks up the agent's live listing on Orion Market, verifies its declared category, and extracts the target worker wallet without requiring a pre-connected wallet.",
    details: [
      "No wallet connection required for read-only resolution",
      "Retrieves listing metadata directly from Orion Market",
      "Extracts declared candidate identity & payment recipient address",
    ],
  },
  {
    step: "02",
    title: "Verify AgentBound Attestation",
    badge: "Step 2 • Deterministic Gates",
    desc: "Runs the complete cryptographic test suite: Ed25519 signature validity, oracle signer authority, wallet-to-listing binding, Base network alignment, and freshness at dispatch timestamp.",
    details: [
      "Checks Ed25519 signature against trusted oracle signer keys",
      "Validates wallet binding (declared wallet must match bound wallet)",
      "Strict freshness check: rejected if expired even 1 second prior to dispatch",
    ],
  },
  {
    step: "03",
    title: "Issue Short-Lived Lease",
    badge: "Step 3 • Ephemeral Authority",
    desc: "Upon passing all checks, HIREWALL mints a short-lived authorization lease capped at your max budget in USDC. A live countdown prevents replay attacks and budget drift.",
    details: [
      "Strict spend ceiling enforced in USDC on Base",
      "Ephemeral lease validity window (e.g., 20-minute countdown)",
      "Non-replayable authorization ID prevents double-spending",
    ],
  },
  {
    step: "04",
    title: "Execute & Issue Public Receipt",
    badge: "Step 4 • Settlement & Proof",
    desc: "Transports the paid request through the x402 executor. If payment fails or succeeds, an immutable public receipt is issued with all cryptographic hashes for independent reproduction.",
    details: [
      "x402 payment transport with on-chain settlement verification",
      "Separates identity decision from payment transport state",
      "Generates shareable receipt with CLI verification command",
    ],
  },
];

export function WorkflowStickyScroll() {
  const [activeStep, setActiveStep] = useState(0);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const handleScroll = () => {
      let currentStep = 0;
      let minDistance = Infinity;
      const targetFocusY = window.innerHeight * 0.45;

      stepRefs.current.forEach((ref, index) => {
        if (!ref) return;
        const rect = ref.getBoundingClientRect();
        const cardCenter = rect.top + rect.height / 2;
        const distance = Math.abs(cardCenter - targetFocusY);

        if (distance < minDistance) {
          minDistance = distance;
          currentStep = index;
        }
      });

      setActiveStep(currentStep);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  const scrollToStep = (index: number) => {
    const target = stepRefs.current[index];
    if (target) {
      const targetPosition = target.getBoundingClientRect().top + window.scrollY - 130;
      window.scrollTo({ top: targetPosition, behavior: "smooth" });
    }
  };

  return (
    <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
      <div className="grid items-start gap-12 lg:grid-cols-12">
        {/* Left Side: Sticky pinned header (remains locked in viewport while right cards scroll) */}
        <div className="lg:sticky lg:top-28 lg:col-span-5 lg:self-start lg:pb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-border-strong bg-surface px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-accent shadow-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            Workflow Architecture
          </div>

          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-ink sm:text-3xl lg:text-[2.2rem] lg:leading-[1.15]">
            How HIREWALL guards your dispatch pipeline.
          </h2>

          <p className="mt-4 text-[14px] leading-relaxed text-ink-muted sm:text-[15px]">
            The buyer specifies a task and budget. HIREWALL executes deterministic verification in milliseconds
            before any payment transport can be signed.
          </p>

          {/* Active Step Progress Indicator */}
          <div className="mt-6 rounded-xl border border-border bg-surface p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold uppercase tracking-wider text-ink-faint">
                Active Stage
              </span>
              <span className="font-mono text-[12px] font-bold text-accent">
                {activeStep + 1} / {STEPS.length}
              </span>
            </div>

            <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-canvas border border-border">
              <div
                className="h-full bg-accent transition-all duration-300 ease-out"
                style={{ width: `${((activeStep + 1) / STEPS.length) * 100}%` }}
              />
            </div>

            {/* Interactive Step Jump Buttons */}
            <div className="mt-4 grid grid-cols-4 gap-1.5">
              {STEPS.map((s, i) => (
                <button
                  key={s.step}
                  type="button"
                  onClick={() => scrollToStep(i)}
                  className={`rounded-lg py-1.5 text-[11px] font-semibold transition-all ${
                    activeStep === i
                      ? "bg-accent text-accent-foreground shadow-xs"
                      : "bg-canvas text-ink-muted hover:text-ink hover:bg-border/60"
                  }`}
                >
                  {s.step}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-2">
            <Link
              href="/about"
              className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-accent hover:underline"
            >
              Read what HIREWALL proves & boundaries →
            </Link>
          </div>
        </div>

        {/* Right Side: Progressive Scrolling Cards list (No blue outline) */}
        <div className="space-y-12 lg:col-span-7 lg:py-4">
          {STEPS.map((step, index) => {
            const isActive = activeStep === index;
            return (
              <div
                key={step.step}
                ref={(el) => {
                  stepRefs.current[index] = el;
                }}
                className={`relative rounded-2xl border p-7 sm:p-8 transition-all duration-200 ${
                  isActive
                    ? "border-border-strong bg-surface shadow-md"
                    : "border-border bg-surface/75 shadow-xs opacity-80"
                }`}
              >
                {/* Step header */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[14px] font-bold border ${
                        isActive
                          ? "bg-canvas text-ink border-border-strong"
                          : "bg-canvas text-ink-muted border-border"
                      }`}
                    >
                      {step.step}
                    </span>
                    <h3 className="text-[17px] font-semibold text-ink sm:text-[18px]">
                      {step.title}
                    </h3>
                  </div>

                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full border bg-canvas text-ink-muted border-border">
                    {step.badge}
                  </span>
                </div>

                {/* Step Description */}
                <p className="mt-4 pl-12.5 text-[14px] leading-relaxed text-ink-muted sm:text-[15px]">
                  {step.desc}
                </p>

                {/* Sub-bullets checklist */}
                <div className="mt-5 pl-12.5 border-t border-border pt-4">
                  <ul className="space-y-2">
                    {step.details.map((detail, dIdx) => (
                      <li key={dIdx} className="flex items-start gap-2 text-[13px] text-ink">
                        <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold bg-authorize-bg text-authorize">
                          ✓
                        </span>
                        <span className="text-ink-muted">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
