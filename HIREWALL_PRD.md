# HIREWALL - PRODUCT REQUIREMENTS DOCUMENT

Status: implementation-ready after Gate 001  
Project: HIREWALL  
Product class: buyer-side AI-agent dispatch firewall  
Primary ecosystem: Orion Agents  
Live network target: Base mainnet  
Core sponsor primitive: Orion AgentBound attestation and identity  
Primary execution rail: Orion/x402 paid agent calls where actually supported

---

# 1. Executive summary

HIREWALL is a dispatch agent that sits between a buyer's intent and a paid AI-agent worker.

A buyer can either name an Orion agent directly or describe a task and budget. HIREWALL resolves one or more candidate workers, retrieves the candidate's current Orion AgentBound attestation, verifies it locally, checks identity/wallet binding and freshness, applies the buyer's hiring policy, and only then creates a bounded, expiring authorization lease for the HIREWALL payment executor.

If the credential is missing, malformed, stale, signed by an unexpected signer, bound to the wrong wallet, or fails the buyer policy, HIREWALL refuses or abstains. The model cannot override the result.

If authorization passes, HIREWALL may make the paid x402 request and produce a public decision/settlement receipt.

Canonical promise:

> No valid AgentBound authorization, no dispatch through HIREWALL.

HIREWALL does not claim that Orion's oracle proves an agent is morally good or that a signed score guarantees future performance. It proves and enforces the narrower property that a paid dispatch through HIREWALL requires the live Orion identity/reputation credential and buyer policy the product says it requires.

---

# 2. Why this product exists

Agent marketplaces create a new buyer problem.

A listing, website, social profile, or successful marketing page is not itself a durable identity credential. The buyer is about to hand work and money to software that may be newly deployed, renamed, stale, or associated with a wallet different from the one carrying its reputation.

Orion's product thesis is that agents should have durable, non-transferable identity and re-attested reputation. HIREWALL turns that identity from a display badge into a runtime dispatch credential.

The buyer does not need another generic dashboard. The buyer needs a decision at the exact moment money or work is about to leave:

```text
Can this exact agent receive this exact job under this exact policy right now?
```

---

# 3. Competition objective

The product must optimize directly for:

## Usefulness

A user can stop an unverifiable or policy-ineligible worker from receiving a paid job in seconds.

## Execution

The judge can run a live or deterministic path, see verification, refusal, authorization, payment, and independently recompute a receipt.

## Originality

The central action is authorization at dispatch time. HIREWALL is not a generic agent scanner, post-payment delivery grader, or adversarial capability test.

---

# 4. Product thesis and mechanism hypothesis

## Product thesis

Orion AgentBound becomes more valuable when it controls a consequential action instead of only appearing as reputation metadata.

## Falsifiable mechanism hypothesis

Under the same frozen Orion candidate cohort and buyer policy, requiring a currently valid, locally verified AgentBound credential before dispatch should change dispatch eligibility relative to the baseline of trusting that the candidate is listed/resolvable.

## Reference model

The Orion-documented attestation schema/verifier behavior and authoritative Base/Orion identity state available to the product.

## Baseline

```text
candidate is listed/resolvable -> eligible for dispatch
```

## Treatment

```text
candidate is listed/resolvable
+ attestation exists
+ attestation parses
+ signature verifies
+ signer is expected
+ chain is expected
+ AgentBound identity is valid where the surface supports checking it
+ listing/target wallet matches attested wallet
+ attestation is fresh
+ buyer policy passes
-> eligible for HIREWALL authorization
```

## Sponsor-removal ablation

Remove the Orion credential from the treatment. Dispatch eligibility must regress to the weaker baseline or stop. The shipped product must not silently continue with a generic reputation substitute while claiming equivalent protection.

---

# 5. Goals

1. Make Orion identity load-bearing at dispatch time.
2. Provide a simple natural-language hiring flow.
3. Produce deterministic `AUTHORIZE`, `REFUSE`, or `UNVERIFIABLE` decisions.
4. Prevent the LLM from overriding truth or spend authorization.
5. Make authorization bounded by target, amount, context, policy, attestation, and time.
6. Execute at least one real paid agent call if the documented Orion/x402 path permits it.
7. Publish machine-readable receipts for success and refusal.
8. Make receipts independently verifiable without an LLM or funded wallet.
9. Make failure behavior directly explorable through a clearly labeled Proof Lab.
10. Run the same frozen verifier/policy pipeline across the real reachable Orion Store/catalog cohort.
11. Preserve raw evidence, negative results, and corrected assumptions.
12. Give the frontend and backend teams a stable contract for parallel implementation.

