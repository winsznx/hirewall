import type { WorkflowRecord } from "../types";

// In-memory workflow persistence. Matches the `workflows` table shape
// from HIREWALL_PRD.md section 15 closely enough to swap in a real store
// later without changing orchestrator.ts's calls.
class WorkflowStore {
  private readonly workflows = new Map<string, WorkflowRecord>();

  put(workflow: WorkflowRecord): void {
    this.workflows.set(workflow.id, workflow);
  }

  get(id: string): WorkflowRecord | undefined {
    return this.workflows.get(id);
  }
}

export const workflowStore = new WorkflowStore();
