// Shared view-model types for the HIREWALL frontend.
// These are the contract between UI components and both the fixture
// and remote API adapters. See HIREWALL_FRONTEND_HANDOFF.md section 27.

export type EvidenceMode = "live" | "fixture" | "fault_injection";

export type Decision = "AUTHORIZE" | "REFUSE" | "UNVERIFIABLE";

export type SettlementState =
  | "NOT_ATTEMPTED"
  | "PENDING"
  | "SUCCEEDED"
  | "FAILED"
  | "UNKNOWN";

export type AuthorizationStatus = "ACTIVE" | "EXPIRED" | "REVOKED" | "CONSUMED";

export type VerificationCheckStatus =
  | "pending"
  | "active"
  | "pass"
  | "fail"
  | "skipped"
  | "unavailable";

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
  source?: "direct" | "search" | "fallback";
  orionTier?: string;
  orionScore?: number;
}

export interface VerificationCheck {
  id: string;
  label: string;
  status: VerificationCheckStatus;
  code?: string;
  detail?: string;
  timestamp?: string;
  expected?: string;
  observed?: string;
}

export interface AuthorizationView {
  id: string;
  amount: string;
  currency: "USDC";
  network: "Base";
  issuedAt: string;
  expiresAt: string;
  status: AuthorizationStatus;
  attestationHash: string;
  policyHash: string;
}

export type PolicyLevel = "IDENTITY_REQUIRED" | "REPUTATION_REQUIRED";

export interface PolicyView {
  network: "Base";
  maxSpend: string;
  currency: "USDC";
  policyLevel: PolicyLevel;
  freshAttestationRequired: boolean;
  walletMatchRequired: boolean;
  freshAtDispatchRequired: boolean;
  minimumTier?: string;
  minimumCompositeScore?: number;
  policyHash?: string;
}

export interface ExecutionView {
  state: SettlementState;
  amount?: string;
  currency?: "USDC";
  txId?: string;
  explorerUrl?: string;
  x402RequestId?: string;
  responseHash?: string;
}

export interface CandidateAttempt {
  candidate: CandidateView;
  decision: Decision;
  refusalCode?: string;
  verification?: VerificationCheck[];
}

export interface DispatchWorkflow {
  id: string;
  evidenceMode: EvidenceMode;
  state: string;
  task: string;
  policy: PolicyView;
  candidate?: CandidateView;
  attemptedCandidates?: CandidateAttempt[];
  verification: VerificationCheck[];
  decision?: Decision;
  refusalCode?: string;
  refusalDetail?: string;
  authorization?: AuthorizationView;
  settlement: SettlementState;
  execution?: ExecutionView;
  receiptId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HirewallReceipt {
  id: string;
  evidenceMode: EvidenceMode;
  decision: Decision;
  refusalCode?: string;
  settlement: SettlementState;
  timestamp: string;
  request: {
    taskSummary: string;
    budget: string;
    network: "Base";
    contextId: string;
  };
  candidate?: CandidateView;
  credential?: {
    attestationHash: string;
    signer: string;
    issuedAt: string;
    expiresAt: string;
    agentBoundId?: string;
  };
  verification: VerificationCheck[];
  policy: PolicyView;
  authorization?: AuthorizationView;
  execution?: ExecutionView;
  limitations: string[];
}

export interface ReceiptVerification {
  receiptId: string;
  checks: Array<{
    id: string;
    label: string;
    status: "pass" | "fail" | "not_claimed";
    detail?: string;
  }>;
  decision: Decision;
  refusalCode?: string;
  overallValid: boolean;
}

export interface ProofLabScenario {
  id: string;
  label: string;
  description: string;
}

export interface ProofLabInput {
  sourceFixtureId: string;
  scenarioId: string;
}

export interface ProofLabRun {
  id: string;
  scenario: ProofLabScenario;
  mutation: {
    description: string;
    expected: string;
    observed: string;
  };
  verification: VerificationCheck[];
  decision: Decision;
  refusalCode?: string;
  receiptId: string;
}

export interface CatalogCandidateRow {
  candidateId: string;
  name: string;
  baselineEligible: boolean;
  decision: Decision;
  refusalCode?: string;
  attestationFreshnessAtRun: string;
  receiptId: string;
}

export interface CatalogRun {
  id: string;
  evidenceMode: EvidenceMode;
  runTimestamp: string;
  snapshotHash: string;
  cohortDenominator: number;
  policy: PolicyView;
  softwareCommit: string;
  baselineRule: string;
  hirewallRule: string;
  counts: {
    authorize: number;
    refuse: number;
    unverifiable: number;
  };
  candidates: CatalogCandidateRow[];
}

export interface CreateDispatchInput {
  mode: "find" | "check";
  task: string;
  maxBudget: string;
  category?: string;
  policyId?: string;
  allowFallback?: boolean;
  workerIdentifier?: string;
  policyLevel?: PolicyLevel;
}

export interface ReceiptInput {
  receiptJson?: string;
  receiptId?: string;
}