---

# 6. Non-goals

HIREWALL v1 will not:

- build a generic Base wallet-risk dashboard
- grade x402 response quality after delivery
- perform broad smart-contract audits
- invent a new reputation score
- replace Orion's oracle with an LLM
- claim AgentBound proves future performance
- create a seven-tool marketplace
- launch a token
- add ZK for presentation value
- add multi-chain support
- run a Telegram daemon
- provide trading signals
- build a DAO
- create fake slashing
- claim non-custodial capital separation unless the actual architecture proves it
- silently use cached fixtures in the live judge path

---

# 7. User types

## 7.1 Direct buyer

Knows the Orion agent or listing they want to use.

Input:

- agent slug, wallet, or supported listing identifier
- task
- max spend
- optional supported policy constraints

Goal:

- know whether HIREWALL will authorize the worker
- execute the job if authorized
- receive a receipt

## 7.2 Delegating buyer

Knows the task but not the worker.

Input:

- natural-language task
- budget
- optional category/capability
- optional supported policy constraints

Goal:

- let the agent select candidate workers
- automatically skip/refuse candidates that fail
- dispatch to the first or best eligible worker
- preserve the full candidate decision trace

## 7.3 Judge/reviewer

Goal:

- understand the mechanism in under a minute
- run a valid case
- run a controlled tamper/expiry/wallet-mismatch case
- inspect a public receipt
- recompute the result without private developer state

## 7.4 Developer/integrator

Goal:

- use the verifier/authorization primitives programmatically
- reproduce fixtures
- inspect raw evidence
- integrate a buyer-side gate into another x402 workflow

---

# 8. Canonical user journeys

## Journey A: direct live dispatch

1. Buyer opens HIREWALL.
2. Buyer enters agent identifier, task, and max budget.
3. HIREWALL resolves the candidate.
4. HIREWALL retrieves the live Orion attestation.
5. Deterministic verifier runs.
6. Buyer policy runs.
7. Decision is shown.
8. If `AUTHORIZE`, HIREWALL creates a short-lived authorization lease.
9. Executor attempts the paid request.
10. Settlement is tracked separately.
11. Public receipt is emitted.
12. Buyer can open `Verify receipt`.

## Journey B: automatic candidate selection

1. Buyer describes a task and budget.
2. Agent discovers/resolves candidates from the live Orion surface actually available.
3. Agent chooses a candidate to inspect.
4. Deterministic verifier evaluates candidate.
5. If refused/unverifiable, the agent records the reason and selects another candidate when allowed.
6. First eligible candidate receives an authorization lease.
7. Paid dispatch occurs.
8. Receipt contains all attempted candidates and the final selection.

The LLM chooses candidates. It cannot override candidate truth.

## Journey C: controlled fault injection

1. Judge opens Proof Lab.
2. Judge chooses a real frozen source fixture.
3. Judge chooses:
   - valid
   - tamper payload/signature
   - swap wallet
   - expire attestation
   - exceed budget
   - replay authorization
4. HIREWALL runs the same deterministic verifier/policy/lease logic used in production.
5. The page visibly states `CONTROLLED FAULT INJECTION`.
6. Result and named refusal reason appear.
7. A fault-injection receipt is generated.
8. Judge may verify the receipt independently.

## Journey D: catalog experiment

1. A frozen Store/catalog snapshot is produced.
2. Every reachable candidate enters the exact same pipeline.
3. Baseline eligibility is recorded.
4. HIREWALL treatment eligibility is recorded.
5. Full raw results are preserved.
6. Public page displays denominator and measured outcomes only.
7. Results link to raw JSON and reproduction command.

---

# 9. Core decision model

Top-level decisions:

```ts
type Decision = "AUTHORIZE" | "REFUSE" | "UNVERIFIABLE";
```

Settlement:

```ts
type SettlementState =
  | "NOT_ATTEMPTED"
  | "PENDING"
  | "SUCCEEDED"
  | "FAILED"
  | "UNKNOWN";
```

Decision and settlement must never be collapsed into one status.

Example:

```text
Decision: AUTHORIZE
Settlement: FAILED
Reason: remote x402 endpoint returned an execution error
```

This means the identity/policy gate passed, but the paid request failed.

---

# 10. Refusal and error taxonomy

Canonical codes:

