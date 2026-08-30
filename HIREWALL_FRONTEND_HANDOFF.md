# HIREWALL - FRONTEND HANDOFF

Audience: frontend owner  
Purpose: build the entire user-facing HIREWALL product in parallel with backend/protocol work  
Visual direction: light theme, premium infrastructure/product quality  
Design freedom: high  
Behavioral/evidence constraints: strict

---

# 1. What you are building

HIREWALL is an AI-agent dispatch firewall.

A user is about to hire and pay an Orion agent. HIREWALL checks that worker's live Orion AgentBound credential, applies the buyer's hiring policy, and only authorizes the paid dispatch if the proof passes.

The simple product rule:

> No valid AgentBound authorization, no dispatch through HIREWALL.

The frontend must make that rule obvious without requiring the user to understand cryptographic implementation details.

The app should feel like a real buyer-side dispatch product, not a blockchain dashboard and not a hackathon test harness.

---

# 2. Your freedom

There is intentionally no visual design spec.

You own:

- visual system
- typography
- spacing
- component styling
- layout
- responsive behavior
- motion
- icon system
- information hierarchy
- tasteful illustration/graphic language if useful

Use a light theme.

Aim for:

- premium
- calm
- exact
- credible
- operational
- technical without becoming terminal-like
- clear enough for a non-protocol judge
- polished enough to feel deployable after the hackathon

Avoid generic AI SaaS styling:

- no arbitrary glassmorphism
- no giant glowing blockchain orb
- no neon cyberpunk
- no meaningless metric cards
- no fake terminal as the main product experience
- no repetitive four-card feature grid
- no decorative dashboards filled with fake activity
- no excessive rounded-card nesting
- no gradient-heavy "AI" look
- no placeholder charts in the final build

A good conceptual reference is closer to a modern payments/risk/operations product than a crypto landing page.

---

# 3. Product vocabulary

Use these exact top-level words consistently.

## Decisions

- `AUTHORIZE`
- `REFUSE`
- `UNVERIFIABLE`

## Settlement

- `NOT ATTEMPTED`
- `PENDING`
- `SUCCEEDED`
- `FAILED`
- `UNKNOWN`

Keep decision and settlement visually distinct.

Example:

```text
Identity decision: AUTHORIZE
Payment: FAILED
```

This is a valid state and must not look contradictory.

## Evidence labels

- `LIVE`
- `FIXTURE`
- `CONTROLLED FAULT INJECTION`

Never allow a fixture/fault-injection screen to look live.

---

# 4. Information architecture

Required routes/surfaces:

```text
/                      Landing + primary entry
/dispatch              Main dispatch workspace
/dispatch/:workflowId  Live/finished workflow
/proof-lab              Controlled failure lab
/receipts/:receiptId    Public receipt
/verify                  Receipt verifier
/catalog                 Frozen catalog experiment
/about                   Product boundaries/how it works
```

`/` and `/dispatch` can be combined if the final flow is cleaner, but all capabilities must remain reachable.

---

# 5. Landing page

The landing page should communicate the mechanism immediately.

Recommended hero structure:

Eyebrow:

```text
Buyer-side authorization for AI agents
```

Headline direction:

```text
Verify the worker before money leaves.
```

or:

```text
No valid AgentBound. No dispatch.
```

Subhead direction:

```text
HIREWALL checks a worker's live Orion credential, applies your policy, and only grants short-lived payment authority when the proof passes.
```

Primary CTA:

```text
Dispatch a task
```

Secondary CTA:

```text
Challenge HIREWALL
```

The second CTA opens Proof Lab.

The hero should show one believable micro-example, not fake platform stats.

Example visual narrative:

```text
Orion agent
↓
credential checks
↓
short-lived authorization
↓
paid dispatch
```

and a contrasting refusal:

```text
Expired credential
→ REFUSE
→ $0 authority
```

If real measured catalog numbers exist later, they can be injected from `submission-facts.json`. Do not hard-code them now.

---

# 6. Primary dispatch workspace

