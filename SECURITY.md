# HIREWALL — Security & Trust Model

Per `HIREWALL_PRD.md` section 21. This is the honest trust story; update it
only when the underlying architecture actually changes, not to sound
stronger.

## Trust roles

- **Buyer** — controls task and policy intent.
- **HIREWALL agent (LLM)** — controls planning and candidate selection
  only. Never validates signatures, decides freshness, changes wallet
  binding, overrides policy, issues authorization, or marks settlement
  successful. See `HIREWALL_PRD.md` section 19 and
  `BUILD_CONTRACT.md` section 7 for the exact boundary.
- **Deterministic verifier/policy** — controls truth/eligibility.
- **Orion oracle/signer** — controls the content it signs. HIREWALL does
  not independently prove the oracle's underlying performance claims are
  correct, only that a currently valid, correctly-signed credential exists
  and passes buyer policy.
- **Base** — authoritative chain for any onchain identity/payment evidence
  actually queried.
- **HIREWALL operator** — controls deployment and, if used, the demo
  executor key. This is a trust assumption, not eliminated by this
  architecture. A dedicated, low-balance, Base-only wallet is used for any
  live proof; it never holds personal assets, and its private key never
  appears in client bundles, the repository, logs, screenshots, receipts,
  or public environment files.
- **x402 facilitator/service** — may affect payment transport/finality.
  Receipts distinguish requested, submitted, and confirmed states rather
  than collapsing them.

## What HIREWALL's core claim does and does not mean

> No valid AgentBound authorization, no dispatch through HIREWALL.

This is scoped to the HIREWALL execution path only. It does not claim the
operator-controlled executor wallet is cryptographically incapable of
spending outside HIREWALL — that would require a smart-account/vault
architecture that has not been built or tested. "HIREWALL refused" is a
distinct, weaker claim than "funds are cryptographically impossible to
spend elsewhere," and the two are never conflated in copy or receipts.

## Security invariants tested

Per `HIREWALL_PRD.md` section 19, backed by 42 passing tests
(`npm run test`; `src/server/__tests__/`):

- The LLM has no code path into `evaluatePolicy()`, `createLease()`, or
  `Executor.dispatch()` — the orchestrator (`src/server/workflow/orchestrator.ts`)
  is the only caller, and it calls them with values derived entirely from
  the deterministic provider/policy chain, never from LLM output.
- Invalid signature / unexpected signer / expired / wrong-wallet
  credentials cannot produce an `AUTHORIZE` decision — proven against the
  fixture provider today; the same code path is what Orion's real
  verification result will flow through once GATE-001 unblocks.
- A lease cannot be validated across a different context, target, wallet,
  chain, amount, credential hash, or policy hash than the one it was
  issued for (`lease-executor-invariants.test.ts`).
- Expired and revoked leases cannot execute.
- **Replay/duplicate execution**: `src/server/persistence/execution-repo.ts`'s
  `executions.leaseId` PRIMARY KEY is the atomicity boundary — a second
  concurrent `dispatch()` call for the same lease loses that `INSERT` race
  and is rejected before ever reaching the payment transport, not merely
  after a read-then-write application check. Verified both sequentially
  and, per DECISIONS.md DEC-005, across a simulated process restart.
- The executor exposes exactly one public method; there is no second
  method that bypasses lease validation.
- `EXECUTION_UNKNOWN` is never silently retried — the lease is already
  consumed by the time settlement becomes ambiguous, so a retry attempt
  is rejected the same way a replay is.
- `OrionCredentialProvider` always fails closed and never returns a
  fabricated result; the fixture provider is never labeled with the
  `orion` providerId.
- A receipt's `receiptHash` is recomputed by the verifier, not trusted —
  a post-issuance field mutation is detected, including after a
  simulated restart.

## Durability

Lease, revocation, nonce-consumption, execution, and receipt state
survive a process restart — see `ARCHITECTURE.md` and DECISIONS.md
DEC-005. Known limitation, documented rather than hidden: the current
SQLite-on-local-disk backing does not survive a horizontally-scaled
serverless deployment's ephemeral, per-instance filesystem. A hosted
database is required before a multi-instance production deployment, and
will replace only the repository implementations in
`src/server/persistence/`, not the invariants tested above.

## Current status

Backend enforcement mechanism implemented and tested (see above and
`ARCHITECTURE.md`); the Orion credential integration itself remains
blocked (`GATES.md` GATE-001). No executor wallet has been created. No
private key of any kind exists in this project. This file will be
updated with the actual wallet address (never the key) and spend cap once
a live-proof wallet is provisioned for the x402 transport work.
