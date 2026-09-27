import { randomUUID } from "node:crypto";
import type { RefusalCode } from "../refusal-codes";
import type { AuthorizationLease, DispatchRequest } from "../types";
import { leaseStore } from "./lease-store";

const DEFAULT_LEASE_TTL_MS = 20 * 60 * 1000;
const MAX_LEASE_TTL_MS = 30 * 60 * 1000;

export interface CreateLeaseInput {
  contextId: string;
  candidateId: string;
  targetWallet?: string;
  maxAmountAtomic: string;
  chainId: number;
  credentialResultHash: string;
  policyHash: string;
  credentialExpiresAt?: string;
  now: string;
}

// Creates a bounded, expiring authorization lease. Only called after
// deterministic verification AND deterministic policy evaluation both
// pass — see src/server/workflow/orchestrator.ts. No LLM output reaches
// this function.
export async function createLease(input: CreateLeaseInput): Promise<AuthorizationLease> {
  const issuedAtMs = Date.parse(input.now);
  const credentialExpiryMs = input.credentialExpiresAt ? Date.parse(input.credentialExpiresAt) : undefined;

  const candidateExpiryMs = [
    issuedAtMs + DEFAULT_LEASE_TTL_MS,
    issuedAtMs + MAX_LEASE_TTL_MS,
    ...(credentialExpiryMs !== undefined ? [credentialExpiryMs] : []),
  ];
  const expiresAtMs = Math.min(...candidateExpiryMs);

  const lease: AuthorizationLease = {
    id: `lease_${randomUUID()}`,
    contextId: input.contextId,
    candidateId: input.candidateId,
    targetWallet: input.targetWallet,
    maxAmountAtomic: input.maxAmountAtomic,
    chainId: input.chainId,
    credentialResultHash: input.credentialResultHash,
    policyHash: input.policyHash,
    issuedAt: input.now,
    expiresAt: new Date(expiresAtMs).toISOString(),
    nonce: `nonce_${randomUUID()}`,
    revoked: false,
  };

  await leaseStore.put(lease);
  return lease;
}

export interface LeaseValidationResult {
  ok: boolean;
  failureCode?: RefusalCode;
}

// The single source of truth for "can this exact request execute right
// now." Looks the lease up by ID from the store — never trusts a
// caller-supplied lease payload — and checks every binding in
// BUILD_CONTRACT.md section 3's canDispatch() definition.
export async function validateLease(leaseId: string, request: DispatchRequest, now: string): Promise<LeaseValidationResult> {
  const lease = await leaseStore.get(leaseId);

  if (!lease) return { ok: false, failureCode: "AUTHORIZATION_REVOKED" };
  if (lease.revoked) return { ok: false, failureCode: "AUTHORIZATION_REVOKED" };
  if (lease.consumedAt) return { ok: false, failureCode: "REPLAY_REJECTED" };
  if (await leaseStore.isNonceConsumed(lease.nonce)) return { ok: false, failureCode: "REPLAY_REJECTED" };
  if (Date.parse(lease.expiresAt) <= Date.parse(now)) return { ok: false, failureCode: "AUTHORIZATION_EXPIRED" };
  if (lease.contextId !== request.contextId) return { ok: false, failureCode: "AUTHORIZATION_REVOKED" };
  if (lease.candidateId !== request.candidateId) return { ok: false, failureCode: "WALLET_MISMATCH" };
  if (lease.chainId !== request.chainId) return { ok: false, failureCode: "CHAIN_MISMATCH" };
  if ((lease.targetWallet ?? null) !== (request.targetWallet ?? null)) {
    return { ok: false, failureCode: "WALLET_MISMATCH" };
  }
  if (lease.credentialResultHash !== request.credentialResultHash) {
    return { ok: false, failureCode: "POLICY_REJECTED" };
  }
  if (lease.policyHash !== request.policyHash) return { ok: false, failureCode: "POLICY_REJECTED" };
  if (BigInt(request.amountAtomic) > BigInt(lease.maxAmountAtomic)) {
    return { ok: false, failureCode: "BUDGET_EXCEEDED" };
  }

  return { ok: true };
}

// Returns false if the nonce was already consumed by a concurrent
// caller — the executor's actual atomicity boundary is the executions
// table claim (see executor.ts), but this return value lets any other
// caller detect the same race honestly rather than silently succeeding.
export async function consumeLease(leaseId: string, consumedAt: string): Promise<boolean> {
  const lease = await leaseStore.get(leaseId);
  if (!lease) return false;
  const claimed = await leaseStore.consumeNonce(lease.nonce, consumedAt);
  if (!claimed) return false;
  await leaseStore.markConsumed(leaseId, consumedAt);
  return true;
}

export async function revokeLease(leaseId: string): Promise<void> {
  await leaseStore.revoke(leaseId);
}

export function getLease(leaseId: string): Promise<AuthorizationLease | undefined> {
  return leaseStore.get(leaseId);
}