This is the core product.

Desktop can use a two-column or progressive workspace. Mobile should become a single clear sequence.

The flow should feel like hiring/dispatch, not filling a blockchain form.

## Input modes

Provide two tabs or segmented modes:

### Find a worker

User enters:

- task
- max budget in USDC
- optional supported capability/category
- optional supported policy
- allow fallback toggle

HIREWALL chooses candidate(s).

### Check a specific worker

User enters:

- Orion slug, wallet, or supported listing identifier
- task
- max budget
- optional supported policy

Do not require wallet connection merely to inspect/verify when the backend does not require it.

---

# 7. Buyer policy UI

Keep policy legible.

Always visible:

- Network: Base
- Max spend
- Valid Orion attestation required
- Wallet match required
- Fresh at dispatch required

Only show optional fields when the backend says they are supported by the verified Orion schema:

- minimum tier
- minimum composite score

Do not expose unsupported sliders/toggles as "coming soon."

When the user starts a workflow, show a short frozen-policy summary.

Example:

```text
Dispatch policy
Base
Max 0.10 USDC
Fresh AgentBound required
Wallet must match
```

Once authorization exists, changing policy should create a new/revalidated workflow rather than visually mutating an existing lease.

---

# 8. Live decision trace

The trace is central.

Do not use a fake terminal.

Use a structured timeline/stepper.

Possible steps:

```text
1  Intent received
2  Candidate selected
3  Orion listing resolved
4  Attestation fetched
5  Signature verified
6  Signer checked
7  Wallet binding checked
8  Freshness checked
9  Policy evaluated
10 Authorization created
11 Paid request submitted
12 Receipt created
```

Each step can have:

- pending
- active
- pass
- fail
- skipped
- unavailable

For agent-selected candidates, visibly show the agent loop:

```text
Candidate A
REFUSE · ATTESTATION_EXPIRED

HIREWALL selected Candidate B
...
AUTHORIZE
```

The user should understand that the AI chooses where to look, while deterministic checks decide what is true.

---

# 9. Candidate card

Each candidate should have a compact, credible identity surface.

Show only returned data:

- name
- slug
- category/capability
- declared wallet, shortened
- Store/listing link
- candidate source
- optional real Orion tier/score fields only when returned and verified

Do not create a HIREWALL trust score.

Add a clear verification status:

```text
Verifying
Verified credential
Refused
Unverifiable
```

The candidate card should transition into the verification result rather than being replaced by a separate unrelated screen.

---

# 10. Verification detail

This is the technical proof surface.

Show a checklist such as:

```text
Attestation present            PASS
Payload parses                 PASS
Signature                      PASS
Expected signer                PASS
Base chain                     PASS
AgentBound identity            PASS
Wallet binding                 PASS
Fresh at dispatch              PASS
Buyer policy                   PASS
```

Only show checks the backend actually performed.

Each item can expand to show:

- exact timestamp
- wallet
- signer
- chain
- artifact hash
- expected vs observed
- named refusal code

Do not display fake "cryptographic proof" animation.

A technical judge should be able to inspect details. A normal judge should be able to ignore them.

---

# 11. Decision stamp

The main state must be visually dominant.

## AUTHORIZE

Supporting copy:

```text
This worker passed the required Orion identity and buyer-policy checks.
```

Then show lease.

## REFUSE

Supporting copy must name the reason.

Example:

```text
ATTESTATION_EXPIRED

This credential expired before dispatch. HIREWALL created no payment authority.
```

## UNVERIFIABLE

Example:

```text
DEPENDENCY_UNAVAILABLE

HIREWALL cannot establish the required identity state right now, so no dispatch is authorized.
```

Never turn unavailable evidence into a red "bad agent" judgment.

---

# 12. Authorization lease component

When authorized, show a clear short-lived authorization artifact.

Fields:

- authorized worker
- max amount
- network
- attestation hash short form
- policy hash short form
- issued time
- expiry time
- remaining time
- authorization ID
- status

