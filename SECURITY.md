# HIREWALL security and trust model

HIREWALL's claim is scoped to its own executor: **no valid AgentBound authorization, no dispatch through HIREWALL**. A server operator's private key could be used outside HIREWALL; this application does not make the wallet cryptographically incapable of other spending.

## Authority boundaries

- Orion Store data names a candidate. It does not prove credential ownership.
- The Base AgentBound registry is authoritative for token existence, oracle address, and onchain reputation state. A minted token alone does not bind the Store's builder wallet.
- A fresh EIP-191 attestation signed by the registry oracle is required to bind candidate ID, wallet, chain, contract, score, tier, and expiry. The provider recomputes these checks; it does not trust an API `verified` flag. Public signed artifacts for sampled minted agents are currently unavailable, so no live lease is issued.
- Buyer policy and lease validation are deterministic. The executor rechecks context, wallet, chain, credential hash, policy hash, budget, expiry, revocation, and replay state.
- x402 quotes must specify Base USDC, the authorized wallet as payee, and an amount within the lease. Missing payer configuration returns `NOT_ATTEMPTED` before lease consumption. Settlement remains unproven until a paid live call is made.

## Durability and replay

Local tests use SQLite; Vercel production uses Neon Postgres. Both store leases, revocations, consumed nonces, execution claims, workflows, and receipts. Unique nonce and lease execution keys provide the atomic claim boundary. SQLite restart behavior is covered by deterministic tests; a real Neon write/read/revoke smoke test passed. A multi-instance paid race has not been exercised.

## Receipts

A receipt hash detects changes relative to that receipt's stored content. It is not an issuer signature. The offline verifier recomputes HIREWALL-owned integrity and structure; it reports Orion-specific proof and issuer authenticity as `NOT_CLAIMED`. A live refusal receipt records the absence of a signature and absence of payment authority without presenting either as a valid signed credential.

## Secrets

`DATABASE_URL` and any future `HIREWALL_PAYER_PRIVATE_KEY` belong in Vercel environment variables or ignored local files. Neither is committed or sent to the browser. No payer key is currently configured, and no paid x402 settlement is claimed.
