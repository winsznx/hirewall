import { getDb } from "./db";
import { neonQuery, isNeonBackend } from "./neon";
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
  async put(workflow: WorkflowRecord): Promise<void> {
    if (isNeonBackend()) {
      await neonQuery(`INSERT INTO hirewall_workflows (id, payload, updated_at) VALUES ($1, $2::jsonb, $3)
        ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload, updated_at = EXCLUDED.updated_at`,
        [workflow.id, JSON.stringify(workflow), workflow.updatedAt]);
      return;
    }
    getDb()
      .prepare(
        `INSERT INTO workflows (id, json, updatedAt) VALUES (?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET json = excluded.json, updatedAt = excluded.updatedAt`
      )
      .run(workflow.id, JSON.stringify(workflow), workflow.updatedAt);
  },

  async get(id: string): Promise<WorkflowRecord | undefined> {
    if (isNeonBackend()) {
      const [row] = await neonQuery(`SELECT payload FROM hirewall_workflows WHERE id = $1`, [id]);
      return row?.payload as WorkflowRecord | undefined;
    }
    const row = getDb().prepare(`SELECT * FROM workflows WHERE id = ?`).get(id) as WorkflowRow | undefined;
    return row ? (JSON.parse(row.json) as WorkflowRecord) : undefined;
  },
};
