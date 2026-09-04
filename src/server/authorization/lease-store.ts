import type { AuthorizationLease } from "../types";

// Source of truth for lease state. The executor must look leases up here
// by ID rather than trusting a caller-supplied lease object — this is
// what makes the no-bypass invariant enforceable rather than advisory.
// In-memory for now; swap for real persistence without changing callers.
class LeaseStore {
  private readonly leases = new Map<string, AuthorizationLease>();
  private readonly consumedNonces = new Set<string>();

  put(lease: AuthorizationLease): void {
    this.leases.set(lease.id, lease);
  }

  get(id: string): AuthorizationLease | undefined {
    return this.leases.get(id);
  }

  revoke(id: string): void {
    const lease = this.leases.get(id);
    if (lease) lease.revoked = true;
  }

  isNonceConsumed(nonce: string): boolean {
    return this.consumedNonces.has(nonce);
  }

  consumeNonce(nonce: string): void {
    this.consumedNonces.add(nonce);
  }

  markConsumed(id: string, consumedAt: string): void {
    const lease = this.leases.get(id);
    if (lease) lease.consumedAt = consumedAt;
  }
}

export const leaseStore = new LeaseStore();
