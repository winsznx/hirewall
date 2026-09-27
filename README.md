# HIREWALL

[![CI](https://github.com/winsznx/hirewall/actions/workflows/ci.yml/badge.svg)](https://github.com/winsznx/hirewall/actions/workflows/ci.yml)

HIREWALL is a buyer-side dispatch firewall for the Orion agent marketplace: **no valid AgentBound authorization, no dispatch.** It resolves a worker from Orion's Store, reads the AgentBound identity registry on Base, fetches and independently verifies the worker's signed reputation attestation, applies a buyer's spend policy, and only then issues a short-lived lease that gates x402 payment execution. Every decision, authorized or refused, produces a receipt that recomputes offline.

- **Live:** https://hirewall.vercel.app
- **Repository:** https://github.com/winsznx/hirewall
- **Catalog:** https://hirewall.vercel.app/catalog
- **Proof Lab:** https://hirewall.vercel.app/proof-lab

## Where this stands right now

Orion's Store and its onchain AgentBound registry are live and reachable. Its signed reputation attestation API is not: every sampled minted agent's `/api/x402/attestation/{id}` returns 404. HIREWALL enforces two explicit, separately labeled buyer policy levels rather than silently weakening its strict default:

- **`REPUTATION_REQUIRED`** (default) — onchain identity plus a fresh, signed attestation. Still correctly refuses every real candidate today, since Orion returns no attestation.
- **`IDENTITY_REQUIRED`** — the authoritative onchain AgentBound state alone (existence, mint, not-slashed, read directly from Base), and *never* claims to have checked wallet binding or reputation freshness. This level now issues real authorization leases against live evidence.

First real (non-fixture) `AUTHORIZE`: [receipt rcpt_e01e8665-d352-4ea7-9eed-7a5d3a35d946](https://hirewall.vercel.app/receipts/rcpt_e01e8665-d352-4ea7-9eed-7a5d3a35d946) — candidate Rigel (Store id 16), onchain AgentBound independently verified on Base, real lease issued, `policyLevel: IDENTITY_REQUIRED` recorded on the receipt so it can never be misread as a reputation claim.

A dedicated, low-balance execution wallet is funded on Base mainnet (`0xe7B0E20EaDd5Cf1aaA8D09C199B16c77B7035Dac`, ~$2 USDC, capped) for the next phase of this proof. No paid x402 execution has happened yet: it requires a seller endpoint whose quoted `payTo` matches an attested candidate wallet, and no such endpoint has been found or verified. No transaction hash is claimed here because none exists — see [DECISIONS.md](DECISIONS.md) DEC-008 and [GATES.md](GATES.md) for the exact evidence.

## Why

An Orion Store listing is a display name, not a runtime credential. A buyer about to pay a worker needs an answer to one question at the exact moment money is about to leave: can this specific agent, at this specific wallet, receive this specific job under this policy right now. HIREWALL turns Orion's AgentBound identity from reputation metadata into something that actually gates payment.

## How it works

1. **Resolve.** A candidate is named directly or looked up in Orion's public Store.
2. **Identity.** The AgentBound registry on Base (`0xb006ca09e390eb3082bb3cb0b43e788ebc6e76a0`) is read directly via RPC for token existence, oracle address, and onchain reputation — never trusted from an API's own `verified` flag.
3. **Attestation.** The provider fetches the worker's signed EIP-191 attestation and independently recomputes signer, subject wallet, chain, and freshness. A missing, expired, or mismatched attestation refuses here; nothing downstream ever sees it.
4. **Policy.** A deterministic buyer policy (max spend, wallet match, freshness) evaluates the verified result. No model has a code path into this function.
5. **Lease.** Only a passing policy result creates a bounded, expiring authorization lease, bound to context, target wallet, chain, amount, credential hash, and policy hash.
6. **Execute.** The executor revalidates the lease against its own durable store before touching the x402 transport — there is exactly one public method, and no way to reach payment without a currently valid lease.
7. **Receipt.** Every terminal outcome, authorized or refused, is hashed and persisted. The offline verifier (`npm run verify:receipt`) recomputes it without needing the app's own database, a wallet, or an LLM.

```text
Store resolve → AgentBound read (Base) → attestation verify → buyer policy → lease → x402 execute → receipt
```

## What's proven and what isn't

| Claim | Status |
|---|---|
| AgentBound contract is live on Base, oracle matches, token exists | Verified independently against Base RPC, not just the app's own reads |
| Full 52-agent Store cohort screened through production code | Done — [evidence/campaign/catalog-2026-09-27/](evidence/campaign/catalog-2026-09-27/), reproducible with `npm run catalog:run` |
| Deterministic enforcement (policy, lease, no-bypass executor, replay rejection) | Done, 63 passing tests, including 8 that simulate a full process restart |
| Receipts survive a restart and recompute offline | Done, verified against SQLite restart tests and a real Neon read/write/revoke cycle |
| A worker's signed attestation verified live | **Not done.** Orion's endpoint 404s for every candidate sampled, including minted ones (Rigel, AUDIT) |
| A real `AUTHORIZE` decision | **Done, under `IDENTITY_REQUIRED`** — [rcpt_e01e8665...](https://hirewall.vercel.app/receipts/rcpt_e01e8665-d352-4ea7-9eed-7a5d3a35d946), live Base AgentBound state, explicitly not a reputation claim |
| A live x402 payment | **Not done.** Transport is wired and tested, wallet is funded (~$2 USDC on Base); no seller endpoint with a matching `payTo` has been found yet |

## Try it

The full live Store cohort is already screened on `/catalog` — every row links to its receipt. Pick one, for example the public Rigel run:

```bash
curl https://hirewall.vercel.app/api/receipts/rcpt_938380a8-57b5-47a3-a916-81f43cfc37df?format=raw -o receipt.json
npm run verify:receipt -- receipt.json
```

```text
Receipt hash                   PASS
Receipt issuer authenticity    NOT CLAIMED
Authorization lease structure  NOT CLAIMED   (no authorization created)
Orion credential verification  NOT CLAIMED
```

That `NOT CLAIMED` on Orion's own signature is the honest state of the product today, not a bug in the verifier.

The Proof Lab (`/proof-lab`) runs the same production policy/lease/executor code against explicitly labeled controlled fixtures — tamper, expiry, wallet mismatch, replay — so the enforcement mechanism can be seen working end to end without a live signed credential.

## Run locally

Requires Node 24.

```bash
npm ci
npm test          # 69 tests: invariants, replay/restart, receipt tamper vectors, x402 preflight, policy-level separation
npm run typecheck
npm run lint
npm run build
npm run dev
```

Local persistence is SQLite by default; production uses Neon Postgres. For fixture-only local work: `HIREWALL_PROVIDER=fixture NEXT_PUBLIC_HIREWALL_USE_FIXTURES=true`. Production rejects both fixture selection paths. Full env vars, migration, catalog-run, and x402 setup are in [SETUP.md](SETUP.md).

## Evidence and governing documents

- [BUILD_CONTRACT.md](BUILD_CONTRACT.md) / [HIREWALL_PRD.md](HIREWALL_PRD.md) — the binding spec this was built against
- [GATES.md](GATES.md) — every gate attempted, including the ones that failed and why
- [DECISIONS.md](DECISIONS.md) — every deviation from spec forced by observed evidence
- [CLAIMS.md](CLAIMS.md) — nothing claimed publicly exceeds what's recorded here
- [SECURITY.md](SECURITY.md) — trust boundaries, what a receipt hash does and doesn't prove
- [evidence/campaign/](evidence/campaign/) — raw negative results, kept rather than deleted
- [submission-facts.json](submission-facts.json) — machine-readable source of truth for every public number above

## License

[MIT](LICENSE)