Status:

```text
ACTIVE
EXPIRED
REVOKED
CONSUMED
```

The expiry should feel real.

A compact live countdown is useful.

When it expires:

```text
Authorization expired
Re-verify before dispatch
```

Do not keep an old green "authorized" state visually active.

---

# 13. Dispatch/payment component

Separate identity decision from settlement.

Before execution:

```text
Authorization active
Ready to dispatch
0.05 USDC maximum
```

During:

```text
Submitting paid request
```

After success:

```text
Payment succeeded
Transaction / settlement proof
Response received
```

After failure:

```text
Identity authorization passed
Payment failed
```

Do not change the original identity decision to `REFUSE` because payment transport failed.

If a transaction hash exists, link to the correct explorer.

If there is no transaction because execution was refused before signing, say:

```text
No payment attempted
```

Do not create a fake blocked transaction hash.

---

# 14. Final workflow summary

At the end, show:

```text
Task
Selected worker
Identity decision
Policy result
Authorization
Settlement
Receipt
```

Give the user:

- View receipt
- Verify receipt
- Copy receipt link
- Open explorer if applicable
- Start another dispatch

For fallback workflows, add:

```text
Candidates inspected: N
```

only from backend data.

Allow expanding each attempted candidate.

---

# 15. Proof Lab

Route:

```text
/proof-lab
```

This is a polished judge feature, not a developer-only page.

Top copy:

```text
Challenge the dispatch gate.
Run the same verifier and authorization logic against controlled failure cases.
```

Large visible label:

```text
CONTROLLED FAULT INJECTION
```

Scenario selector:

- Valid credential
- Tamper signed payload
- Swap wallet
- Expire credential
- Exceed budget
- Replay authorization
- Malformed attestation

Interaction:

1. Select source fixture.
2. Select scenario.
3. Show exactly what mutation will be made.
4. Run.
5. Render the same verification timeline.
6. Show `AUTHORIZE` or `REFUSE`.
7. Show exact code.
8. Generate fault-injection receipt.
9. Offer `Verify receipt`.

For tamper:

```text
Changed: one byte in signed payload
Expected: signature verification fails
Observed: SIGNATURE_INVALID
```

Do not imply the source Orion agent actually published the tampered data.

---

# 16. Public receipt page

Route:

```text
/receipts/:receiptId
```

This page must work as a shareable evidence artifact.

Header:

- HIREWALL receipt
- evidence mode
- decision
- settlement
- timestamp
- receipt ID

Sections:

## Request

- task hash or redacted task summary
- budget
- network
- context ID

## Candidate

- identity
- wallet
- Store/listing link

## Orion credential

- attestation hash
- signer
- issued/expiry
- AgentBound identifier where available

## Verification

Full deterministic check list.

## Policy

Frozen policy hash and readable policy.

## Authorization

Lease details or:

```text
No authorization created
```

## Execution

- state
- amount
- tx/settlement ID
- x402 request ID if available
- response hash if available

## Reproduce

- web verify button
- CLI command

## Limitations

Show relevant limitation inline.

Example:

```text
This receipt proves that HIREWALL verified the recorded Orion credential and applied the recorded policy. It does not prove that the agent will perform well in future jobs.
```

---

# 17. Receipt verifier

Route:

```text
/verify
```

Two modes:

- paste/upload receipt JSON
- enter public receipt URL/ID

Result:

```text
Receipt schema                PASS
Receipt hash                  PASS
Attestation artifact          PASS
Signature                     PASS
Expected signer               PASS
Wallet binding                PASS
Fresh at dispatch             PASS
Policy recomputation          PASS
Authorization                 PASS
Settlement evidence           PASS / NOT CLAIMED
```

The verifier should explain `NOT CLAIMED`.

Do not force every field to green. A refusal receipt can be valid evidence.

Example:

```text
Receipt integrity: PASS
Dispatch decision: REFUSE
Reason: ATTESTATION_EXPIRED
```

---

# 18. Catalog experiment page

Route:

