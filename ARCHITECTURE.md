# HIREWALL architecture

HIREWALL turns Orion identity into runtime dispatch authority. A buyer request resolves a real Store worker, verifies Base AgentBound state and a fresh Orion oracle-signed wallet attestation, evaluates a deterministic buyer mandate, then creates a short-lived authorization lease. The executor cannot sign an x402 payment without a valid lease. All terminal outcomes get a receipt.

```text
Buyer intent -> Orion Store resolution / match -> Base AgentBound read
  -> Orion EIP-191 signature and wallet/freshness checks -> buyer policy
  -> authorization lease -> x402 quote -> lease recheck -> atomic claim
  -> signed payment -> settlement result -> public receipt
```

`OrionCredentialProvider` is the default. It reads the public Store API, AgentBound contract `0xb006ca09e390eb3082bb3cb0b43e788ebc6e76a0` on Base, and the contract's oracle. It independently recovers the EIP-191 signer. The sampled minted agents' public attestation endpoint currently returns 404, so the actual live decision is `UNVERIFIABLE`, with no lease. `FixtureCredentialProvider` is an explicit development and Proof Lab path only; production selection rejects fixtures. See `GATES.md` and `CLAIMS.md` for current evidence.

## Modules

- `src/server/providers`: Store candidate resolution, Base reads, signed attestation verification, and development fixtures.
- `src/server/policy`: deterministic policy evaluation and canonical hashes.
- `src/server/authorization`: bounded lease creation and validation, including wallet, chain, context, budget, expiry, revocation, and nonce bindings.
- `src/server/executor`: the only paid dispatch entry point. It checks the lease, validates a real HTTP 402 quote against Base USDC and the authorized recipient, rechecks the lease, atomically claims execution, consumes the nonce, and uses the x402 SDK. A missing payer or endpoint returns `NOT_ATTEMPTED` without consuming authority.
- `src/server/persistence`: local SQLite and production Neon Postgres repositories. Unique keys on execution claims and consumed nonces reject replay across concurrent instances. Workflows, receipts, leases, revocation and catalog runs survive restarts.
- `src/server/receipts`: canonical receipt hashes and an offline verifier. The verifier currently reports Orion credential proof as `NOT_CLAIMED` because no live signed artifact has been retrieved.
- `src/server/workflow`: orchestration and per-step event persistence. `find` uses Orion's match API; direct mode accepts Store ID, slug or builder wallet. Missing identity fails closed.
- `src/app/api`: dispatch, execution, SSE trace, receipts, verification, Proof Lab, and catalog routes.
- `src/lib/api`: a typed browser adapter. Production uses this application's real API; fixtures require explicit development configuration.
- `scripts/run-catalog.ts`: freezes and hashes a live Store snapshot, screens the full cohort through the same workflow, and persists decisions and receipt IDs in Neon.

## Evidence boundaries

A Store listing identifies a candidate but does not prove its AgentBound credential. A minted token and non-slashed onchain reputation do not prove that the listed builder wallet is bound to the token. The signed Orion attestation is required before a lease. A 404, network error or invalid signature never becomes authorization. The live catalog records `REFUSE` for missing AgentBound tokens and `UNVERIFIABLE` for missing signed proof or dependency errors.

The public receipt verifier checks HIREWALL-owned integrity and structural claims. Receipt hashes are integrity checks, not signatures issued by Orion or HIREWALL. Successful paid execution and independent settlement evidence remain unproven until a matching Orion worker endpoint and funded payer are available.
