# HIREWALL — Gate Log

## GATE-001-R2: Restored Orion application and AgentBound retest

```text
Gate: GATE-001-R2 — live Orion AgentBound credential retrieval and independent verification
Timestamp: 2026-09-27T18:38:39Z
Pre-registered pass rule: A real Store agent returns a signed Orion credential
  and independent verification establishes signer, subject wallet, chain,
  freshness, and AgentBound state before HIREWALL authorization.
Observed artifact/run/transaction: The restored Orion application serves a
  52-agent Store JSON response and a shipped client bundle that names the
  AgentBound contract, REST reputation routes, and the x402 attestation route.
  GET /api/x402/info confirms contract
  0xb006ca09e390eb3082bb3cb0b43e788ebc6e76a0 and oracle
  0x7cDd6Ea617c4F5F1c9a5128D2940c72e1A2E4900 on Base (8453).
  Independent Base RPC reads confirm contract bytecode, the same oracle,
  totalMinted=3, and exists(16)=true / exists(18)=true for real Store agents
  Rigel and AUDIT. Both ownerOf values are the Orion treasury, not the builder
  wallets. Both /api/x402/attestation/{id} calls and slug calls returned 404
  with "No AgentBound reputation found". /api/agentbound/reputations returned [].
Artifact location: evidence/campaign/gate-001-r2/
Status: CONDITIONAL_PASS — live identity registry and real token state found;
  signed wallet-bound credential retrieval/verification did not pass.
Caveat: Mint existence and oracle state alone do not establish a worker's
  dispatch wallet or independently verify a signed performance attestation.
  The previous September outage result remains historically valid.
Spec impact: Reopen the Orion provider against observed REST and Base surfaces.
  Keep authorization fail-closed until wallet binding and freshness are proven.
```


Per `BUILD_CONTRACT.md` section 11. Every consequential gate entry is
recorded here before and after the corresponding work happens. Nothing is
edited retroactively to look cleaner; corrections get a new entry plus a
`DECISIONS.md` record.

---

## GATE-001: Public live Orion AgentBound attestation retrieval and local verification

### Attempt 1 — search-engine discovery (INVALID_TEST)

```text
Gate: GATE-001 — Public live Orion AgentBound attestation retrieval and local verification
Timestamp: 2026-09-04T10:02:00Z
Pre-registered pass rule: A real Orion Store agent returns a real attestation
  from the documented public surface, and the documented or reference
  verifier accepts it from a clean environment.
Observed artifact/run/transaction: Six WebSearch queries against the public
  web (see /evidence/campaign/gate-001-search-log.md for full query list and
  raw findings). No hackathon page, sponsor documentation, API reference,
  attestation schema, or verifier reference for a product matching "Orion
  AgentBound" was located via search indexing.
Artifact location: /evidence/campaign/gate-001-search-log.md
Status: INVALID_TEST (reclassified from FAIL on 2026-09-04T10:25:00Z)
Caveat: This method tested "can generic web search discover Orion,"
  not the pre-registered pass rule ("can the known Orion attestation
  surface be called on a real Store agent and independently verified").
  Search-engine non-discovery does not establish endpoint unavailability
  and never issued a single direct HTTP request to a known primary-source
  URL. Retained in full as negative discovery evidence per
  BUILD_CONTRACT.md section 10 — not deleted, not rewritten. See
  DECISIONS.md DEC-002 for the correction.
Spec impact: None — this entry no longer counts as a gate result. See
  Attempt 2 below for the actual gate outcome.
```

### Attempt 2 — direct probe of known primary-source surfaces (FAIL)

```text
Gate: GATE-001 — Public live Orion AgentBound attestation retrieval and local verification
Timestamp: 2026-09-04T10:20:00Z
Pre-registered pass rule: A real Orion Store agent returns a real attestation
  from the documented public surface, and the documented or reference
  verifier accepts it from a clean environment.
Observed artifact/run/transaction: Direct HTTP/2 requests (curl + WebFetch,
  not search) issued against every primary-source URL supplied:
  https://orionagents.org, /store, /concierge, /docs, /docs/x402,
  /robots.txt, /sitemap.xml, and the claimed
  GET /api/x402/attestation/{id} route shape with a placeholder id.
  DNS resolves (34.111.179.208). The host answers HTTP/2 directly
  (via: 1.1 google — a real Google Cloud front-end, not a DNS sinkhole).
  Every path, with no exception, returns HTTP 404 with an identical
  application-level placeholder body titled "This app isn't live yet" —
  a deployment-platform placeholder shown when a project is provisioned
  but no build has been deployed behind it. Since every route (including
  the bare root) returns the same placeholder, the routing layer itself
  has nothing behind it; this is not a real running app with a few
  missing endpoints. Full raw evidence, headers, and body excerpt in
  /evidence/campaign/gate-001-direct-probe-log.md.
  Independent corroboration also attempted and failed: no GitHub
  organization/repository for "orionagents"/"orion-agents" +
  "AgentBound" exists; no plausible sibling domain
  (.io/.xyz/.app/orion-agents.org etc.) resolves; no independently
  corroborated official social account or hackathon page was found.
Artifact location: /evidence/campaign/gate-001-direct-probe-log.md
Status: FAIL
Caveat: This matches the pre-registered FAIL condition "exact/current
  route is absent," established by direct request rather than search
  absence, per the retest instructions. It does not rule out that a
  correct, currently-live URL exists that was not supplied to this agent
  — e.g. a different domain, a staging URL, or a surface gated behind
  hackathon registration this agent cannot reach. It does rule out that
  the specific primary-source URLs supplied are currently serving a live
  application of any kind.
Spec impact: Per BUILD_CONTRACT.md section 4, GATE-001 remains failed.
  All backend work assuming a specific Orion attestation request/response
  shape, signer identity, or verifier algorithm stays BLOCKED. Per
  BUILD_CONTRACT.md section 6, no fixture/mock/generic-check substitute
  may be built and called HIREWALL's live path.
```

