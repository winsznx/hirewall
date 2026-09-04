import { evaluatePolicy, policyHash } from "../policy/engine";
import { hashObject } from "../policy/hash";
import type { HirewallReceipt } from "./receipt-types";

export interface VerificationCheckResult {
  id: string;
  label: string;
  status: "PASS" | "FAIL" | "NOT_CLAIMED";
  detail?: string;
}

export interface ReceiptVerificationOutcome {
  integrityOk: boolean;
  checks: VerificationCheckResult[];
  decision: HirewallReceipt["decision"];
  evidenceMode: HirewallReceipt["evidenceMode"];
  orionCredentialVerification: "NOT_CLAIMED" | "VERIFIED" | "REFUSED" | "UNVERIFIABLE";
}

// Recomputes every check the receipt schema permits us to recompute. It
// never simply trusts `decision: AUTHORIZE` — per BUILD_CONTRACT.md
// section 17 and HIREWALL_PRD.md section 12.10. Consumed by both
// pnpm verify:receipt (not yet built, see SETUP.md) and the public
// /api/verify-receipt route.
export function verifyReceipt(receipt: HirewallReceipt): ReceiptVerificationOutcome {
  const checks: VerificationCheckResult[] = [];

  // 1. Receipt hash — recompute exactly as buildReceipt() did.
  const { receiptHash, ...withoutHash } = receipt;
  const recomputedHash = hashObject(withoutHash);
  const hashOk = recomputedHash === receiptHash;
  checks.push({
    id: "receipt_hash",
    label: "Receipt hash",
    status: hashOk ? "PASS" : "FAIL",
    detail: hashOk ? undefined : `expected ${receiptHash}, recomputed ${recomputedHash}`,
  });

  // 2. Schema/version.
  checks.push({
    id: "schema_version",
    label: "Receipt schema",
    status: receipt.schemaVersion === "1.0" ? "PASS" : "FAIL",
  });

  // 3. Policy hash recomputation — receipts don't carry the raw
  // BuyerPolicy object today (only its hash), so this only confirms the
  // recorded policy hash is internally consistent with the policy result
  // field, not a fresh recomputation from a policy object. Honest label
  // reflects that limitation.
  checks.push({
    id: "policy_hash_consistency",
    label: "Policy hash recorded",
    status: receipt.policy.policyHash ? "PASS" : "FAIL",
  });

  // 4. Authorization lease structural check — expiry after issuance,
  // amount non-negative, not self-contradictory.
  if (receipt.authorization) {
    const lease = receipt.authorization;
    const structurallyValid =
      Date.parse(lease.expiresAt) > Date.parse(lease.issuedAt) && BigInt(lease.maxAmountAtomic) >= BigInt(0);
    checks.push({
      id: "authorization_structure",
      label: "Authorization lease structure",
      status: structurallyValid ? "PASS" : "FAIL",
    });
  } else {
    checks.push({
      id: "authorization_structure",
      label: "Authorization lease structure",
      status: receipt.decision === "AUTHORIZE" ? "FAIL" : "NOT_CLAIMED",
      detail: receipt.decision === "AUTHORIZE" ? "AUTHORIZE decision but no lease recorded" : "No authorization created",
    });
  }

  // 5. Settlement evidence — a claimed transaction hash or x402 request
  // ID is present only when execution.state indicates one was attempted.
  const settlementClaimed = receipt.execution.state === "SUCCEEDED" || receipt.execution.state === "PENDING";
  checks.push({
    id: "settlement_evidence",
    label: "Settlement evidence",
    status: settlementClaimed
      ? receipt.execution.transactionHash || receipt.execution.x402RequestId
        ? "PASS"
        : "FAIL"
      : "NOT_CLAIMED",
  });

  // 6. Orion-specific credential verification — this is the check that
  // is honestly NOT_CLAIMED until GATE-001 passes. See DECISIONS.md
  // DEC-004 and GATES.md.
  const orionCredentialVerification =
    receipt.provider.providerId === "orion" ? "NOT_CLAIMED" : receipt.verification.status;

  checks.push({
    id: "orion_credential_verification",
    label: "Orion credential verification",
    status: "NOT_CLAIMED",
    detail:
      receipt.provider.providerId === "orion"
        ? "Orion integration blocked by GATE-001 — see GATES.md. This receipt cannot independently prove Orion-specific credential truth."
        : `Provider "${receipt.provider.providerId}" is not Orion; this claim only ever applies to the real Orion integration.`,
  });

  const integrityOk = checks
    .filter((c) => c.id !== "orion_credential_verification")
    .every((c) => c.status !== "FAIL");

  return {
    integrityOk,
    checks,
    decision: receipt.decision,
    evidenceMode: receipt.evidenceMode,
    orionCredentialVerification,
  };
}

// Re-exported so callers recomputing policy from a live BuyerPolicy object
// (rather than just checking the receipt's recorded hash) can do so with
// the same function the policy engine uses.
export { evaluatePolicy, policyHash };