```ts
type RefusalCode =
  | "ATTESTATION_MISSING"
  | "ATTESTATION_FETCH_FAILED"
  | "ATTESTATION_MALFORMED"
  | "SIGNATURE_INVALID"
  | "SIGNER_UNTRUSTED"
  | "ATTESTATION_EXPIRED"
  | "CHAIN_MISMATCH"
  | "AGENTBOUND_MISSING"
  | "WALLET_MISMATCH"
  | "POLICY_REJECTED"
  | "AUTHORIZATION_EXPIRED"
  | "AUTHORIZATION_REVOKED"
  | "BUDGET_EXCEEDED"
  | "REPLAY_REJECTED"
  | "DEPENDENCY_UNAVAILABLE"
  | "PAYMENT_FAILED"
  | "EXECUTION_UNKNOWN";
```

Use human-readable messages in the UI, but preserve exact codes in API payloads and receipts.

Examples:

```text
ATTESTATION_EXPIRED
This credential was valid, but it expired before dispatch. Re-verification is required.
```

```text
WALLET_MISMATCH
The wallet in the verified credential does not match the wallet HIREWALL was asked to pay.
```

```text
UNVERIFIABLE / DEPENDENCY_UNAVAILABLE
HIREWALL cannot establish the required identity state right now, so no dispatch is authorized.
```

---

# 11. System architecture

Recommended monorepo:

```text
/apps
  /web
  /api

/packages
  /shared
  /orion
  /verifier
  /policy
  /authorization
  /executor
  /receipts
  /agent
  /evidence

/fixtures
/evidence
  /campaign
  /submission
/scripts
```

Recommended implementation defaults:

- Frontend: TypeScript + modern React framework chosen by frontend owner
- API/runtime: Cloudflare Workers + Hono when technically suitable
- Chain client: viem
- Persistence: fresh Supabase/Postgres project or a simpler durable store if it materially improves reliability
- Streaming: SSE for decision trace where supported
- Validation: Zod or equivalent strict schema validation
- LLM: one provider behind an adapter, used only for planning/selection/explanation
- Evidence scripts: Node/TypeScript CLI
- CI: GitHub Actions
- Live network: Base mainnet for live proof
- Local deterministic fixtures: no network required

Do not create extra microservices.

---

# 12. Major modules

## 12.1 Candidate resolver

Purpose:

Normalize user input into a candidate identity.

Inputs may include:

- Orion slug
- wallet
- supported Store/listing identifier
- URL only if it can be deterministically mapped to a candidate

Output:

```ts
interface Candidate {
  id: string;
  slug?: string;
  name?: string;
  listingUrl?: string;
  declaredWallet?: `0x${string}`;
  category?: string;
  capabilities?: string[];
  source: "orion_store" | "direct_wallet" | "other_supported_orion_surface";
  snapshotId?: string;
}
```

Do not fabricate missing fields.

If the public Store surface does not expose a stable API, document the actual retrieval method. If discovery is unreliable, direct identifier mode remains the live core.

## 12.2 Orion attestation fetcher

Purpose:

Retrieve the raw signed attestation from the documented Orion surface.

Requirements:

- no hidden favorable fallback
- preserve exact raw response
- hash raw artifact
- strict timeout
- retry policy bounded and recorded
- network errors become named `UNVERIFIABLE`
- schema changes become `ATTESTATION_MALFORMED` until adapter is deliberately updated

Gate 001 validates this module.

## 12.3 Local verifier

Purpose:

Recompute credential validity locally.

Minimum checks where supported by the actual Orion payload/docs:

- parse/schema
- signature
- signer/oracle identity
- domain/context
- chain
- issued/expiry time
- candidate wallet binding
- AgentBound identity binding
- attestation integrity

Output:

```ts
interface VerificationResult {
  ok: boolean;
  checkedAt: string;
  attestationHash?: string;
  signer?: string;
  chainId?: number;
  wallet?: `0x${string}`;
  agentBoundId?: string;
  issuedAt?: string;
  expiresAt?: string;
  checks: Array<{
    id: string;
    ok: boolean;
    code?: RefusalCode;
    evidence?: Record<string, unknown>;
  }>;
  refusalCode?: RefusalCode;
}
```

Do not invent fields the real Orion schema does not contain.

## 12.4 Authoritative Base/AgentBound reader

Where Orion's public contract surface allows it, independently query Base to establish relevant AgentBound identity state.

This module should:

- use the configured Base chain ID
- read the actual deployed Orion contract/address only after it is verified from primary source evidence
- never hard-code an unverified address
- return raw call metadata
- distinguish RPC failure from a negative identity result