**Result: HIREWALL's core sponsor claim still cannot be validated from this environment.** The retest used real direct requests against every known primary surface, not search. All of them are unprovisioned. See the report at the end of this session's reply for exactly what would unblock this.

---

## Remaining gates (blocked on GATE-001)

The following gates from `BUILD_CONTRACT.md` section 11 cannot be
meaningfully attempted until GATE-001 passes, because each depends on a
real attestation artifact or a real Orion API surface to test against:

2. Reference/offline verifier parity — blocked, no reference verifier located.
3. AgentBound/onchain identity binding — blocked, no verified contract address.
4. One-byte signature/payload tamper rejection — DONE (fixture-only
   deterministic), `src/server/__tests__/policy-and-provider.test.ts`.
5. Expiry rejection — DONE, `lease-executor-invariants.test.ts`,
   `workflow-orchestrator.test.ts`, `persistence-restart.test.ts`.
6. Wrong-wallet rejection — DONE, `lease-executor-invariants.test.ts`.
7. No-bypass executor test — DONE, `lease-executor-invariants.test.ts`
   (executor has exactly one public method; replay/duplicate-execution
   proven both sequentially and across a simulated process restart —
   see `DECISIONS.md` DEC-004/DEC-005).
8. Live x402 paid dispatch — blocked, requires funded wallet + real endpoint.
9. Frozen Store/catalog experiment — blocked, no catalog surface located.
10. Credential-free Proof Lab — partially DONE: `/api/proof-lab/run`
    implements the HIREWALL-owned scenarios (valid/expired/wallet-
    mismatch/unavailable/replay/receipt-tamper) against the production
    verifier/policy/lease/executor code, per explicit instruction not to
    simulate Orion-specific signature/signer tamper. Frontend wiring for
    the live backend not yet done (still fixture-only in the UI).
11. Clean-room reproduction — DONE for the fixture/deterministic path:
    `npm install && npm run test` requires no network and no local state.
12. Public receipt verification — DONE: `npm run verify:receipt -- <path|url|->`
    (`scripts/verify-receipt.ts`) recomputes from the receipt artifact
    alone, no LLM/wallet/database required, calling the same
    `verifyReceipt()` the `/api/verify-receipt` route uses. 13 tamper-
    vector tests (amount, target, policy hash, credential-result hash,
    context, settlement data, evidence mode, receipt hash itself) all
    correctly detected via hash recomputation.
13. Sponsor repository/contribution inspection — blocked, no sponsor repo located.
14. Judge-path acceptance test — partially buildable (fixture path only).
15. `submission-facts.json` freeze — cannot freeze real numbers; skeleton created with all fields marked unresolved.

Gates 4, 5, 6, 7, 11, 12 do not require a live Orion dependency and are
now implemented and tested — see `ARCHITECTURE.md` and `CLAIMS.md`. Gate
10 is partially done. This is exactly the `BUILD_CONTRACT.md` section 6
carve-out (a separate explicitly labeled deterministic fixture path)
being exercised while GATE-001 stays blocked.

## GATE-001-R3 — Full live Store cohort (2026-09-27)

Status: **CONDITIONAL_PASS for Store discovery, onchain AgentBound identity, and fail-closed screening; FAIL for a live signed authorization.** The previous outage observations above are historical.

A live `/api/agents` response contained 52 entries. Its exact response bytes hash to `sha256:11e825da496ca4ca41543533c1584839a89d0e201cdf1400dcca1a422d278f96`. The runner persisted the snapshot and screened all 52 through production workflow code against Base RPC. Result: 48 `REFUSE` (`AGENTBOUND_MISSING`), 4 `UNVERIFIABLE` (three `ATTESTATION_MISSING`, one `DEPENDENCY_UNAVAILABLE`), 0 `AUTHORIZE`. Each candidate has a persisted receipt. Rigel and AUDIT are minted but their public signed attestation API returns 404; they received `UNVERIFIABLE`, not a lease. The one dependency error remains a dependency error, not an inferred identity failure.

Artifacts: `evidence/campaign/catalog-2026-09-27/` holds exact raw Store bytes, exported snapshot, run record, and Rigel's raw receipt. The hash can be reproduced with `shasum -a 256 store-raw.json`. The catalog web page reads the persisted run from Neon. This is a cohort observation at its timestamp, not a claim about every Orion agent forever.

Still unproven: a live signed Orion artifact, independent verification of its oracle signature and wallet binding, an active live lease, and a paid x402 settlement to a matching worker. These require Orion to expose a signed credential for a live Store candidate and a compatible seller endpoint; payment additionally requires a funded payer.