```text
/catalog
```

Purpose:

Show the measured whole-field experiment, not a generic analytics dashboard.

Header:

```text
Frozen Orion catalog run
```

Show:

- run timestamp
- snapshot ID/hash
- cohort denominator
- policy
- software commit
- baseline rule
- HIREWALL rule

Main outcome visualization can be a simple bar/stack or clear counts, but it must come from real backend data.

Candidate table:

Columns:

- candidate
- baseline eligible
- HIREWALL decision
- exact reason
- attestation freshness at run
- receipt

Filters:

- authorize
- refuse
- unverifiable
- reason

Every row should link to raw receipt.

Add:

```text
Download raw JSON
Reproduce run
Methodology
How could this result be misleading?
```

Do not hide zero/negative results.

---

# 19. About / boundaries page

Route:

```text
/about
```

Keep short and useful.

Explain:

## What HIREWALL proves

- the Orion credential was retrieved
- deterministic checks passed/failed
- the buyer policy passed/failed
- a HIREWALL authorization existed or did not exist
- a payment was or was not attempted through HIREWALL
- a recorded settlement is verifiable when evidence exists

## What HIREWALL does not prove

- future worker quality
- truth of every metric inside an oracle-signed attestation
- absence of compromise in all infrastructure
- operator-independent custody unless the final backend actually proves that

This honesty is a product feature.

---

# 20. Empty states

Design good empty states.

## No workflow yet

```text
Describe a task or check a specific Orion worker.
```

## No candidate found

```text
HIREWALL could not resolve a worker from that input.
Check the identifier or try direct-wallet mode.
```

## No eligible fallback

```text
No candidate satisfied this dispatch policy.
No payment authority was created.
```

## No catalog run yet

```text
No frozen field run has been published yet.
```

Do not fill empty states with fake examples labeled as live.

---

# 21. Error and recovery UX

Required cases:

## Wallet disconnected

Only relevant where wallet connection is actually required.

Never block read-only verification unnecessarily.

## Orion API unavailable

```text
Orion credential unavailable
HIREWALL cannot verify identity right now.
No dispatch authority created.
Retry
```

## Base RPC unavailable

```text
Base identity check unavailable
Verification is incomplete.
No dispatch authority created.
```

## Authorization expires

```text
Authorization expired
Re-verify this worker to continue.
```

## Insufficient executor balance

```text
Authorization passed, but the dispatch wallet does not have enough funds.
```

## Payment failure

```text
The worker was authorized, but payment did not complete.
```

## Unknown execution

Treat seriously.

```text
Execution status is uncertain.
HIREWALL will not blindly retry a paid request.
```

## Malformed input

Field-specific validation, not generic toast only.

---

# 22. Responsive behavior

Mobile is not a shrunk desktop dashboard.

## Mobile

- one main action per screen section
- trace becomes vertical
- hash/address rows copyable and horizontally safe
- tables become cards or scrollable data surfaces
- authorization countdown remains visible near dispatch button
- refusal reason remains above technical detail
- bottom-sheet detail is acceptable
- no tiny desktop-style sidebars

## Tablet

Two-pane layout can appear where useful.

## Desktop

Use space for:

- primary workflow
- verification detail
- authorization/receipt context

Keep reading order obvious.

---

# 23. Accessibility

Required:

- keyboard usable
- visible focus states
- no status communicated only by color
- WCAG-conscious contrast
- buttons have explicit labels
- copyable hashes have accessible labels
- live trace announcements should not overwhelm screen readers
- timers should not spam accessibility tree every second
- reduced-motion support
- dialogs/sheets trap and restore focus correctly
- form errors associated with inputs

---

# 24. Motion

Use restrained motion.

Good:

- step completion
- candidate transition
- authorization issued
- lease expiry
- receipt reveal

Avoid:

- looping glowing backgrounds
- excessive number tickers
- fake code typing
- cinematic crypto transitions

Security/infrastructure products should feel controlled.

---

# 25. Data-display rules