If the docs do not expose sufficient public contract details, record that limitation rather than simulating it.

## 12.5 Buyer policy engine

Policy is deterministic.

Minimal policy:

```ts
interface BuyerPolicy {
  chainId: number;
  maxSpendAtomic: string;
  requireValidAttestation: true;
  requireWalletMatch: true;
  requireFreshAtDispatch: true;
  minimumTier?: string;
  minimumCompositeScore?: number;
}
```

Optional fields are only enabled when the verified Orion schema actually supports them.

The LLM cannot mutate policy after the buyer confirms it.

Policy object is canonicalized and hashed.

## 12.6 Authorization lease service

A lease binds:

```ts
interface AuthorizationLease {
  id: string;
  contextId: string;
  candidateId: string;
  targetWallet?: `0x${string}`;
  maxAmountAtomic: string;
  chainId: number;
  attestationHash: string;
  policyHash: string;
  issuedAt: string;
  expiresAt: string;
  nonce: string;
  revoked: boolean;
}
```

Lease expiry:

```text
min(
  buyer/session expiration,
  verified credential expiration,
  internal maximum lease TTL
)
```

If credential validity cannot be established at lease creation, no lease exists.

If a lease expires before signing/payment, re-verification is required.

Replay protection must be enforced.

## 12.7 Agent planner

Purpose:

Create visible agent-track behavior without giving the LLM truth authority.

Allowed tools:

- resolve candidate
- list/discover supported Orion candidates
- fetch candidate metadata
- request deterministic verification
- request deterministic policy evaluation
- request dispatch if an authorization lease exists
- inspect prior candidate outcomes

Agent loop:

```text
observe intent
-> choose candidate
-> request verification
-> read deterministic result
-> if refused and fallback allowed, choose next candidate
-> if authorized, request dispatch
-> observe settlement
-> explain result
-> stop
```

Every tool call is structured and logged.

## 12.8 Executor

The executor is the only module allowed to interact with the paid dispatch signer/wallet.

API:

```ts
dispatch(request, lease)
```

Before any payment material is signed/sent, the executor MUST independently call `validateLease()`.

No public or internal method may expose a raw `sendPayment()` path that bypasses lease validation.

Tests must attempt the bypass.

If x402 requires a specific payment signature format, the executor implements that format only after authorization.

Use a dedicated, low-balance project wallet for live proof if a server-side signer is required.

## 12.9 Receipt service

Every final decision produces a receipt, including refusals.

Suggested schema:

```ts
interface HirewallReceipt {
  schemaVersion: "1.0";
  receiptId: string;
  evidenceMode: "live" | "fixture" | "fault_injection";
  createdAt: string;

  request: {
    contextId: string;
    taskHash?: string;
    maxSpendAtomic: string;
    chainId: number;
  };

  candidate: Candidate;

  source: {
    catalogSnapshotId?: string;
    attestationArtifactHash?: string;
    attestationSource?: string;
  };

  verification: VerificationResult;

  policy: {
    policyHash: string;
    result: "PASS" | "FAIL" | "NOT_EVALUATED";
    failureCode?: RefusalCode;
  };

  authorization?: AuthorizationLease;

  decision: Decision;
  refusalCode?: RefusalCode;

  execution: {
    state: SettlementState;
    amountAtomic?: string;
    transactionHash?: string;
    x402RequestId?: string;
    endpoint?: string;
    responseHash?: string;
  };

  faultInjection?: {
    faultId: string;
    mutation: string;
    sourceFixtureHash: string;
  };

  software: {
    commit: string;
    verifierVersion: string;
    policyVersion: string;
  };

  receiptHash: string;
}
```

Task content may be hashed/redacted where needed. Do not expose secrets.

## 12.10 Public receipt verifier

Two surfaces:

```text
/web verifier
CLI verifier
```

CLI:

```bash
pnpm verify:receipt <path-or-url>
```

It recomputes all deterministic checks supported by the receipt artifacts.

It must never simply trust `decision: AUTHORIZE`.

## 12.11 Proof Lab

Uses frozen, real source artifacts where available.

Required scenarios:

1. valid credential
2. one-byte/payload/signature tamper
3. expired credential
4. wallet substitution
5. over-budget request
6. replayed authorization
7. malformed payload

Each run uses the production verifier/policy/lease implementation.

No separate demo-only acceptance logic.

## 12.12 Catalog experiment runner

