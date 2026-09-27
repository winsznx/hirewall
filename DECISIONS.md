# HIREWALL — Decision Log

## DEC-006 — Reopen Orion integration after application restoration

Date: 2026-09-27. The September placeholder-host observation remains evidence
of an outage, but no longer describes the live application. The current Store
publishes `/api/agents`; its client bundle exposes the AgentBound registry at
`0xb006ca09e390eb3082bb3cb0b43e788ebc6e76a0`, an onchain `oracle()`
read, and `/api/x402/attestation/{agentId|wallet|slug}`. The live x402 info
endpoint identifies Base chain 8453 and the same contract and oracle seen by
independent Base RPC. Rigel (ID 16) and AUDIT (ID 18) have minted AgentBound
tokens, yet signed attestation retrieval currently returns 404 for both.
Token ownership points to Orion's treasury, so `ownerOf` cannot be substituted
for a buyer's target-worker wallet binding. HIREWALL may report the onchain
identity fact, but may not create a lease from it alone. See GATE-001-R2 and
`evidence/campaign/gate-001-r2/`.


Records deviations from `HIREWALL_PRD.md`/`BUILD_CONTRACT.md` forced by
observed evidence, per `BUILD_CONTRACT.md` sections 1 and 8.

---

## DEC-001: GATE-001 failed from this environment; deep Orion-specific backend work paused

Date: 2026-09-04

Context: `BUILD_CONTRACT.md` section 4 makes GATE-001 fatal — no backend
module that assumes a specific Orion attestation schema, signer, or
verifier algorithm may be built until a real attestation has been fetched
and independently verified from a clean environment.

Observation: Public web search (see `GATES.md` GATE-001, six queries) found
no publicly indexed documentation, API reference, or repository for a
product matching "Orion AgentBound." This agent has no hackathon
registration portal access, no sponsor Discord access, and no API key.

Decision: Do not write the Orion candidate resolver, attestation fetcher,
or local verifier against a guessed schema. Doing so would produce code
that could never be honestly labeled `live` and would risk exactly the
failure mode BUILD_CONTRACT.md section 6 forbids — a real-looking
integration backed by assumptions instead of evidence.

What proceeds instead, without waiting:
- Operating/evidence file scaffolding (this file, GATES.md, CLAIMS.md,
  ARCHITECTURE.md, SECURITY.md, CONTRIBUTIONS.md, SETUP.md,
  submission-facts.json skeleton, /evidence, /fixtures, /scripts).
