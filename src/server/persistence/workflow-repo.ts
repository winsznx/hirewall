import { getDb } from "./db";
import type { WorkflowRecord } from "../types";

// Stored as a JSON blob keyed by id rather than normalized columns. The
// workflow record's shape is still evolving (see ARCHITECTURE.md known
// gaps) and every field is already recomputed from the lease/receipt/
// execution repos when it matters for an invariant — this table is the
// durable "what happened and when" record, not itself the source of
// truth for a security check.
interface WorkflowRow {
  id: string;
  json: string;
  updatedAt: string;
}

export const workflowRepo = {
  put(workflow: WorkflowRecord): void {
    getDb()
      .prepare(
        `INSERT INTO workflows (id, json, updatedAt) VALUES (?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET json = excluded.json, updatedAt = excluded.updatedAt`
      )
      .run(workflow.id, JSON.stringify(workflow), workflow.updatedAt);
  },

  get(id: string): WorkflowRecord | undefined {
    const row = getDb().prepare(`SELECT * FROM workflows WHERE id = ?`).get(id) as WorkflowRow | undefined;
    return row ? (JSON.parse(row.json) as WorkflowRecord) : undefined;
  },
};
