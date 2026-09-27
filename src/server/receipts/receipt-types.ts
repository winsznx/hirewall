import type { Decision, EvidenceMode, RefusalCode } from "../refusal-codes";
import type {
  AuthorizationLease,
  ExecutionResult,
  NormalizedCredentialResult,
  PolicyLevel,
  ResolvedCandidate,
} from "../types";

export interface FaultInjectionInfo {
  faultId: string;
  mutation: string;
  sourceFixtureHash: string;
}

// Frozen per HIREWALL_PRD.md section 12.9. The `verification` field holds
// a NormalizedCredentialResult (HIREWALL's own type, see DEC-004) rather
// than a raw provider payload — an honest receipt can only claim what
// HIREWALL itself computed.
export interface HirewallReceipt {
  schemaVersion: "1.0";
  receiptId: string;
  evidenceMode: EvidenceMode;
  createdAt: string;

  request: {
    contextId: string;
    taskHash?: string;
    maxSpendAtomic: string;
    chainId: number;
  };

  candidate: ResolvedCandidate;

  provider: {
    providerId: string;
    rawArtifactHash?: string;
  };

  verification: NormalizedCredentialResult;

  policy: {
    policyHash: string;
    policyLevel: PolicyLevel;
    result: "PASS" | "FAIL" | "NOT_EVALUATED";
    failureCode?: RefusalCode;
  };

  authorization?: AuthorizationLease;

  decision: Decision;
  refusalCode?: RefusalCode;

  execution: ExecutionResult;

  faultInjection?: FaultInjectionInfo;

  software: {
    commit: string;
    verifierVersion: string;
    policyVersion: string;
  };

  receiptHash: string;
}

export type ReceiptInputForBuild = Omit<HirewallReceipt, "receiptHash" | "schemaVersion" | "createdAt" | "receiptId"> & {
  createdAt?: string;
};
