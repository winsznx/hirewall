import { getDb } from "./db";
import type { AuthorizationLease } from "../types";

interface LeaseRow {
  id: string;
  contextId: string;
  candidateId: string;
  targetWallet: string | null;
  maxAmountAtomic: string;
  chainId: number;
  credentialResultHash: string;
  policyHash: string;
  issuedAt: string;
  expiresAt: string;
  nonce: string;
  revoked: number;
  consumedAt: string | null;
}

function rowToLease(row: LeaseRow): AuthorizationLease {
  return {
    id: row.id,
    contextId: row.contextId,
    candidateId: row.candidateId,
    targetWallet: row.targetWallet ?? undefined,
    maxAmountAtomic: row.maxAmountAtomic,
    chainId: row.chainId,
    credentialResultHash: row.credentialResultHash,
    policyHash: row.policyHash,
    issuedAt: row.issuedAt,
    expiresAt: row.expiresAt,
    nonce: row.nonce,
    revoked: row.revoked === 1,
    consumedAt: row.consumedAt ?? undefined,
  };
}

export const leaseRepo = {
  put(lease: AuthorizationLease): void {
    getDb()
      .prepare(
        `INSERT INTO leases (id, contextId, candidateId, targetWallet, maxAmountAtomic, chainId, credentialResultHash, policyHash, issuedAt, expiresAt, nonce, revoked, consumedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        lease.id,
        lease.contextId,
        lease.candidateId,
        lease.targetWallet ?? null,
        lease.maxAmountAtomic,
        lease.chainId,
        lease.credentialResultHash,
        lease.policyHash,
        lease.issuedAt,
        lease.expiresAt,
        lease.nonce,
        lease.revoked ? 1 : 0,
        lease.consumedAt ?? null
      );
  },

  get(id: string): AuthorizationLease | undefined {
    const row = getDb().prepare(`SELECT * FROM leases WHERE id = ?`).get(id) as LeaseRow | undefined;
    return row ? rowToLease(row) : undefined;
  },

  revoke(id: string): void {
    getDb().prepare(`UPDATE leases SET revoked = 1 WHERE id = ?`).run(id);
  },

  markConsumed(id: string, consumedAt: string): void {
    getDb().prepare(`UPDATE leases SET consumedAt = ? WHERE id = ?`).run(consumedAt, id);
  },

  isNonceConsumed(nonce: string): boolean {
    const row = getDb().prepare(`SELECT 1 FROM consumed_nonces WHERE nonce = ?`).get(nonce);
    return row !== undefined;
  },

  // Atomic claim: the nonce PRIMARY KEY makes a second concurrent
  // consumeNonce() for the same nonce fail rather than silently succeed
  // twice. Returns false (not thrown) on conflict so callers can map it
  // to REPLAY_REJECTED cleanly.
  consumeNonce(nonce: string, consumedAt: string): boolean {
    try {
      getDb().prepare(`INSERT INTO consumed_nonces (nonce, consumedAt) VALUES (?, ?)`).run(nonce, consumedAt);
      return true;
    } catch {
      return false;
    }
  },
};
