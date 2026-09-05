import { getDb } from "./db";
import type { ExecutionResult } from "../types";

// executions.leaseId is PRIMARY KEY, so tryClaim() is the atomicity
// primitive that prevents two concurrent execute() calls (same process
// or, once a real multi-instance database backs this, two different
// instances) from both proceeding to the payment transport for the same
// lease. See executor.ts and DECISIONS.md DEC-005.
export const executionRepo = {
  tryClaim(leaseId: string, claimedAt: string): boolean {
    try {
      getDb().prepare(`INSERT INTO executions (leaseId, claimedAt, resultJson) VALUES (?, ?, NULL)`).run(leaseId, claimedAt);
      return true;
    } catch {
      return false;
    }
  },

  recordResult(leaseId: string, result: ExecutionResult): void {
    getDb().prepare(`UPDATE executions SET resultJson = ? WHERE leaseId = ?`).run(JSON.stringify(result), leaseId);
  },

  getResult(leaseId: string): ExecutionResult | undefined {
    const row = getDb().prepare(`SELECT resultJson FROM executions WHERE leaseId = ?`).get(leaseId) as
      | { resultJson: string | null }
      | undefined;
    if (!row || !row.resultJson) return undefined;
    return JSON.parse(row.resultJson) as ExecutionResult;
  },
};
