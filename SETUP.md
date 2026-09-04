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

Not yet implemented. Blocked on `GATES.md` GATE-001 — see that file and
`DECISIONS.md` DEC-001 for why, and what unblocks it.

## Evidence / reproduction scripts

`/scripts` and `pnpm verify:*` / `pnpm evidence:*` commands referenced in
`HIREWALL_PRD.md` section 25 do not exist yet. They will be added as the
corresponding backend module ships, each with a working reproduction path
before being documented here as available.
