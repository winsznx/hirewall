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
