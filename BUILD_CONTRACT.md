# HIREWALL - BUILD CONTRACT

Status: binding implementation contract  
Project: HIREWALL  
Competition: Orion Builder Hackathon  
Network target: Base mainnet for live evidence unless a specific Orion surface proves otherwise  
Purpose: govern how HIREWALL is built, measured, verified, and represented

---

## 1. Authority hierarchy

The implementation team and coding agents must use this order of authority:

1. The latest authoritative Hackathon Operator `SKILL.md`.
2. This `BUILD_CONTRACT.md`.
3. `HIREWALL_PRD.md`.
4. `HIREWALL_FRONTEND_HANDOFF.md` for frontend product and UX requirements.
5. Observed implementation evidence, sponsor documentation, live API behavior, Base state, and reproducible test results.

Observed evidence may correct the PRD. A disproven premise must not remain in the implementation simply because it exists in a spec.

The frontend handoff may define presentation, interaction, and client-side contracts. It may not weaken backend invariants, change evidence semantics, invent states, or turn fixtures into live results.

---

## 2. Frozen product thesis

HIREWALL is a zero-trust dispatch agent for Orion's agent labor market.

It discovers or accepts a target worker, independently re-verifies that worker's current Orion AgentBound credential, applies the buyer's policy, and only grants the HIREWALL executor bounded, expiring authority to make the requested paid dispatch when the verification and policy checks pass.

Every consequential decision emits a public receipt that can be independently recomputed.

Canonical mechanism:

> No valid AgentBound authorization, no dispatch through HIREWALL.

This claim is intentionally scoped to the HIREWALL execution path. Do not claim that an operator-controlled wallet is cryptographically impossible for the operator to spend outside HIREWALL unless a later architecture change actually proves that stronger property.

---

## 3. Core invariant

A paid dispatch through the HIREWALL executor MUST NOT be attempted unless a currently valid authorization lease exists for the exact target, amount, policy, attestation, and execution context.

Conceptually:

```text
canDispatch(request) =
  lease.exists
  && lease.target == request.target
  && lease.amount >= request.amount
  && lease.attestationHash == request.attestationHash
  && lease.policyHash == request.policyHash
  && lease.chainId == request.chainId
  && lease.expiresAt > now
  && lease.contextId == request.contextId
  && !lease.revoked
  && replayProtectionPasses
```

The authorization lease may only be created after deterministic verification and deterministic policy evaluation pass.

No LLM output may create, alter, override, or repair a failed authorization result.

---

## 4. Gate 001 is fatal

Before deep implementation, validate the live Orion credential seam.

### GATE-001: public AgentBound attestation

PASS only if a real Orion Store agent returns a real attestation from the documented public surface and the documented or reference verifier accepts it from a clean environment.

Record:

- timestamp
- target agent identifier
- request method and public endpoint or retrieval method
- raw response artifact
- raw response hash
- verifier output
- signer/oracle identity as actually observed
- wallet/agent identity as actually observed
- chain/network as actually observed
- source commit and runtime version

If this fails:

- record `FAIL` in `GATES.md`
- preserve the raw evidence
- withdraw claims that public live AgentBound gating is available
- correct the PRD
- do not silently substitute a fixture, private key, mock server, unrelated reputation system, or generic Base check while keeping the HIREWALL claim

A changed architecture must be explicitly re-locked.

---

## 5. Evidence honesty

Never fabricate or hard-code:

- metrics
- Store counts
- verdict counts
- refusal counts
- transaction hashes
- agent identifiers
- attestations
- signatures
- x402 settlements
- receipts
- API responses
- timestamps
- user counts
- adoption
- benchmark results
- demo traces
- screenshots of nonexistent states
- "live" status
- Orion contract or service identifiers
- sponsor integration success

Targets remain targets until measured.

Fixtures remain fixtures.

Controlled fault injections must be marked `FAULT_INJECTION`.

Tests are not users.

Execution counts are not adoption.

A rejected execution that never became a transaction must not be represented as a blocked onchain transaction.

---

## 6. No silent fallback

Load-bearing dependencies fail closed.

If live Orion attestation retrieval is unavailable, the live flow returns `UNVERIFIABLE` or a named dependency error. It must not silently fall back to:

- cached favorable attestation
- fixture attestation
- generic wallet score
- website copy
- AI vetting score alone
- ERC-8004 review count
- model judgment
- another chain
- a mock endpoint

A separate explicitly labeled deterministic fixture path is allowed for the credential-free Proof Lab and reproduction suite.

---

## 7. Deterministic truth boundary

The LLM may:

- interpret natural-language hiring intent
- select which candidate to inspect next
- choose supported tools
- explain deterministic outcomes
- choose a fallback candidate after a refusal
- summarize receipts

The LLM may not:

- verify signatures
- decide whether an attestation is fresh
- decide wallet binding
- change the expected chain
- change the buyer's frozen policy
- invent a reputation value
- mark an agent verified
- authorize spend
- sign payment material
- mark settlement successful
- alter refusal codes