Never invent:

- wallet balances
- Store counts
- percentages
- scores
- latency
- transaction state
- candidate reputation
- attestation expiry
- receipt hashes

For development, fixture data must be visibly marked.

Recommended global development banner when using mock adapter:

```text
DEVELOPMENT FIXTURE DATA
```

Production routes must not show this data accidentally.

---

# 26. Frontend architecture for parallel work

Build the UI against a typed adapter.

Recommended:

```ts
interface HirewallApi {
  createDispatch(input: CreateDispatchInput): Promise<{ workflowId: string }>;
  getDispatch(id: string): Promise<DispatchWorkflow>;
  subscribeToDispatch(id: string, onEvent: (event: WorkflowEvent) => void): () => void;
  executeDispatch(id: string): Promise<DispatchWorkflow>;
  getReceipt(id: string): Promise<HirewallReceipt>;
  verifyReceipt(input: ReceiptInput): Promise<ReceiptVerification>;
  runProofLab(input: ProofLabInput): Promise<ProofLabRun>;
  getLatestCatalogRun(): Promise<CatalogRun>;
}
```

Provide two implementations:

```text
RemoteHirewallApi
FixtureHirewallApi
```

`FixtureHirewallApi` is development-only.

Do not scatter mock objects directly through components.

---

# 27. Suggested shared client types

```ts
export type EvidenceMode = "live" | "fixture" | "fault_injection";

export type Decision = "AUTHORIZE" | "REFUSE" | "UNVERIFIABLE";

export type SettlementState =
  | "NOT_ATTEMPTED"
  | "PENDING"
  | "SUCCEEDED"
  | "FAILED"
  | "UNKNOWN";

export interface WorkflowEvent {
  seq: number;
  type: string;
  timestamp: string;
  candidateId?: string;
  data: Record<string, unknown>;
}

export interface CandidateView {
  id: string;
  name?: string;
  slug?: string;
  wallet?: string;
  listingUrl?: string;
  category?: string;
}

export interface VerificationCheck {
  id: string;
  label: string;
  status: "pending" | "pass" | "fail" | "skipped" | "unavailable";
  code?: string;
  detail?: string;
}

export interface AuthorizationView {
  id: string;
  amount: string;
  currency: "USDC";
  issuedAt: string;
  expiresAt: string;
  status: "ACTIVE" | "EXPIRED" | "REVOKED" | "CONSUMED";
  attestationHash: string;
  policyHash: string;
}

export interface DispatchWorkflow {
  id: string;
  evidenceMode: EvidenceMode;
  state: string;
  candidate?: CandidateView;
  attemptedCandidates?: Array<{
    candidate: CandidateView;
    decision: Decision;
    refusalCode?: string;
  }>;
  verification: VerificationCheck[];
  decision?: Decision;
  refusalCode?: string;
  authorization?: AuthorizationView;
  settlement: SettlementState;
  receiptId?: string;
}
```

Backend may extend types. The core semantics should remain stable.

---

# 28. Development fixtures

Frontend owner needs enough fixtures to complete every screen.

Required fixture scenarios:

```text
valid_authorized
valid_authorized_payment_pending
valid_authorized_payment_success
valid_authorized_payment_failed
attestation_missing
signature_invalid
signer_untrusted
attestation_expired
wallet_mismatch
policy_rejected
authorization_expired
budget_exceeded
dependency_unavailable
execution_unknown
fallback_first_refused_second_authorized
all_candidates_rejected
catalog_mixed_results
fault_injection_tamper
fault_injection_expiry
```

Every fixture object:

```ts
evidenceMode: "fixture"
```

Fault-injection fixtures:

```ts
evidenceMode: "fault_injection"
```

The UI should make it visually impossible to mistake these for live production evidence.

---

# 29. Component inventory

Likely components:

