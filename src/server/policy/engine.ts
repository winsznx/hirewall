import type { RefusalCode } from "../refusal-codes";
import type { BuyerPolicy, CredentialCheck, NormalizedCredentialResult, PolicyResult } from "../types";
import { hashObject } from "./hash";

// Deterministic buyer policy evaluation. Per BUILD_CONTRACT.md section 7,
// no LLM output may influence this function's result. It only reads a
// NormalizedCredentialResult (HIREWALL's own type) — never a raw
// provider payload.
export function policyHash(policy: BuyerPolicy): string {
  return hashObject(policy);
}

// Checks that establish only onchain AgentBound identity (existence,
// mint state, chain). Emitted by both OrionCredentialProvider and
// FixtureCredentialProvider before any signed-attestation fetch is
// attempted — see orion-provider.ts.
const IDENTITY_CHECK_IDS = new Set(["chain", "onchain_agentbound", "onchain_reputation", "attestation_present"]);

function identityEstablished(credential: NormalizedCredentialResult): boolean {
  // A VERIFIED credential is the strongest possible signal and trivially
  // satisfies identity-only requirements, regardless of which specific
  // check ids a given provider happens to emit.
  if (credential.status === "VERIFIED") return true;

  // UNVERIFIABLE with ATTESTATION_MISSING specifically means onchain
  // identity checks passed and only the signed reputation credential is
  // what's unavailable — see orion-provider.ts verifyCandidate(). Confirm
  // the identity-shaped checks themselves didn't fail.
  if (credential.status !== "UNVERIFIABLE" || credential.refusalCode !== "ATTESTATION_MISSING") return false;
  const identityChecks = credential.checks.filter((c: CredentialCheck) => IDENTITY_CHECK_IDS.has(c.id));
  return identityChecks.length > 0 && !identityChecks.some((c) => c.status === "FAIL");
}

export function evaluatePolicy(
  policy: BuyerPolicy,
  credential: NormalizedCredentialResult,
  requestedAmountAtomic: string,
  now: string
): PolicyResult {
  const checkedAt = now;
  const hash = policyHash(policy);

  if (policy.policyLevel === "IDENTITY_REQUIRED") {
    // Deliberately does not check wallet binding or freshness — those are
    // reputation-attestation properties this level never claims to have
    // verified. An IDENTITY_REQUIRED lease authorizes based on onchain
    // AgentBound state alone; the receipt and UI must say exactly that.
    if (!identityEstablished(credential)) {
      return { ok: false, policyHash: hash, failureCode: credential.refusalCode ?? "AGENTBOUND_MISSING", checkedAt };
    }
    if (BigInt(requestedAmountAtomic) > BigInt(policy.maxSpendAtomic)) {
      return { ok: false, policyHash: hash, failureCode: "BUDGET_EXCEEDED", checkedAt };
    }
    return { ok: true, policyHash: hash, checkedAt };
  }

  // REPUTATION_REQUIRED: identity plus a fresh, signature-verified,
  // wallet-bound attestation. Unchanged from the original strict flow.
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
