// Single source of truth for Proof Lab scenario ids/labels/descriptions.
// Both the frontend dropdown (src/lib/api/fixture-data.ts) and the API
// route that executes them (src/app/api/proof-lab/run/route.ts) import
// this list rather than maintaining their own copies — a prior drift
// between two hand-maintained lists meant every scenario except "valid"
// returned unknown_scenario on the deployed site. Client-safe: no
// server-only imports, so it's importable from "use client" pages.
import type { ProofLabScenario } from "@/lib/types";

export const PROOF_LAB_SCENARIOS: ProofLabScenario[] = [
  { id: "valid", label: "Valid credential", description: "Fresh, correctly-bound fixture credential." },
  { id: "expired", label: "Expired credential", description: "Fixture credential past its freshness window." },
  { id: "wallet_mismatch", label: "Wallet substitution", description: "Fixture credential wallet does not match the request target." },
  { id: "provider_unavailable", label: "Dependency unavailable", description: "Simulated credential-source outage." },
  { id: "replay", label: "Replayed authorization", description: "A valid lease is executed twice; the second attempt must be rejected." },
  { id: "receipt_tamper", label: "Receipt tamper", description: "A field in an otherwise-valid receipt is mutated after issuance; the verifier must detect it." },
];