Rule:

> Agent decides what to do. Deterministic code decides what is true.

---

## 8. Frozen decision semantics

Top-level decision values:

- `AUTHORIZE`
- `REFUSE`
- `UNVERIFIABLE`

Settlement is a separate state:

- `NOT_ATTEMPTED`
- `PENDING`
- `SUCCEEDED`
- `FAILED`
- `UNKNOWN`

Do not conflate verification refusal with payment failure.

Canonical refusal/error codes:

- `ATTESTATION_MISSING`
- `ATTESTATION_FETCH_FAILED`
- `ATTESTATION_MALFORMED`
- `SIGNATURE_INVALID`
- `SIGNER_UNTRUSTED`
- `ATTESTATION_EXPIRED`
- `CHAIN_MISMATCH`
- `AGENTBOUND_MISSING`
- `WALLET_MISMATCH`
- `POLICY_REJECTED`
- `AUTHORIZATION_EXPIRED`
- `AUTHORIZATION_REVOKED`
- `BUDGET_EXCEEDED`
- `REPLAY_REJECTED`
- `DEPENDENCY_UNAVAILABLE`
- `PAYMENT_FAILED`
- `EXECUTION_UNKNOWN`

If observed Orion behavior requires a new code, add it through a documented decision in `DECISIONS.md`. Do not rename existing codes casually after public evidence exists.

---

## 9. Matched comparative evidence

Any headline comparison between baseline and HIREWALL must use matched conditions.

Freeze and record:

- Store/catalog snapshot
- candidate cohort
- snapshot timestamp
- same candidate identifiers
- same policy
- same software commit
- same verifier version
- same chain/network
- same environment where relevant

Baseline:

```text
listed/resolved candidate -> dispatchable
```

Treatment:

```text
listed/resolved candidate
+ valid Orion credential
+ correct signer
+ correct identity/wallet binding
+ freshness
+ buyer policy
-> dispatchable
```

Reference model, baseline, and treatment must remain distinct.

---

## 10. Negative evidence retention

Preserve materially relevant:

- failed API calls
- rejected candidate agents
- invalid attestations
- expired attestations
- wallet mismatches
- faulty assumptions
- failed replications
- abandoned endpoint assumptions
- benchmark disagreements
- failed x402 calls
- dependency outages
- controlled tamper cases
- corrected specs

Use:

```text
/evidence/campaign/
```

for the working trail.

Use:

```text
/evidence/submission/
```

for the compact frozen judge-facing evidence bundle.

Do not delete campaign failures to make the project look cleaner.

---

## 11. Gate log

Create `GATES.md` before deep build work.

Every consequential gate entry contains:

```text
Gate:
Timestamp:
Pre-registered pass rule:
Observed artifact/run/transaction:
Artifact location:
Status: PASS | FAIL | CONDITIONAL_PASS
Caveat:
Spec impact:
```

Minimum gates:

1. Public live Orion attestation retrieval
2. Reference/offline verifier parity
3. AgentBound/onchain identity binding where available
4. One-byte signature/payload tamper rejection
5. Expiry rejection
6. Wrong-wallet rejection
7. No-bypass executor test
8. Live x402 paid dispatch
9. Frozen Store/catalog experiment
10. Credential-free Proof Lab
11. Clean-room reproduction
12. Public receipt verification
13. Sponsor repository/contribution inspection
14. Judge-path acceptance test
15. `submission-facts.json` freeze

A gate that has no meaningful rejection case is weak evidence.

---

## 12. Claim ledger

Create `CLAIMS.md`.

Each important public claim records:

```text
Claim:
Artifact:
Evidence path:
Evidence class: fixture | deterministic | live | mainnet | fault_injection | comparative
Denominator:
Limitations:
Reproduction:
```

No README, UI, video, X post, or submission-form claim may exceed the claim ledger.

---

## 13. Machine-readable source of truth

Create and maintain:

```text
submission-facts.json
```

It must contain at minimum:

- canonical one-liner
- deployment URLs
- network/chain
- actual Orion integration surface
- actual Orion identifiers used
- source commit
- verifier version
- policy version
- headline experiment run ID
- cohort denominator
- measured decisions
- live transaction/settlement IDs
- public receipt IDs
- reproduction commands
- live/fixture/fault-injection classification
- explicit limitations
- unsupported/withdrawn claims

README, landing page metrics, demo narration, screenshots, video captions, submission copy, and social copy must be checked against this file.

---

## 14. Environment and run manifests

Every measured experiment must emit a machine-readable manifest with enough inputs to explain rerun differences.

Where applicable include:

- source commit
- start/end timestamps
- catalog snapshot identity and hash
- candidate IDs
- chain ID
- Base RPC provider class, without leaking secrets
- Orion endpoint/version or retrieval surface
- verifier version
- policy version
- model/provider/prompt version if the LLM affects candidate selection
- Node/runtime version
- lockfile hash
- artifact hashes
- result hash
- decision rule version

