// Canonical refusal/error taxonomy. Frozen by BUILD_CONTRACT.md section 8
// and HIREWALL_PRD.md section 10. Do not rename existing codes casually —
// see BUILD_CONTRACT.md section 8 for the amendment process.
export type RefusalCode =
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

export type Decision = "AUTHORIZE" | "REFUSE" | "UNVERIFIABLE";

export type SettlementState =
  | "NOT_ATTEMPTED"
  | "PENDING"
  | "SUCCEEDED"
  | "FAILED"
  | "UNKNOWN";

export type EvidenceMode = "live" | "fixture" | "fault_injection";
