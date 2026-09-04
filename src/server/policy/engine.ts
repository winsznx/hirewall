import type { RefusalCode } from "../refusal-codes";
import type { BuyerPolicy, NormalizedCredentialResult, PolicyResult } from "../types";
import { hashObject } from "./hash";

// Deterministic buyer policy evaluation. Per BUILD_CONTRACT.md section 7,
// no LLM output may influence this function's result. It only reads a
// NormalizedCredentialResult (HIREWALL's own type) — never a raw
// provider payload.
export function policyHash(policy: BuyerPolicy): string {
  return hashObject(policy);
}

export function evaluatePolicy(
  policy: BuyerPolicy,
  credential: NormalizedCredentialResult,
  requestedAmountAtomic: string,
  now: string
): PolicyResult {
  const checkedAt = now;
  const hash = policyHash(policy);

  if (credential.status !== "VERIFIED") {
    return {
      ok: false,
      policyHash: hash,
      failureCode: credential.refusalCode ?? "ATTESTATION_MISSING",
      checkedAt,
    };
  }

  if (policy.requireWalletMatch && !credential.subject.wallet) {
    return { ok: false, policyHash: hash, failureCode: "WALLET_MISMATCH", checkedAt };
  }

  if (policy.requireFreshAtDispatch) {
    if (!credential.expiresAt || Date.parse(credential.expiresAt) <= Date.parse(now)) {
      return { ok: false, policyHash: hash, failureCode: "ATTESTATION_EXPIRED", checkedAt };
    }
  }

  if (BigInt(requestedAmountAtomic) > BigInt(policy.maxSpendAtomic)) {
    return { ok: false, policyHash: hash, failureCode: "BUDGET_EXCEEDED", checkedAt };
  }

  const failedCheck = credential.checks.find((c) => c.status === "FAIL");
  if (failedCheck) {
    return {
      ok: false,
      policyHash: hash,
      failureCode: (failedCheck.code as RefusalCode | undefined) ?? "POLICY_REJECTED",
      checkedAt,
    };
  }

  return { ok: true, policyHash: hash, checkedAt };
}
