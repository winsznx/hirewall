import { workflowRepo } from "../persistence/workflow-repo";
import type { WorkflowRecord } from "../types";

// Durable-backed — see src/server/persistence/workflow-repo.ts (SQLite)
// and DECISIONS.md DEC-005. Workflow state survives a process restart.
class WorkflowStore {
  async put(workflow: WorkflowRecord): Promise<void> {
    await workflowRepo.put(workflow);
  }

  get(id: string): Promise<WorkflowRecord | undefined> {
    return workflowRepo.get(id);
  }
}

export const workflowStore = new WorkflowStore();