- The parts of the system that are Orion-shape-agnostic: the
  `VerificationCheck`/`Decision`/`RefusalCode` type contracts already
  frozen by the PRD (these are our own invariants, not Orion's), the
  policy engine (operates on our own `BuyerPolicy` shape), the
  authorization lease service (operates on hashes or a generic attestation
  artifact, not Orion's specific payload fields), the executor's no-bypass
  invariant (tests that `dispatch()` cannot skip `validateLease()`
  regardless of what produced the lease), and the receipt schema (already
  frozen in the PRD, Orion-shape-agnostic by design).
- Fixture-driven adversarial proof (tamper/expiry/wallet-mismatch/replay)
  against a locally-defined fixture attestation shape that mirrors the
  PRD's `VerificationResult` interface. This exercises the real
  verifier/policy/lease/executor code paths, just with a synthetic
  attestation source instead of a live Orion fetch — which is exactly the
  BUILD_CONTRACT.md section 6 carve-out for Proof Lab / reproduction.

What remains blocked: the Orion candidate resolver and attestation
fetcher's actual field mapping, the verified on-chain AgentBound contract
address, the real signer identity, and therefore any claim of `live`
evidence, the catalog experiment, and the x402 paid dispatch.

Reopening condition: the project operator supplies the real Orion sponsor
documentation URL, API base URL, OpenAPI/schema reference, or hackathon
devfolio page. GATE-001 is then re-run against that source and this
decision is revisited.

**Superseded by DEC-002 and DEC-003 below.**

---

## DEC-002: GATE-001's first test method was invalid; reclassified, not deleted

Date: 2026-09-04

Context: the operator correctly pointed out that "can a search engine
discover Orion" is not the pre-registered GATE-001 pass rule. The pass
rule is "can the known Orion attestation surface be called on a real
Store agent and independently verified." The original test never issued
a single direct HTTP request to a primary-source URL — it only ran
WebSearch queries and treated a lack of indexed results as equivalent to
endpoint unavailability. Those are not the same thing.

Decision: the original GATE-001 entry in `GATES.md` is reclassified from
`FAIL` to `INVALID_TEST` rather than deleted or rewritten — it remains
genuinely useful negative discovery evidence (no public documentation of
this product is indexed anywhere), it is simply not a gate result.
`evidence/campaign/gate-001-search-log.md` is preserved verbatim.

GATE-001 was then re-run properly: direct `curl`/HTTP requests against
every primary-source URL supplied by the operator
(`orionagents.org`, `/store`, `/concierge`, `/docs`, `/docs/x402`, and the
claimed `/api/x402/attestation/{id}` route). See `GATES.md` Attempt 2 and
`evidence/campaign/gate-001-direct-probe-log.md`.

---

## DEC-003: GATE-001 direct-probe retest result — FAIL, work stays blocked

Date: 2026-09-04

Observation: every one of the supplied primary-source URLs, requested
directly (not via search), returns HTTP 404 with an identical
application-level "This app isn't live yet" placeholder — the signature
of a hosting project that has never had a build deployed to it, not a
partially-implemented app with a few dead routes. DNS resolves and the
host answers behind a real Google Cloud front-end, so this is not a DNS
or connectivity artifact. No sibling domain resolves. No GitHub
organization or repository exists for this product under any searched
name. No independently corroborated official social account or hackathon
page was found either.

Decision: GATE-001 stays `FAIL`. This satisfies the operator's own
pre-registered FAIL condition ("exact/current route is absent"),
established this time by direct request. Per DEC-001 (unchanged) and
`BUILD_CONTRACT.md` section 4, deep backend work that assumes a specific
Orion attestation schema, signer, or verifier stays blocked. Per the
operator's explicit instruction, the Orion-agnostic modules (policy
engine, lease service, executor invariants, receipt schema) are also
**not** to be started yet, to avoid the fallback architecture becoming
HIREWALL by inertia.

What this is not: proof no live Orion surface exists anywhere. It is
proof the exact URLs supplied are not currently serving an application.
A different, correct URL — a production domain distinct from
`orionagents.org`, a staging URL, or a surface reachable only after
hackathon registration — could still be real and was not tested because
it was not supplied.

Hackathon deadline extension claim: searched for independent
corroboration (official `@Orion_Agents` account, hackathon devfolio/site,
news mirrors) and found none reachable from this environment. This claim
is recorded as **unverified**, not assumed true or false, in
`submission-facts.json`. The prior September 2 deadline referenced
nowhere in this repo's own docs is likewise not assumed; no deadline is
asserted anywhere in this repo until independently confirmed.

Reopening condition: unchanged from DEC-001 — the operator supplies a
confirmed-live Orion URL (sponsor docs, API base, hackathon portal link)
that this agent can independently request and get a real response from.

---

## DEC-004: continue HIREWALL core behind a provider boundary while Orion credential integration remains blocked

Date: 2026-09-04

Context: GATE-001 is FAIL for the currently supplied Orion surface
(DEC-003), but Orion itself, the hackathon, and the AgentBound concept are
independently corroborated — only the exact public attestation API,
payload schema, signer format, offline verifier, and on-chain contract
surface are unverifiable while the app is down. Blocking all
implementation on that outage would waste the time available and would
also risk the opposite failure mode: silently building assumptions into
a verifier that later turns out wrong in ways that are expensive to find.

Decision: introduce a strict `CredentialProvider` boundary
(`src/server/providers`). HIREWALL's enforcement mechanism —
policy, authorization lease, executor no-bypass invariant, receipts — is
built and proven now against a `NormalizedCredentialResult` type that
belongs to HIREWALL, not against a guessed Orion payload shape. Two
providers implement that interface:

- `FixtureCredentialProvider` — deterministic, dev/test only, every
  result stamped `evidenceMode: "fixture"` or `"fault_injection"`.
- `OrionCredentialProvider` — the real integration seam. It is a shell
  that fails closed with `ORION_PROVIDER_UNAVAILABLE` (mapped to decision
  `UNVERIFIABLE`, refusal code `DEPENDENCY_UNAVAILABLE`). It encodes no
  guessed endpoint, schema, signer, TTL, or contract address. Every
  unresolved field carries a comment pointing at GATE-001.

The core invariant statement changes shape without changing intent, to be
honest about what is enforced today versus what Orion adds once
unblocked:

```text
Today:      No valid HIREWALL authorization lease -> no dispatch through HIREWALL.
Once Orion
unblocks:   valid Orion verification + buyer policy -> HIREWALL authorization lease.
```

This is not a fallback that claims Orion-equivalent functionality. The
provider selection is explicit server configuration
(`HIREWALL_PROVIDER` env var, default `orion`, i.e. default behavior is
honest `UNVERIFIABLE` until an operator explicitly opts into
`fixture` for local development). It never silently swaps mid-request,
and the fixture provider can never be selected in what the workflow
record calls its `evidenceMode: "live"` path — see
`src/server/providers/index.ts`.

Not affected: the product thesis, the frontend, or any public claim.
`CLAIMS.md` marks every Orion-dependent claim `BLOCKED_BY_GATE_001`.
HIREWALL is not submission-ready until GATE-001 resolves — see
`GATES.md`.

Reopening trigger for re-evaluating this decision: GATE-001 passes or
conditionally passes, at which point `OrionCredentialProvider` gets its
real implementation and this decision is marked superseded; or the
enforcement mechanism proves complete while Orion is still down, at which
point an explicit Product Re-Lock decision gets made rather than letting
the outage silently choose the final product.

---

## DEC-005: durable persistence via local SQLite, repository boundary for a later hosted-database swap

Date: 2026-09-04

Context: the enforcement mechanism from DEC-004 (lease service, executor,
workflow orchestrator, receipts) was backed by in-memory `Map`s. A
process restart would silently drop every lease, revocation, consumed
nonce, and receipt — which weakens exactly the enforcement properties
`CLAIMS.md` describes as tested, without changing what the tests report.
This was flagged as the most important correctness gap and prioritized
above new feature breadth.

Decision: introduce a repository boundary
(`src/server/persistence/{lease,workflow,receipt,execution}-repo.ts`)
backed by Node's built-in `node:sqlite` (`DatabaseSync`, stable since
Node 22.5, this repo runs Node 24 — no native dependency to install).
`lease-store.ts`, `workflow/store.ts`, and `receipt-service.ts` now
delegate to these repos instead of holding Maps directly; their public
function signatures are unchanged, so no caller above them needed to
change.

