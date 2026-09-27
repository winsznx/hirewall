# HIREWALL — Claim Ledger

Per `BUILD_CONTRACT.md` section 12. No README, UI, video, X post, or
submission-form claim may exceed what is recorded here. This ledger is
kept current during implementation, not written from memory at the end.

No public claims have been made yet. This file will gain one entry per
claim as soon as a claim is first made anywhere public-facing (README,
landing page, demo, social copy). GATE-001-R2 supports a narrow live claim
about Store and Base registry reads, but no signed credential verification.

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
```

## What can be honestly claimed today

```text
Claim: Orion's restored Store lists real agents Rigel (ID 16) and AUDIT (ID 18), and both have minted AgentBound tokens on Base
Artifact: Orion Store API and AgentBound contract 0xb006ca09e390eb3082bb3cb0b43e788ebc6e76a0
Evidence path: evidence/campaign/gate-001-r2/
Evidence class: live | mainnet
Denominator: two selected Store agents; no exhaustive cohort claim
Limitations: their x402 attestation lookups return 404; token owner is Orion's treasury. This does not prove a worker-wallet binding, signature, freshness at dispatch, or authorization.
Reproduction: GET https://orionagents.org/api/agents; cast call <contract> 'exists(uint256)(bool)' 16 --rpc-url https://mainnet.base.org
```

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

```text
Claim: authorization lease, revocation, replay/nonce, execution, and receipt state survive a process restart
Artifact: src/server/persistence/ (SQLite-backed repositories)
Evidence path: src/server/__tests__/persistence-restart.test.ts (8 passing tests)
Evidence class: deterministic
Denominator: n/a
Limitations: verified for a single-instance restart against a local SQLite file. Does not establish behavior across multiple concurrent serverless instances sharing a real hosted database — that requires the Postgres-backed repository implementation described in DECISIONS.md DEC-005, not yet built.
Reproduction: npm run test; or, for a real compiled-server smoke test: npm run build && HIREWALL_PROVIDER=fixture HIREWALL_DB_PATH=./.data/x.sqlite npm run start, create a workflow, kill and restart the process, re-fetch it.
```

```text
Claim: a HIREWALL receipt can be independently verified offline, without the LLM, a funded wallet, private developer state, or trusting the application's own stored result
Artifact: scripts/verify-receipt.ts (calls the same verifyReceipt() the /api/verify-receipt route uses — no separate CLI-only verification logic)
Evidence path: src/server/__tests__/receipt-verifier.test.ts (13 tests, including 8 tamper vectors: amount, target, policy hash, credential-result hash, context, settlement data, evidence mode, receipt hash itself — every one detected via hash recomputation, none silently accepted)
Evidence class: deterministic
Denominator: n/a
Limitations: verifies HIREWALL-owned claims only; the "Orion credential verification" line always reports NOT_CLAIMED regardless of provider, per GATES.md.
Reproduction: npm run verify:receipt -- <path|url|-> (also accepts a receipt fetched from a running instance's own API, e.g. .../api/receipts/<id>?format=raw); npm run test for the tamper-vector suite.
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
