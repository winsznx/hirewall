# HIREWALL — Architecture

Status: frontend implemented; backend not yet started (see `GATES.md`).

## Current system

```text
/src (Next.js 16 app, React 19, Tailwind v4)
  /app            routes — see HIREWALL_FRONTEND_HANDOFF.md section 4
  /components     presentational components, see HIREWALL_FRONTEND_HANDOFF.md section 29
  /lib
    /api
      hirewall-api.ts   typed adapter interface (HirewallApi) — the boundary
                        every component depends on
      fixture-api.ts    FixtureHirewallApi — dev-only, tagged evidenceMode
      fixture-data.ts   fixture scenario data, one entry per required
                        scenario in HIREWALL_FRONTEND_HANDOFF.md section 28
      remote-api.ts     RemoteHirewallApi — stubbed, throws
                        "not wired to a backend yet" per method until the
                        backend exists
      client.ts         picks Fixture vs Remote based on
                        NEXT_PUBLIC_HIREWALL_API_URL
    types.ts        shared view-model types (Decision, SettlementState,
                     VerificationCheck, CatalogRun, etc.)
```

This matches `HIREWALL_PRD.md` section 11's recommended
`RemoteHirewallApi` / `FixtureHirewallApi` split.

## Planned backend (not yet built)

See `HIREWALL_PRD.md` sections 11–13 for the full target architecture
(candidate resolver, attestation fetcher, local verifier, Base reader,
policy engine, authorization lease service, agent planner, executor,
receipt service, catalog runner) and the API contract in section 14.

Implementation order and current blocker are tracked in `GATES.md` and
`DECISIONS.md` DEC-001 — the Orion-specific modules (candidate resolver,
attestation fetcher, local verifier's Orion-schema checks) are blocked on
GATE-001. The Orion-agnostic modules (policy engine, lease service,
executor no-bypass invariant, receipt schema, deterministic
tamper/expiry/wallet-mismatch/replay proof against a fixture attestation
source) are not blocked and are the next work.

## Data flow (target, once backend exists)

```text
buyer intent
  -> candidate resolver         (Orion-specific, blocked)
  -> attestation fetcher        (Orion-specific, blocked)
  -> local verifier             (schema checks Orion-specific/blocked;
                                  signature/expiry/wallet-binding logic
                                  against a generic attestation shape is
                                  buildable now)
  -> policy engine               (not blocked)
  -> authorization lease service (not blocked)
  -> executor.dispatch(request, lease)  (not blocked; no-bypass invariant
                                          testable now)
  -> receipt service              (not blocked, schema frozen in PRD)
```