Local durable path chosen over an immediate hosted database because the
operator's instruction was explicit: finish the repository abstraction,
schema, and local durable path first, and request a hosted-database
credential only when actually deploying. A hosted Postgres (via the
Vercel Marketplace, per this session's Vercel plugin guidance) is the
natural next step for a horizontally-scaled deployment — SQLite-on-local-
disk does not survive a serverless platform's ephemeral, per-instance
filesystem. That limitation is recorded honestly in `ARCHITECTURE.md`
and `SECURITY.md` rather than glossed over. The swap only requires a new
implementation of the same four repository interfaces; nothing above the
boundary (lease-service, executor, orchestrator) changes.

Atomicity: the `validate lease -> consume/lock authorization -> begin
execution` sequence is the one place a race could allow duplicate
execution. Two mechanisms enforce it: `consumed_nonces.nonce` is a
PRIMARY KEY (a second `consumeNonce()` for the same nonce fails the
INSERT rather than silently succeeding twice), and `executions.leaseId`
is a PRIMARY KEY that the executor claims via `INSERT` before ever
calling the payment transport — a second concurrent `dispatch()` call for
the same lease loses that INSERT race and returns `REPLAY_REJECTED`
without reaching the transport. This holds even across two Node
processes sharing the same SQLite file (SQLite's own file-level locking
enforces it), which is the closest available proxy for two serverless
instances sharing a real hosted database later.

Verified, not just written: `src/server/__tests__/persistence-restart.test.ts`
(8 tests) simulates a process restart by closing and reopening the SQLite
connection against the same file and asserts a valid lease stays valid,
an expired lease stays expired, a revoked lease stays revoked, a consumed
lease cannot be replayed, a duplicate execute request cannot create a
second execution, a receipt remains retrievable and independently
verifiable, an `EXECUTION_UNKNOWN` result is never blindly retried, and
`fault_injection`/`fixture` evidence mode is never upgraded to `live` on
reread. Additionally smoke-tested against the actual compiled production
build (`npm run build && npm run start`), not just the in-process test
suite: created a workflow, killed the server process, started a fresh
one pointed at the same `.sqlite` file, and confirmed the workflow and
its `AUTHORIZE` decision were still there.

Build-tooling note: `node:sqlite` is loaded via
`createRequire(process.cwd() + "/")(...)` rather than a static
`import ... from "node:sqlite"`. This repo's two build tools disagree on
how to resolve that newer Node builtin — Turbopack (`next build`) handles
a static import correctly, but the Vite version vitest currently bundles
predates `node:sqlite` in its builtin-module list and misresolves a
static import as an npm package named "sqlite" (which doesn't exist).
`createRequire(import.meta.url)` fixes vitest but trips Turbopack's
bundling analysis ("Unsupported external type Url"); `createRequire(process.cwd() + "/")`
works in both, verified by running the full vitest suite and a clean
`next build` after the change. Ambient types for the subset of the
`node:sqlite` API actually used are declared in
`src/types/node-sqlite.d.ts` because `@types/node@20` (pinned for
`vitest@2` peer compatibility) doesn't ship them yet.

Reopening trigger: production deployment on a horizontally-scaled host,
at which point a Postgres-backed implementation of the same four
repository interfaces replaces the SQLite one — see `SETUP.md` for the
minimum credential that will be requested at that point, and
`ARCHITECTURE.md` for the documented limitation this decision does not
hide.

## DEC-007 — Production persistence and live cohort (2026-09-27)

The Vercel project `solidworkssas-projects/hirewall` now has a provisioned Neon resource. The production repository path uses Neon Postgres; local deterministic tests remain on SQLite. Repository operations and all callers were made asynchronous so production leases, revocations, nonces, execution claims, workflows, receipts, and catalog runs share one durable store across function instances. Unique primary keys protect execution and nonce claims. A real Neon lease write/read/revoke smoke test passed. `DATABASE_URL` is an environment secret and never committed.

The live Orion Store is the candidate discovery source. The catalog runner stores a frozen snapshot and SHA-256 hash, then evaluates every listing through the same workflow. A Store listing alone is baseline eligibility; HIREWALL requires a minted, non-slashed AgentBound state and a fresh oracle-signed wallet attestation to create a lease. The 2026-09-27 run found 52 listings, 48 missing AgentBound identity and 4 unverifiable, with zero authorizations. This includes Rigel and AUDIT: both have onchain identity, but their signed attestation endpoints return 404. The result is evidence of fail-closed enforcement, not a claim that a live signed authorization works.

The x402 transport checks a Base USDC quote against the authorized recipient and budget before consuming a lease, then rechecks the lease and uses the official x402 SDK. No matching Orion worker endpoint and funded payer have been established, so no paid settlement is claimed.

## DEC-008 — Explicit buyer policy levels: IDENTITY_REQUIRED vs REPUTATION_REQUIRED (2026-09-28)

The default (and until now only) buyer policy required a fresh, signed, oracle-verified Orion reputation attestation before any lease could exist. Orion's own live signed-attestation endpoint returns 404 for every sampled candidate, including minted ones (Rigel, AUDIT — see GATE-001-R3), so this policy alone made every real dispatch UNVERIFIABLE regardless of how much of the mechanism actually worked. That default is correct and stays unchanged — HIREWALL never weakens a stated requirement to manufacture a friendlier result.

Instead the requirement itself is now explicit and buyer-selected, not implicit. `BuyerPolicy.policyLevel` is `IDENTITY_REQUIRED | REPUTATION_REQUIRED`:

- `REPUTATION_REQUIRED` (default) — unchanged strict flow: onchain AgentBound identity plus a fresh, signature-verified, wallet-bound attestation. `evaluatePolicy()` requires `credential.status === "VERIFIED"`.
- `IDENTITY_REQUIRED` — accepts the authoritative onchain AgentBound state alone (existence, mint, not-slashed, read directly from Base) as sufficient. It never checks or claims wallet binding or attestation freshness, because those are properties of the signed credential this level does not require. Concretely it accepts either a full `VERIFIED` result, or Orion's real `UNVERIFIABLE / ATTESTATION_MISSING` result specifically when the onchain identity checks within it did not fail — see `src/server/policy/engine.ts`.

This means a real Base candidate whose AgentBound token is minted and not slashed, but whose signed attestation is unavailable, now correctly authorizes under `IDENTITY_REQUIRED` and correctly refuses `UNVERIFIABLE / ATTESTATION_MISSING` under `REPUTATION_REQUIRED` — same credential, two honest and separately labeled requirements, not a fallback. The policy level is threaded through the API (`POST /api/dispatch` `policyLevel`), the workflow record, the receipt (`receipt.policy.policyLevel`), and the dispatch UI, so every artifact names exactly which requirement was enforced. An `IDENTITY_REQUIRED` authorization must never be described or rendered as reputation-verified.

Tests: `src/server/__tests__/policy-and-provider.test.ts` — the same identity-only credential shape passes under `IDENTITY_REQUIRED` and refuses `ATTESTATION_MISSING` under `REPUTATION_REQUIRED`; a fully `VERIFIED` credential passes under both; `IDENTITY_REQUIRED` still refuses when onchain identity itself fails and still enforces the budget cap; the two levels hash to different policy hashes.