Purpose:

Produce wide proof.

Workflow:

1. Freeze reachable Store/catalog cohort.
2. Save raw snapshot.
3. Hash snapshot.
4. Freeze policy.
5. Run baseline.
6. Run HIREWALL treatment.
7. Preserve every candidate result.
8. Emit summary derived from raw results.
9. Emit run manifest.
10. Publish raw JSON.

Never discard `UNVERIFIABLE` candidates.

---

# 13. State machine

Primary dispatch states:

```text
IDLE
  -> RESOLVING
  -> RESOLVED
  -> FETCHING_ATTESTATION
  -> VERIFYING
  -> VERIFIED | REFUSED | UNVERIFIABLE
  -> POLICY_EVALUATING
  -> AUTHORIZED | REFUSED
  -> EXECUTING
  -> SETTLED | EXECUTION_FAILED | EXECUTION_UNKNOWN
  -> RECEIPT_READY
```

Expiry transition:

```text
AUTHORIZED
  -> lease expires before execution
  -> AUTHORIZATION_EXPIRED
  -> REVERIFY_REQUIRED
```

Fallback transition:

```text
REFUSED/UNVERIFIABLE
  -> fallback allowed
  -> agent selects next candidate
  -> RESOLVING
```

No candidate:

```text
all candidates exhausted
  -> NO_ELIGIBLE_CANDIDATE
  -> receipt
```

---

# 14. API contract

Exact route naming may change, but behavior should remain stable.

## POST `/api/dispatch`

Create a dispatch workflow.

Request:

```json
{
  "target": "optional slug/wallet/listing id",
  "task": "Research the current Base lending landscape",
  "maxSpend": "0.10",
  "currency": "USDC",
  "policy": {
    "requireValidAttestation": true,
    "requireWalletMatch": true,
    "requireFreshAtDispatch": true
  },
  "allowFallback": true
}
```

Response:

```json
{
  "workflowId": "hw_...",
  "status": "RESOLVING"
}
```

## GET `/api/dispatch/:workflowId`

Returns current workflow state.

## GET `/api/dispatch/:workflowId/events`

SSE stream of structured trace events.

Event example:

```json
{
  "seq": 4,
  "type": "verification.check",
  "timestamp": "...",
  "data": {
    "check": "wallet_binding",
    "result": "PASS"
  }
}
```

No fake terminal text.

## POST `/api/dispatch/:workflowId/execute`

Only succeeds when the workflow has a valid lease.

The backend must revalidate lease at execution time.

## GET `/api/receipts/:receiptId`

Public JSON receipt.

## POST `/api/verify-receipt`

Recompute a supplied/public receipt.

## POST `/api/proof-lab/run`

Request a controlled scenario.

Request must identify:

- source fixture
- fault type
- optional policy change

Response must classify evidence mode as `fault_injection`.

## GET `/api/catalog/runs/latest`

Latest frozen catalog experiment summary.

## GET `/api/catalog/runs/:runId`

Full public catalog run with raw candidate outcomes.

---

# 15. Persistence model

Minimum tables/collections:

## `workflows`

- id
- created_at
- updated_at
- request_json
- state
- active_candidate_id
- policy_hash
- evidence_mode

## `candidates`

- id
- workflow_id
- ordinal
- normalized_identity_json
- resolution_source
- resolution_artifact_hash

## `verifications`

- id
- workflow_id
- candidate_id
- checked_at
- attestation_hash
- verifier_version
- result_json
- decision

## `authorizations`

- id
- workflow_id
- candidate_id
- lease_json
- issued_at
- expires_at
- revoked_at
- consumed_at

## `executions`

- id
- workflow_id
- authorization_id
- requested_at
- state
- amount_atomic
- transaction_hash
- x402_request_id
- response_hash
- error_code

## `receipts`

- id
- workflow_id
- public_json
- receipt_hash
- created_at

## `catalog_runs`

- id
- snapshot_hash
- started_at
- completed_at
- policy_hash
- commit
- manifest_json
- result_json

Do not persist secrets in these tables.

---

# 16. Concurrency, replay, and idempotency

Required:

- each workflow has immutable context ID
- authorization nonce is unique
- execution endpoint is idempotent by workflow/authorization key
- duplicate execute calls cannot create duplicate paid requests when the underlying rail permits protection
- consumed single-use leases cannot be reused
- expired leases cannot be revived
- policy hash cannot change under an existing lease
- candidate target cannot change under an existing lease
- retry state must distinguish "request definitely failed" from "execution may have occurred"

