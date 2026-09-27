import { leaseRepo } from "../persistence/lease-repo";
import type { AuthorizationLease } from "../types";

// Durable-backed. This module used to hold an in-memory Map; it now
// delegates to src/server/persistence/lease-repo.ts (SQLite) so lease,
// revocation, and nonce-consumption state survive a process restart.
// See DECISIONS.md DEC-005.
class LeaseStore {
  async put(lease: AuthorizationLease): Promise<void> {
    await leaseRepo.put(lease);
  }

  get(id: string): Promise<AuthorizationLease | undefined> {
    return leaseRepo.get(id);
  }

  async revoke(id: string): Promise<void> {
    await leaseRepo.revoke(id);
  }

  isNonceConsumed(nonce: string): Promise<boolean> {
    return leaseRepo.isNonceConsumed(nonce);
  }

  // Returns whether this call was the one that consumed the nonce.
  // false means someone already consumed it — callers must treat that as
  // a replay rather than proceeding.
  consumeNonce(nonce: string, consumedAt: string): Promise<boolean> {
    return leaseRepo.consumeNonce(nonce, consumedAt);
  }

  async markConsumed(id: string, consumedAt: string): Promise<void> {
    await leaseRepo.markConsumed(id, consumedAt);
  }
}

export const leaseStore = new LeaseStore();