```text
AppShell
TopNav
EvidenceModeBadge
DispatchModeSwitch
TaskComposer
BudgetInput
PolicySummary
PolicyEditor
CandidateCard
CandidateAttemptList
AgentDecisionTrace
VerificationChecklist
VerificationDetailDrawer
DecisionStamp
RefusalReason
AuthorizationLease
AuthorizationCountdown
DispatchAction
SettlementStatus
ReceiptSummary
ReceiptHeader
ReceiptSection
HashValue
AddressValue
ExplorerLink
CopyButton
ProofLabScenarioPicker
FaultMutationPreview
CatalogRunHeader
CatalogOutcomeSummary
CatalogCandidateTable
MethodologyPanel
LimitationCallout
ReceiptVerifierDropzone
ReceiptVerificationChecklist
EmptyState
DependencyError
UnknownExecutionWarning
DevFixtureBanner
```

Component names are suggestions, not mandatory.

---

# 30. Copy tone

Use:

- precise
- calm
- operational
- short
- factual

Avoid:

- "100% safe"
- "unhackable"
- "trustless"
- "guaranteed good agent"
- "AI-powered security revolution"
- "next-gen Web3"
- "military grade"
- hype

Examples:

Good:

```text
Signature verified
Wallet matches credential
Authorization expires in 18m
No payment attempted
```

Bad:

```text
Ultimate AI Trust Shield activated
```

---

# 31. Quality bar for the first 30 seconds

A judge should understand this without opening documentation:

1. They are hiring an AI worker.
2. HIREWALL checks Orion identity.
3. Verification determines payment authority.
4. Failure means no authority.
5. A receipt proves what happened.

The UI should surface those five ideas naturally.

---

# 32. The most important demo scene

Design this state especially well:

Left/upper context:

```text
Worker
Normal-looking Orion listing identity
```

Main decision:

```text
REFUSE
ATTESTATION_EXPIRED
```

Supporting consequence:

```text
No payment authority created
```

Evidence:

```text
Expired at: ...
Checked at: ...
Receipt: ...
```

Action:

```text
Verify receipt
```

This is the winning screenshot candidate.

---

# 33. Merge boundary with backend

Frontend owner should deliver:

- complete visual system
- all routes
- all components
- all responsive states
- fixture adapter
- remote API adapter interface
- typed view models
- SSE trace rendering
- receipt renderer
- receipt verifier input/result UI
- Proof Lab UI
- catalog result UI
- error/recovery UI
- accessibility pass
- loading/skeleton states
- final light-theme polish

Backend owner will later wire:

- live candidate resolution
- Orion attestation retrieval
- Base reads
- deterministic verifier
- policy engine
- authorization lease
- x402 executor
- real receipts
- catalog run data
- public verifier result
- submission facts

The frontend must not require backend owner to redesign the UI to add real refusal/error states. All states should already exist.

---

# 34. Frontend delivery checklist

Before handoff:

- [ ] Light theme complete
- [ ] Landing page polished
- [ ] Direct worker flow complete
- [ ] Find-worker flow complete
- [ ] Buyer policy UI complete
- [ ] Structured trace complete
- [ ] Candidate attempt/fallback UI complete
- [ ] Verification checklist complete
- [ ] Decision states complete
- [ ] Authorization lease/countdown complete
- [ ] Settlement states separate from decision
- [ ] Receipt page complete
- [ ] Receipt verifier complete
- [ ] Proof Lab complete
- [ ] Catalog run page complete
- [ ] About/boundaries complete
- [ ] All required error states complete
- [ ] Mobile/tablet/desktop complete
- [ ] Keyboard/accessibility pass
- [ ] No fake terminal
- [ ] No placeholder charts
- [ ] No hard-coded production metrics
- [ ] Fixture banner/evidence labels work
- [ ] Remote API adapter is isolated
- [ ] No secrets in client code
- [ ] Build/typecheck/lint pass
- [ ] Social preview/metadata polished
- [ ] Empty states polished
- [ ] Every refusal shows exact backend reason
- [ ] Every receipt has a clear verification path

The final frontend should feel complete even before real backend data is wired, while making it impossible to confuse development fixtures with live product evidence.