Unknown execution must be surfaced as `UNKNOWN`, not retried blindly.

---

# 17. Time and freshness

Use server-side UTC.

Clock-dependent checks must use one documented source of server time.

Record:

- verification timestamp
- attestation issue/expiry
- authorization issue/expiry
- execution attempt timestamp

Boundary tests:

- exactly before expiry
- exactly at expiry
- after expiry

Use a small, documented clock-skew policy only if Orion's actual verifier/docs require it. Do not invent tolerance silently.

---

# 18. Failure behavior

## Orion unavailable

Decision: `UNVERIFIABLE`  
No lease.  
No dispatch.

## Base RPC unavailable

Decision: `UNVERIFIABLE` when Base state is required.  
No lease.

## Attestation malformed

Decision: `UNVERIFIABLE` or `REFUSE` according to frozen taxonomy.  
No lease.

## Credential expires mid-flow

Invalidate/expire lease.  
Require re-verification.

## x402 endpoint fails after authorization

Decision remains `AUTHORIZE`.  
Settlement becomes `FAILED` or `UNKNOWN`.  
Receipt must preserve distinction.

## Insufficient executor wallet balance

No false policy refusal.  
Settlement error is explicit.

## Candidate mismatch

`REFUSE / WALLET_MISMATCH`.

## No eligible fallback

End workflow cleanly and produce receipt.

---

# 19. Security invariants

Tests must prove:

1. LLM cannot directly create authorization.
2. Invalid signature cannot create authorization.
3. Unexpected signer cannot create authorization.
4. Expired credential cannot create authorization.
5. Wrong-wallet credential cannot create authorization.
6. Policy failure cannot create authorization.
7. Authorization cannot cross workflow/context.
8. Authorization cannot change target.
9. Authorization cannot exceed budget.
10. Expired authorization cannot execute.
11. Revoked authorization cannot execute.
12. Replayed authorization fails.
13. Executor has no bypass path.
14. Duplicate execution does not create duplicate paid work where deterministic prevention is possible.
15. Prompt injection in listing text cannot alter policy/verifier truth.
16. Fixture mode cannot be misclassified as live.
17. Fault-injection mode cannot be misclassified as live.

---

# 20. Threat model

## Malicious Store/listing content

Risk:

Prompt injection or misleading wallet/capability claims.

Mitigation:

Treat listing text as untrusted data. Deterministic identity and policy logic ignore instructions contained in listing text.

## Compromised Orion attestation transport/API

Risk:

Transport returns modified payload.

Mitigation:

Verify signed payload locally and compare to expected signer/context. A modified signed payload should fail.

## Replayed old valid credential

Risk:

Previously valid attestation reused.

Mitigation:

Freshness/expiry at dispatch time.

## Slug/listing impersonation

Risk:

Display identity points to a different wallet.

Mitigation:

Wallet binding.

## Malicious LLM

Risk:

Attempts to route around refusal.

Mitigation:

LLM never owns verifier, policy, lease, or signer.

## Compromised HIREWALL operator

Risk:

If operator controls executor key, operator could spend outside product.

Mitigation:

Dedicated low-balance wallet and explicit limitation. The v1 claim is application-path enforcement, not operator-independent custody.

## RPC failure/manipulation

Risk:

Incorrect identity state.

Mitigation:

Fail closed on unavailable required state. Optionally use a second provider for evidence checks if it improves truth without hiding inconsistency. Record disagreement.

## Replay/duplicate request

Mitigation:

Nonce, context, idempotency key, consumed lease state.

---

# 21. Trust story

Document in `SECURITY.md`.

At minimum:

## Buyer

Controls task and policy intent.

## HIREWALL agent

Controls planning and candidate selection only.

## Deterministic verifier/policy

Controls truth/eligibility.

## Orion oracle/signer

Controls the content it signs. HIREWALL does not independently prove the oracle's underlying performance claims are morally or economically correct.

## Base

Authoritative chain for onchain identity/payment evidence that is actually queried.

## HIREWALL operator

Controls deployment and, if used, demo executor key. This is a trust assumption.

## x402 facilitator/service

May affect payment transport/finality. Receipt must distinguish requested, submitted, and confirmed states.

---

# 22. Evidence campaign

## Deep proof

- reference verifier parity
- one-byte tamper
- signature mutation
- expiry boundary
- wallet mismatch
- over-budget rejection
- replay rejection
- no-bypass executor test
- receipt recomputation
- clean-room reproduction

