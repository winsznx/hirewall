// Server-side domain types. These are HIREWALL's own contracts — the
// NormalizedCredentialResult in particular belongs to HIREWALL, not to any
// alleged Orion payload shape. See DECISIONS.md DEC-004.
import type { Decision, EvidenceMode, RefusalCode, SettlementState } from "./refusal-codes";

export interface ResolvedCandidate {
  id: string;
  slug?: string;
  name?: string;
  listingUrl?: string;
  declaredWallet?: string;
  category?: string;
  capabilities?: string[];
  source: "orion_store" | "direct_wallet" | "fixture" | "other_supported_orion_surface";
}

export interface VerificationContext {
  contextId: string;
  chainId: number;
  requestedAt: string;
}

export interface CredentialCheck {
  id: string;
  status: "PASS" | "FAIL" | "UNAVAILABLE";
  code?: RefusalCode;
  evidenceRef?: string;
}

// The normalized shape every CredentialProvider must return. HIREWALL's
// policy engine, lease service, and receipts operate only on this type —
// never on a provider-specific payload. See DECISIONS.md DEC-004.
export interface NormalizedCredentialResult {
  providerId: string;
  status: "VERIFIED" | "REFUSED" | "UNVERIFIABLE";
  checkedAt: string;

  subject: {
    id: string;
    wallet?: string;
    chainId?: number;
  };

  expiresAt?: string;

  checks: CredentialCheck[];

  rawArtifactHash?: string;
  providerReceipt?: unknown;

  refusalCode?: RefusalCode;
}

export interface BuyerPolicy {
  chainId: number;
  maxSpendAtomic: string;
  requireValidAttestation: true;
  requireWalletMatch: true;
  requireFreshAtDispatch: true;
  minimumTier?: string;
  minimumCompositeScore?: number;
}

export interface PolicyResult {
  ok: boolean;
  policyHash: string;
  failureCode?: RefusalCode;
  checkedAt: string;
}

export interface AuthorizationLease {
  id: string;
  contextId: string;
  candidateId: string;
  targetWallet?: string;
  maxAmountAtomic: string;
  chainId: number;
  credentialResultHash: string;
  policyHash: string;
  issuedAt: string;
  expiresAt: string;
  nonce: string;
  revoked: boolean;
  consumedAt?: string;
}

export interface DispatchRequest {
  contextId: string;
  candidateId: string;
  targetWallet?: string;
  amountAtomic: string;
  chainId: number;
  credentialResultHash: string;
  policyHash: string;
}

export interface ExecutionResult {
  state: SettlementState;
  amountAtomic?: string;
  transactionHash?: string;
  x402RequestId?: string;
  endpoint?: string;
  responseHash?: string;
  errorCode?: RefusalCode;
}

export interface WorkflowRecord {
  id: string;
  contextId: string;
  evidenceMode: EvidenceMode;
  createdAt: string;
  updatedAt: string;
  state: string;
  request: {
    task: string;
    maxSpendAtomic: string;
    chainId: number;
    workerIdentifier?: string;
    allowFallback: boolean;
  };
  candidate?: ResolvedCandidate;
  attemptedCandidates: Array<{
    candidate: ResolvedCandidate;
    decision: Decision;
    refusalCode?: RefusalCode;
  }>;
  credentialResult?: NormalizedCredentialResult;
  policy: BuyerPolicy;
  policyResult?: PolicyResult;
  authorization?: AuthorizationLease;
  decision?: Decision;
  refusalCode?: RefusalCode;
  execution: ExecutionResult;
  receiptId?: string;
  events: WorkflowEvent[];
}

export interface WorkflowEvent {
  seq: number;
  type: string;
  timestamp: string;
  candidateId?: string;
  data: Record<string, unknown>;
}
