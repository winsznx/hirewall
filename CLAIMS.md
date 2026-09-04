# HIREWALL — Claim Ledger

Per `BUILD_CONTRACT.md` section 12. No README, UI, video, X post, or
submission-form claim may exceed what is recorded here. This ledger is
kept current during implementation, not written from memory at the end.

No public claims have been made yet. This file will gain one entry per
claim as soon as a claim is first made anywhere public-facing (README,
landing page, demo, social copy). Until GATE-001 passes (see `GATES.md`),
no claim of live Orion integration may be added here or anywhere else.

## Blocked claims

The following claims cannot be made anywhere public-facing until
GATE-001 passes or conditionally passes:

```text
Claim: BLOCKED_BY_GATE_001 — Orion AgentBound attestation was fetched from a live public surface
Claim: BLOCKED_BY_GATE_001 — Orion attestation signature was independently verified
Claim: BLOCKED_BY_GATE_001 — Orion signer/oracle identity was confirmed as expected
Claim: BLOCKED_BY_GATE_001 — a candidate's wallet was checked against its live Orion credential
Claim: BLOCKED_BY_GATE_001 — a live Orion credential's freshness/expiry was verified at dispatch
Claim: BLOCKED_BY_GATE_001 — a frozen Store/catalog cohort was run against real Orion listings
Claim: BLOCKED_BY_GATE_001 — a real Orion x402 paid dispatch occurred
Claim: BLOCKED_BY_GATE_001 — an AgentBound on-chain identity was independently read from Base
```

## What can be honestly claimed today

```text
Claim: HIREWALL enforces a bounded, expiring authorization lease before any paid dispatch attempt
Artifact: src/server/authorization/lease-service.ts, src/server/executor/executor.ts
Evidence path: src/server/__tests__/lease-executor-invariants.test.ts (34 passing invariant tests)
Evidence class: deterministic
Denominator: n/a (mechanism proof, not a sample)
Limitations: exercises the fixture credential provider, not a live Orion credential. See DECISIONS.md DEC-004.
Reproduction: npm run test
```

```text
Claim: an expired, wallet-mismatched, or dependency-unavailable credential cannot produce a HIREWALL authorization lease
Artifact: src/server/policy/engine.ts, src/server/workflow/orchestrator.ts
Evidence path: src/server/__tests__/workflow-orchestrator.test.ts, src/server/__tests__/policy-and-provider.test.ts
Evidence class: deterministic
Denominator: n/a
Limitations: same as above — fixture provider, not live Orion.
Reproduction: npm run test
```

```text
Claim: a HIREWALL receipt's integrity is independently recomputed, not merely trusted
Artifact: src/server/receipts/verifier.ts
Evidence path: src/server/__tests__/receipt-verifier.test.ts
Evidence class: deterministic
Denominator: n/a
Limitations: the verifier's "Orion credential verification" check always reports NOT_CLAIMED — it cannot and does not claim to prove Orion-specific credential truth. See GATES.md.
Reproduction: npm run test
```

---

## Template

```text
Claim:
Artifact:
Evidence path:
Evidence class: fixture | deterministic | live | mainnet | fault_injection | comparative
Denominator:
Limitations:
Reproduction:
```