## Wide proof

- frozen real Store/catalog cohort
- all reachable candidates
- same policy
- baseline vs treatment
- all refusals and unverifiable outcomes retained
- repeated run only when timestamp/freshness change is explicitly part of the experiment

Do not inflate sample size with synthetic duplicates.

---

# 23. Headline result

Do not pre-write the number.

Final README pattern:

> Across a frozen Orion Store cohort of N candidates, HIREWALL changed dispatch eligibility for X candidates compared with listing-only trust. Every changed decision is backed by a recomputable credential/policy receipt.

Only use this after the experiment produces valid N and X.

If the result is X=0, do not hide it. Use the tamper/expiry enforcement proof as the headline and explain that the live cohort was fully verifiable at snapshot time.

---

# 24. Epistemic red team

Before public claims, ask:

- Did we choose the cohort after seeing results?
- Did the Store snapshot change between baseline and treatment?
- Did a cached attestation make one candidate look fresh?
- Did local clock skew create false expiry?
- Did the baseline use different candidates?
- Did retries hide failed responses?
- Did we exclude unverifiable candidates?
- Did the verifier only pass one known fixture?
- Did we trust our own stored `verified` flag?
- Did the model affect a deterministic metric?
- Did RPC/provider disagreement get hidden?
- Did a paid probe get mislabeled as organic user volume?
- Did frontend fixture data enter the summary?
- Did we choose the prettiest rerun after an evaluator defect?

Publish the strongest remaining limitations.

---

# 25. Public evidence artifacts

Required:

```text
/evidence/submission/catalog-snapshot.json
/evidence/submission/catalog-run.json
/evidence/submission/catalog-run.manifest.json
/evidence/submission/verification-vectors/
/evidence/submission/live-dispatch-receipts/
/evidence/submission/fault-injection-receipts/
```

Convenience commands:

```bash
pnpm evidence:catalog
pnpm evidence:tamper
pnpm evidence:expiry
pnpm evidence:wallet-mismatch
pnpm evidence:replay
pnpm verify:receipt <receipt>
pnpm verify:submission
```

Exact scripts can change, but one-command reproduction must remain.

---

# 26. Open-source contribution plan

Inspect the Orion verifier/docs/examples and any public sponsor repos available.

Priority:

## Tier A candidates

- verifier correctness/security bug
- inconsistent signer/domain behavior
- reusable buyer-side authorization adapter
- robust verifier wrapper the sponsor could ship

## Tier B candidates

- missing failing fixtures
- schema compatibility issue
- incorrect expiry handling
- serious DX gap
- typed verifier interface
- docs example that fails on current payload

For every opportunity:

1. reproduce
2. preserve old failing behavior
3. patch/report
4. add fixture/test
5. upstream issue/PR if possible
6. record in `CONTRIBUTIONS.md`

No manufactured typo PR.

---

# 27. Observability

Structured events only.

Every workflow event should include:

- workflow ID
- sequence
- timestamp
- event type
- candidate ID where relevant
- deterministic result code
- artifact hash or reference where relevant

Do not log:

- private keys
- payment secrets
- full sensitive task content when unnecessary
- authorization material that creates replay risk

Frontend trace should render structured events as a clear decision timeline, not a fake terminal.

---

# 28. Rate limits and abuse

Protect:

- Orion public API
- Base RPC
- x402 paid probes
- LLM
- receipt storage

Requirements:

- per-IP/user workflow limits
- strict cap on live paid probe amount
- no unbounded catalog hammering
- bounded retries
- no automatic repeat payment after unknown execution
- catalog experiments run through an explicit script/admin operation, not every page load

---

# 29. Financial controls

Live proof wallet:

- dedicated to HIREWALL
- low balance
- Base-only
- no personal assets
- amount cap enforced in policy and executor
- balance shown only from real chain data if shown at all

Do not treat paid self-probes as adoption or organic x402 volume.

Label them `probe`.

---

# 30. Business and ecosystem thesis

## Demand

Any buyer, agent, marketplace, or orchestrator about to pay a third-party agent.

## Frequency

Every new hire, paid call, recurring worker selection, or re-verification after credential expiry.

## Value

Avoid dispatch to unverifiable/mismatched/stale identities and create machine-readable proof for why a worker was or was not allowed to receive work.

## Distribution

- Orion Store/Concierge-style buyer workflow
- reusable verifier/authorization package
- x402 integrators
- agent orchestrators
- public receipt verifier

