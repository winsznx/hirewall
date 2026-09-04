# HIREWALL — Gate Log

Per `BUILD_CONTRACT.md` section 11. Every consequential gate entry is
recorded here before and after the corresponding work happens. Nothing is
edited retroactively to look cleaner; corrections get a new entry plus a
`DECISIONS.md` record.

---

## GATE-001: Public live Orion AgentBound attestation retrieval and local verification

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
  AgentBound" was located. Every "Orion"-named result returned by search is
  an unrelated product (SolarWinds Orion network monitoring, an unrelated
  coding-agent CLI at docs.orion-agent.ai, Joystream's video-platform Orion
  auth API, orion.build's agentic-organization OS, and several unrelated
  open-source multi-agent frameworks named Orion on GitHub/PyPI). None
  expose an attestation/credential surface, none mention Base, and none
  mention x402.
Artifact location: /evidence/campaign/gate-001-search-log.md
Status: FAIL
Caveat: This is a search-surface failure, not proof the sponsor API does
  not exist. Hackathon sponsor integrations are frequently gated behind a
  private devfolio hackathon page, a sponsor-only Discord/docs link, or an
  API key issued at hackathon registration — none of which are indexed by
  public web search. This agent has no access to a hackathon registration
  portal, sponsor Discord, or any credential that would unlock such a page.
  A genuine PASS or a genuine confirmed FAIL requires the actual Orion
  sponsor documentation URL (or API base URL / OpenAPI spec / attestation
  schema) supplied by the project operator.
Spec impact: Per BUILD_CONTRACT.md section 4, all deep backend work that
  assumes a specific Orion attestation request/response shape, signer
  identity, or verifier algorithm is BLOCKED until this gate is re-run
  against the real surface. Building a verifier against a guessed schema
  would violate section 6 (no silent fallback) and section 5 (evidence
  honesty) by shipping code that could not be honestly labeled `live`.
```

**Result: HIREWALL's core sponsor claim cannot be validated or implemented from this environment right now.** See the "What's needed" section at the end of the handoff for exactly what unblocks this.

---

## Remaining gates (blocked on GATE-001)

The following gates from `BUILD_CONTRACT.md` section 11 cannot be
meaningfully attempted until GATE-001 passes, because each depends on a
real attestation artifact or a real Orion API surface to test against:

2. Reference/offline verifier parity — blocked, no reference verifier located.
3. AgentBound/onchain identity binding — blocked, no verified contract address.
4. One-byte signature/payload tamper rejection — buildable today as a
   fixture-only deterministic test (no live dependency), see below.
5. Expiry rejection — same, fixture-only buildable today.
6. Wrong-wallet rejection — same, fixture-only buildable today.
7. No-bypass executor test — buildable today against the executor's own
   interface regardless of Orion specifics (see `DECISIONS.md` DEC-002).
8. Live x402 paid dispatch — blocked, requires funded wallet + real endpoint.
9. Frozen Store/catalog experiment — blocked, no catalog surface located.
10. Credential-free Proof Lab — partially buildable today using fixtures
    (frontend already has this); production wiring blocked.
11. Clean-room reproduction — buildable for the fixture/deterministic path today.
12. Public receipt verification — buildable for the fixture/deterministic path today.
13. Sponsor repository/contribution inspection — blocked, no sponsor repo located.
14. Judge-path acceptance test — partially buildable (fixture path only).
15. `submission-facts.json` freeze — cannot freeze real numbers; skeleton created with all fields marked unresolved.

Gates 4, 5, 6, 7, 11, 12 do not require a live Orion dependency — they test
the deterministic verifier/policy/lease/executor logic in isolation using
fixture attestations we control. These can and should proceed while
GATE-001 is being unblocked, per `BUILD_CONTRACT.md` section 6 (a separate
explicitly labeled deterministic fixture path is allowed).
