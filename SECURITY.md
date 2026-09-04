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

## Current status

No backend exists yet (see `ARCHITECTURE.md`, `GATES.md`). No executor
wallet has been created. No private key of any kind exists in this
project. This file will be updated with the actual wallet address (never
the key) and cap once a live-proof wallet is provisioned, and will gain a
"security invariants tested" section once the executor's no-bypass tests
exist (`HIREWALL_PRD.md` section 19).
