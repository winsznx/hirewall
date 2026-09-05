import { workflowRepo } from "../persistence/workflow-repo";
import type { WorkflowRecord } from "../types";

// Durable-backed — see src/server/persistence/workflow-repo.ts (SQLite)
// and DECISIONS.md DEC-005. Workflow state survives a process restart.
class WorkflowStore {
  put(workflow: WorkflowRecord): void {
    workflowRepo.put(workflow);
  }

  get(id: string): WorkflowRecord | undefined {
    return workflowRepo.get(id);
  }
}

export const workflowStore = new WorkflowStore();
