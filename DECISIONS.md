# HIREWALL — Decision Log

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
