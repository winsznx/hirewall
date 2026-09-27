# HIREWALL — Setup

## Frontend and backend

```bash
npm install
npm run dev      # http://localhost:3000, uses the real /api routes
npm run build
npm run lint
npx tsc --noEmit
```

The frontend calls this application's `/api` routes by default. For a
separate backend origin, set `NEXT_PUBLIC_HIREWALL_API_URL`. Static frontend
fixtures require `NEXT_PUBLIC_HIREWALL_USE_FIXTURES=true` in development;
production builds reject that setting. The default Orion provider currently
fails closed until a real credential source and verifier are integrated.

## Backend

```bash
npm run test      # 54 deterministic invariant tests (vitest), no network required
```

The enforcement mechanism (policy engine, authorization lease, executor,
receipts, workflow orchestrator, `/api/*` routes) is implemented, durable,
and tested — see `ARCHITECTURE.md`. The Orion credential integration
now resolves live Store agents, reads Base AgentBound state, and checks the
documented EIP-191 attestation. The sampled minted agents currently return
404 for signed attestations, so they remain `UNVERIFIABLE` with no lease.
See `GATES.md` GATE-001-R2 and `DECISIONS.md` DEC-006.

To run the backend against fixtures locally:

```bash
HIREWALL_PROVIDER=fixture npm run dev
```

The frontend will use these routes automatically. This server-side fixture
setting is for local development only. Omitting `HIREWALL_PROVIDER` selects
`OrionCredentialProvider`, which requires live Store, Base, and signed
attestation evidence and fails closed when any load-bearing proof is missing.

### Persistence

State (leases, revocation, replay nonces, executions, workflows,
receipts) is durable via `node:sqlite` — see `ARCHITECTURE.md` and
`DECISIONS.md` DEC-005. Controlled by:

```bash
HIREWALL_DB_PATH=./.data/hirewall.sqlite   # default; ":memory:" is used automatically in tests
```

The `.data/` directory is gitignored — delete it to reset all local
state. **Not yet needed, and will only be requested when actually
deploying**: a hosted Postgres connection string (e.g. via the Vercel
Marketplace), required only for a horizontally-scaled deployment where a
local SQLite file can't be shared across serverless instances. That swap
touches only `src/server/persistence/`.

## Evidence / reproduction scripts

`/scripts` and `pnpm verify:*` / `pnpm evidence:*` commands referenced in
`HIREWALL_PRD.md` section 25 do not exist yet. They will be added as the
corresponding backend module ships, each with a working reproduction path
before being documented here as available.
