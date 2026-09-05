# HIREWALL — Setup

## Frontend (current state)

```bash
npm install
npm run dev      # http://localhost:3000, runs against FixtureHirewallApi
npm run build
npm run lint
npx tsc --noEmit
```

The frontend runs entirely on fixture data by default — no environment
variables required. `src/lib/api/client.ts` is the single switch: set
`NEXT_PUBLIC_HIREWALL_API_URL` to point it at a real backend once one
exists. See `src/lib/api/remote-api.ts` for the integration seam.

## Backend

```bash
npm run test      # 42 deterministic invariant tests (vitest), no network required
```

The enforcement mechanism (policy engine, authorization lease, executor,
receipts, workflow orchestrator, `/api/*` routes) is implemented, durable,
and tested — see `ARCHITECTURE.md`. The Orion credential integration
itself is blocked on `GATES.md` GATE-001; see `DECISIONS.md` DEC-004 for
the provider-boundary architecture that lets the rest of the system
proceed honestly in the meantime.

To run the backend against fixtures locally:

```bash
HIREWALL_PROVIDER=fixture npm run dev
```

Then set `NEXT_PUBLIC_HIREWALL_API_URL=http://localhost:3000` in the
frontend's env to route through the real backend (still fixture-only
until GATE-001 unblocks Orion). Omitting `HIREWALL_PROVIDER` selects
`OrionCredentialProvider`, which fails closed — every workflow reports
`UNVERIFIABLE / DEPENDENCY_UNAVAILABLE` honestly rather than silently
using fixtures.

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
