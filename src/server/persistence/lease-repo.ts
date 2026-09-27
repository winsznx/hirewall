import { getDb } from "./db";
import { neonQuery, isNeonBackend } from "./neon";
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
  async put(lease: AuthorizationLease): Promise<void> {
    if (isNeonBackend()) {
      await neonQuery(`INSERT INTO hirewall_leases (id, payload) VALUES ($1, $2::jsonb)`, [lease.id, JSON.stringify(lease)]);
      return;
    }
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

  async get(id: string): Promise<AuthorizationLease | undefined> {
    if (isNeonBackend()) {
      const [row] = await neonQuery(`SELECT payload FROM hirewall_leases WHERE id = $1`, [id]);
      return row?.payload as AuthorizationLease | undefined;
    }
    const row = getDb().prepare(`SELECT * FROM leases WHERE id = ?`).get(id) as LeaseRow | undefined;
    return row ? rowToLease(row) : undefined;
  },

  async revoke(id: string): Promise<void> {
    if (isNeonBackend()) {
      await neonQuery(`UPDATE hirewall_leases SET payload = jsonb_set(payload, '{revoked}', 'true'::jsonb) WHERE id = $1`, [id]);
      return;
    }
    getDb().prepare(`UPDATE leases SET revoked = 1 WHERE id = ?`).run(id);
  },

  async markConsumed(id: string, consumedAt: string): Promise<void> {
    if (isNeonBackend()) {
      await neonQuery(`UPDATE hirewall_leases SET payload = jsonb_set(payload, '{consumedAt}', to_jsonb($2::text)) WHERE id = $1`, [id, consumedAt]);
      return;
    }
    getDb().prepare(`UPDATE leases SET consumedAt = ? WHERE id = ?`).run(consumedAt, id);
  },

  async isNonceConsumed(nonce: string): Promise<boolean> {
    if (isNeonBackend()) {
      const rows = await neonQuery(`SELECT 1 FROM hirewall_consumed_nonces WHERE nonce = $1`, [nonce]);
      return rows.length > 0;
    }
    const row = getDb().prepare(`SELECT 1 FROM consumed_nonces WHERE nonce = ?`).get(nonce);
    return row !== undefined;
  },

  // Atomic claim: the nonce PRIMARY KEY makes a second concurrent
  // consumeNonce() for the same nonce fail rather than silently succeed
  // twice. Returns false (not thrown) on conflict so callers can map it
  // to REPLAY_REJECTED cleanly.
  async consumeNonce(nonce: string, consumedAt: string): Promise<boolean> {
    if (isNeonBackend()) {
      const rows = await neonQuery(`INSERT INTO hirewall_consumed_nonces (nonce, consumed_at) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING nonce`, [nonce, consumedAt]);
      return rows.length === 1;
    }
    try {
      getDb().prepare(`INSERT INTO consumed_nonces (nonce, consumedAt) VALUES (?, ?)`).run(nonce, consumedAt);
      return true;
    } catch {
      return false;
    }
  },
};
