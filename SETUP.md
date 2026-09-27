# HIREWALL setup

Requires Node.js 24 and npm. The local backend uses SQLite; production uses Neon Postgres. Keep `.env.local` out of git.

```bash
npm ci
npm test
npm run typecheck
npm run lint
npm run build
npm run dev
```

The frontend calls this app's `/api` routes by default. `ORION_API_BASE_URL` and `BASE_RPC_URL` may override the public Orion and Base URLs. Store discovery, AgentBound reads, and EIP-191 attestation verification are wired. The sampled minted agents' public attestation endpoints currently return 404, so the live provider returns `UNVERIFIABLE` and creates no lease.

For explicitly labeled local fixture work, set `HIREWALL_PROVIDER=fixture NEXT_PUBLIC_HIREWALL_USE_FIXTURES=true`. Production rejects both fixture selection paths.

## Persistence

Local SQLite defaults to `.data/hirewall.sqlite`. Set `HIREWALL_DB_PATH` to change it. Vercel production requires `DATABASE_URL`, provisioned by the Neon Marketplace integration. Missing credentials fail closed. Postgres schema migration 1 creates leases, consumed nonces, execution claims, workflows, receipts, and catalog runs; migration 2 stores exact raw Store bytes. Run `npm run db:migrate` with `DATABASE_URL` set to check migrations. The first database request also applies idempotent migrations. `HIREWALL_DB_BACKEND=neon` lets local verification use Neon.

## Live catalog

`npm run catalog:run` fetches the current Orion Store, hashes and freezes its raw cohort in Neon, screens every listing through the real workflow, persists receipts, and updates the catalog page. It requires `DATABASE_URL` and network access. Run it with `HIREWALL_DB_BACKEND=neon` outside production. Earlier runs remain stored for audit.

## x402 execution

The executor checks the lease, fetches an HTTP 402 quote, verifies Base USDC, the authorized recipient wallet and price cap, rechecks the lease, atomically claims it, then signs and sends through the x402 SDK. Set an HTTPS `HIREWALL_X402_ENDPOINT` and a funded `HIREWALL_PAYER_PRIVATE_KEY` only for a seller whose quote `payTo` matches the selected Orion candidate's attested wallet. Missing configuration returns `NOT_ATTEMPTED` without consuming the lease. No such live signed candidate and matching seller has yet been proven.

## Receipts

`npm run verify:receipt -- <path|url|->` checks a public raw receipt offline. Use `/api/receipts/<id>?format=raw` for the complete artifact. The verifier checks HIREWALL receipt integrity and structure; Orion-specific signature verification remains `NOT_CLAIMED` until a real signed artifact is available.
