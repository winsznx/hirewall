import { getDb } from "./db";
import { neonQuery, isNeonBackend } from "./neon";
import type { ExecutionResult } from "../types";

// executions.leaseId is PRIMARY KEY, so tryClaim() is the atomicity
// primitive that prevents two concurrent execute() calls (same process
// or, once a real multi-instance database backs this, two different
// instances) from both proceeding to the payment transport for the same
// lease. See executor.ts and DECISIONS.md DEC-005.
export const executionRepo = {
  async tryClaim(leaseId: string, claimedAt: string): Promise<boolean> {
    if (isNeonBackend()) {
      const rows = await neonQuery(`INSERT INTO hirewall_executions (lease_id, claimed_at) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING lease_id`, [leaseId, claimedAt]);
      return rows.length === 1;
    }
    try {
      getDb().prepare(`INSERT INTO executions (leaseId, claimedAt, resultJson) VALUES (?, ?, NULL)`).run(leaseId, claimedAt);
      return true;
    } catch {
      return false;
    }
  },

  async recordResult(leaseId: string, result: ExecutionResult): Promise<void> {
    if (isNeonBackend()) {
      await neonQuery(`UPDATE hirewall_executions SET result = $2::jsonb WHERE lease_id = $1`, [leaseId, JSON.stringify(result)]);
      return;
    }
    getDb().prepare(`UPDATE executions SET resultJson = ? WHERE leaseId = ?`).run(JSON.stringify(result), leaseId);
  },

  async getResult(leaseId: string): Promise<ExecutionResult | undefined> {
    if (isNeonBackend()) {
      const [row] = await neonQuery(`SELECT result FROM hirewall_executions WHERE lease_id = $1`, [leaseId]);
      return row?.result as ExecutionResult | undefined;
    }
    const row = getDb().prepare(`SELECT resultJson FROM executions WHERE leaseId = ?`).get(leaseId) as
      | { resultJson: string | null }
      | undefined;
    if (!row || !row.resultJson) return undefined;
    return JSON.parse(row.resultJson) as ExecutionResult;
  },
};
