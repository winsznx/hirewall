# HIREWALL — Architecture

Status: frontend and backend core implemented. Orion Store candidate resolution,
matching, Base AgentBound reads, and signed-attestation verification are wired.
Live signed attestations for the sampled minted agents returned 404, so their
workflows fail closed. See `GATES.md` GATE-001-R2 and `DECISIONS.md` DEC-006.

## Provider boundary (DEC-004)

```text
User
  ↓
HIREWALL Agent (planning/candidate selection only — no truth authority)
  ↓
CredentialProvider  (src/server/providers/provider.ts)
  ├── OrionCredentialProvider   [Store + Base registry + signed x402 attestation]
  └── FixtureCredentialProvider [DEV/PROOF ONLY — never selected by default]
  ↓
NormalizedCredentialResult   (HIREWALL's own type, not a raw Orion payload)
  ↓
Deterministic policy engine   (src/server/policy/engine.ts)
  ↓
Authorization lease service   (src/server/authorization/lease-service.ts)
  ↓
Executor                       (src/server/executor/executor.ts — single
                                 public method, always revalidates the
                                 lease against the lease store itself)
  ↓
x402/payment transport         [not wired — see below]
  ↓
Receipt service + verifier     (src/server/receipts/*)
```

Provider selection is explicit server config
(`HIREWALL_PROVIDER=fixture|orion`, default `orion`) — see
`src/server/providers/index.ts`. It never silently swaps mid-request.

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

## Implemented backend

```text
/src/server
  refusal-codes.ts       canonical Decision/SettlementState/RefusalCode/EvidenceMode types
  types.ts                domain types (ResolvedCandidate, NormalizedCredentialResult,
                           BuyerPolicy, AuthorizationLease, WorkflowRecord, ...)
  view-mapper.ts           maps server domain records to src/lib/types.ts view models

  /providers
    provider.ts            CredentialProvider interface + ProviderUnavailableError
    orion-provider.ts       live Store and Base reads, signed attestation gate
    orion-attestation.ts    canonical EIP-191 message and independent recovery
    fixture-provider.ts      deterministic dev/test provider, 4 scenarios
    index.ts                 selectProvider() — explicit config, default "orion"

  /policy
    hash.ts                 canonicalize()/hashObject() — deterministic recomputable hashing
    engine.ts                 evaluatePolicy() — pure function of BuyerPolicy + NormalizedCredentialResult

  /authorization
    lease-store.ts            durable (SQLite-backed) source of truth for lease/nonce state
    lease-service.ts           createLease(), validateLease(), consumeLease(), revokeLease()

  /executor
    executor.ts                Executor — one public method (dispatch), always
                                revalidates against the lease store, atomically
                                claims execution via persistence/execution-repo.ts
                                before touching the transport, injectable payment
                                transport (defaults to honest "unavailable")

  /receipts
    receipt-types.ts            HirewallReceipt schema (matches PRD section 12.9)
    receipt-service.ts           buildReceipt()/getReceipt(), durable (SQLite-backed) store
    verifier.ts                   verifyReceipt() — recomputes, never trusts decision field

  /workflow
    store.ts                    durable (SQLite-backed) WorkflowRecord store
    orchestrator.ts               createWorkflow()/executeWorkflow() — the only place
                                   provider -> policy -> lease -> executor -> receipt
                                   are wired together; persists on every event via
                                   pushEvent() so no mutation path is un-persisted

  /persistence                  repository boundary — see DECISIONS.md DEC-005
    db.ts                        node:sqlite connection + migrations, singleton
                                  keyed by HIREWALL_DB_PATH (default
                                  ./.data/hirewall.sqlite, ":memory:" in tests)
    lease-repo.ts                  leases, revocation, consumed_nonces (PRIMARY KEY
                                    on nonce — atomic double-consume prevention)
    execution-repo.ts               executions (PRIMARY KEY on leaseId — atomic
                                     duplicate-execution prevention, claimed before
                                     the payment transport is ever called)
    workflow-repo.ts                 workflows, stored as a JSON blob keyed by id
    receipt-repo.ts                   receipts, stored as a JSON blob keyed by receiptId

  /__tests__                    42 passing vitest invariant tests (npm run test),
                                 including 8 process-restart-survival tests

/src/app/api
  dispatch/route.ts                        POST — create workflow
  dispatch/[workflowId]/route.ts            GET — workflow state
  dispatch/[workflowId]/execute/route.ts     POST — execute (revalidates lease)
  receipts/[receiptId]/route.ts              GET — public receipt
  verify-receipt/route.ts                     POST — recompute a receipt
  proof-lab/run/route.ts                       POST — HIREWALL-owned fault scenarios only
```

## Data flow (as implemented)

```text
buyer intent
  -> provider.matchCandidates()    find mode uses Orion's public matching API
  -> provider.resolveCandidate()   direct mode uses Orion Store ID, slug, or builder wallet
  -> provider.verifyCandidate()    Base AgentBound + signed Orion attestation; missing proof fails closed
  -> provider.verifyCandidate()    returns NormalizedCredentialResult (HIREWALL's own type)
  -> evaluatePolicy()               deterministic; LLM has no path into this function
  -> createLease()                   only reached if policy.ok === true
  -> executor.dispatch(request, lease.id)   revalidates lease against the store itself;
                                              no method skips this
  -> buildReceipt()                  every terminal state (AUTHORIZE/REFUSE/UNVERIFIABLE)
                                      produces one, including refusals
```

## Known gaps (not yet built)

- SSE trace streaming (`/api/dispatch/:id/events`) — `remote-api.ts`
  currently polls `getDispatch()` instead; `subscribeToDispatch()` is a
  documented no-op.
- Real x402 payment transport — `Executor`'s default transport honestly
  returns `NOT_ATTEMPTED`/`DEPENDENCY_UNAVAILABLE`; a real transport can
  be injected via its constructor once a real endpoint exists.
- Durable persistence — implemented via `node:sqlite` (see
  `src/server/persistence/` and DECISIONS.md DEC-005). Survives a process
  restart, verified by 8 tests and a smoke test against the actual
  compiled production server. **Known limitation, not hidden**: a local
  SQLite file does not survive a horizontally-scaled serverless
  deployment's ephemeral, per-instance filesystem — production deployment
  on a host like Vercel needs a real hosted database (Postgres via the
  Vercel Marketplace is the natural fit) implementing the same four
  repository interfaces. That swap is scoped to `/src/server/persistence`
  only; nothing above the repository boundary changes.
- Catalog experiment runner — live Store cohort is now accessible, but no
  frozen field run is published yet; `getLatestCatalogRun()` returns `null` in
  `RemoteHirewallApi`.
- `scripts/verify-receipt.ts` implemented (`npm run verify:receipt -- <path|url|->`).
  Other `/scripts` from `HIREWALL_PRD.md` section 25 (`evidence:*`
  commands) not yet built — those depend on the catalog runner.
- CI workflow — not yet added.
