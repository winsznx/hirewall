import { usingFixtures } from "@/lib/api/client";

export function DevFixtureBanner() {
  if (!usingFixtures) return null;
  return (
    <div className="border-b border-unverifiable-border bg-unverifiable-bg px-4 py-1.5 text-center text-[11px] font-semibold uppercase tracking-wide text-unverifiable">
      Development fixture data — no live Orion or Base calls are being made
    </div>
  );
}