## Capture

Future options:

- protected dispatch fee
- buyer-side API plan
- marketplace integration
- default authorization layer for agent orchestrators

Do not bolt monetization into the hackathon demo if it weakens proof.

## Compounding moat

- public corpus of real authorization/refusal receipts
- mature failure taxonomy
- verifier compatibility
- buyer-policy integrations
- marketplace embedding
- reusable authorization standard

---

# 31. Frontend requirement boundary

The frontend is a first-class product surface.

It must make visible:

- buyer intent
- candidate selection
- verification progress
- exact proof checks
- exact refusal reason
- authorization amount
- authorization expiry
- payment state
- receipt
- proof/reproduction route
- live vs fixture vs fault-injection status
- limitations where relevant

It must not:

- invent metrics
- show static fake balances
- show pre-baked "verified" states in production
- hide refusal details
- merge decision and settlement
- use a fake terminal as the primary trace
- require developer credentials to understand the mechanism

Full details are in `HIREWALL_FRONTEND_HANDOFF.md`.

---

# 32. Repo documentation

Before submission:

- `README.md`
- `ARCHITECTURE.md`
- `SECURITY.md`
- `CONTRIBUTIONS.md`
- `DECISIONS.md`
- `SETUP.md`
- `BUILD_CONTRACT.md`
- `HIREWALL_PRD.md`
- `HIREWALL_FRONTEND_HANDOFF.md`
- `GATES.md`
- `CLAIMS.md`
- `submission-facts.json`

README opening should lead with:

```text
product + measured outcome + proof
```

not test counts or integration counts.

Include:

`How could this result be misleading?`

---

# 33. Demo plan

Canonical 90–120 second flow:

## 0–10s

"You are about to pay an AI agent. A Store listing is not enough to authorize money."

## 10–30s

Enter a real candidate/task/budget.

Show candidate resolve and live Orion credential retrieval.

## 30–50s

Show deterministic verification and short authorization lease.

## 50–70s

Show a successful dispatch or, if the candidate fails, the exact refusal.

## 70–90s

Run controlled one-byte tamper or expiry.

Same source artifact. HIREWALL refuses. No authorization exists.

## 90–110s

Open public receipt verifier.

Recompute proof.

## End

Show measured catalog result only if valid.

Winning screenshot:

A clean candidate card with:

```text
REFUSE
ATTESTATION_EXPIRED
No payment authority created
Receipt: ...
```

beside the otherwise normal Orion listing identity.

---

# 34. Acceptance tests

## Competition

- registered wallet
- required website/X/GitHub/chat links
- ignition complete
- live demo reachable

## Product

- direct target flow works
- natural-language flow works
- fallback flow works when public catalog discovery supports it
- refusal works
- authorization expiry works
- receipt works
- Proof Lab works
- catalog page works

## Sponsor

- real Orion integration live
- Orion path load-bearing
- no silent generic fallback
- sponsor evidence visible

## Security

- invariants tested
- replay tested
- stale state tested
- wallet mismatch tested
- no-bypass executor tested
- keys/trust documented
- prompt injection boundary tested

## Reproducibility

- fixture suite works offline
- live suite separated
- clean clone works
- receipt verifier works without LLM/funded wallet

## Evidence

- claim ledger complete
- gate log complete
- negative evidence retained
- manifests complete
- catalog denominator known
- headline number derives from raw artifact
- `submission-facts.json` frozen

---

# 35. Immediate implementation order

1. Read `BUILD_CONTRACT.md`.
2. Create `GATES.md`, `DECISIONS.md`, `CLAIMS.md`.
3. Run Gate 001.
4. Freeze actual Orion payload/schema observations.
5. Implement verifier with positive and negative fixtures.
6. Implement candidate resolver.
7. Implement deterministic buyer policy.
8. Implement authorization lease.
9. Implement executor with no-bypass invariant.
10. Prove tamper/expiry/wallet/budget/replay refusal.
11. Implement public receipt and verifier.
12. Implement LLM planner on top of deterministic tools.
13. Integrate frontend contract.
14. Execute one real paid dispatch if the sponsor/x402 surface supports it.
15. Freeze catalog cohort and run baseline/treatment.
16. Inspect/upstream sponsor contribution opportunities.
17. Clean-room reproduce.
18. Freeze `submission-facts.json`.
19. Synchronize README/UI/video/submission.
20. Submission freeze and final integrity rerun.

No secondary feature outranks steps 3–12 or the comparative proof.