---

## 15. Payment and key claims

The trust story must be explicit.

If a funded demo/executor wallet is controlled by the project operator:

- say so
- cap its balance
- use a dedicated throwaway wallet
- never use a personal wallet
- never claim operator-independent custody
- distinguish "HIREWALL executor refused" from "funds are cryptographically impossible to spend elsewhere"

If a stronger smart-account/vault architecture is later implemented, update the trust model only after its enforcement is tested.

No private key appears in:

- client bundles
- repository
- logs
- screenshots
- receipts
- fixture files
- public environment files

---

## 16. Frontend fixture policy

The frontend team may use contract-faithful fixtures during parallel development.

Requirements:

- fixture data lives under a clearly named development-only path
- every fixture includes `evidenceMode: "fixture"` or `evidenceMode: "fault_injection"`
- the UI visibly labels fixture/fault-injection states
- production judge routes never silently load fixtures
- production build fails or loudly errors if a required live API is absent
- no production metric is computed from frontend fixtures
- no static "verified" state is hard-coded into the shipped judge path

---

## 17. Public verifier

A receipt verifier must recompute, not merely report.

Where the data permits, it must:

- re-hash receipt payload
- validate schema/version
- re-check attestation artifact/hash
- re-run signature verification
- re-check expected signer configuration
- re-check recorded wallet/AgentBound binding against the receipt inputs
- re-check freshness at dispatch timestamp
- re-evaluate policy inputs
- validate authorization lease
- validate settlement transaction or mark it structurally unclaimed

Provide both:

```bash
pnpm verify:receipt <receipt.json>
```

and a public web verifier.

Verification should not require the LLM, a funded wallet, or private developer credentials.

---

## 18. Controlled fault injection

Proof Lab may inject:

- one-byte/payload mutation
- signature mutation
- wallet substitution
- expired timestamp
- over-budget request
- replayed authorization
- malformed attestation

Every injected case must carry:

```text
evidenceMode: "fault_injection"
faultId:
mutation:
sourceFixtureHash:
```

The UI must say `CONTROLLED FAULT INJECTION`.

Never present injected failures as real malicious Orion agents.

---

## 19. Repo acceptance

A serious final repo should contain:

```text
README.md
BUILD_CONTRACT.md
HIREWALL_PRD.md
HIREWALL_FRONTEND_HANDOFF.md
ARCHITECTURE.md
SECURITY.md
CONTRIBUTIONS.md
DECISIONS.md
SETUP.md
GATES.md
CLAIMS.md
submission-facts.json
/evidence/campaign/
/evidence/submission/
/fixtures/
/scripts/
```

Relevant CI must run:

- tests
- lint
- typecheck
- build
- security/invariant tests
- deterministic verifier fixtures

Live integration tests must remain separate from deterministic fixture tests.

---

## 20. Open-source contribution rule

Inspect Orion/sponsor and closely related public repositories or published verifier examples.

Prefer a Tier A/B contribution that emerges from real use:

- verifier correctness/security fix
- failing test vector
- schema mismatch fix
- compatibility/DX repair
- reusable verifier wrapper
- integration primitive

Do not create a typo PR for optics.

Record all inspected opportunities and outcomes in `CONTRIBUTIONS.md`.

---

## 21. Submission freeze

After the following are complete:

- load-bearing Orion path works
- executor enforcement works
- failure/tamper proof works
- comparative experiment is frozen
- credential-free judge path works
- public verifier works
- required competition assets exist

declare an internal submission freeze.

After freeze:

- no mechanism changes without a recorded reopening decision
- rerun clean-room verification
- regenerate hashes
- synchronize public surfaces
- verify all links
- capture final demo
- finalize submission copy

---

## 22. Definition of done

HIREWALL is not done because the UI looks finished.

It is done when:

1. A real Orion candidate can be resolved.
2. A real credential can be fetched and independently verified.
3. A valid case can become `AUTHORIZE`.
4. A tampered case becomes `REFUSE`.
5. An expired case becomes `REFUSE`.
6. A wrong-wallet case becomes `REFUSE`.
7. A missing/dependency case becomes `UNVERIFIABLE`.
8. No LLM path can override those results.
9. No executor path can dispatch without a valid lease.
10. At least one real paid dispatch is evidenced if the Orion/x402 path supports it.
11. Every run emits a public receipt.
12. A judge can verify a receipt without our private state.
13. A judge can run controlled failure cases without funding a wallet.
14. The matched catalog experiment has raw results and a denominator.
15. Negative evidence is preserved.
16. `submission-facts.json` matches every public claim.
17. Clean-room reproduction passes.
18. Limitations and trust roles are explicit.
19. Sponsor contribution opportunities were seriously inspected.
20. The repo, deployment, demo, and submission describe the same delivered system.
