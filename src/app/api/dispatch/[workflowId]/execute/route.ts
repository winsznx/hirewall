import { NextResponse } from "next/server";
import { executeWorkflow, getWorkflow } from "@/server/workflow/orchestrator";
import { mapWorkflow } from "@/server/view-mapper";

// Only succeeds against a workflow that already has a valid lease. The
// executor revalidates the lease itself at execution time — see
// src/server/executor/executor.ts. This route never bypasses that.
export async function POST(_request: Request, { params }: { params: Promise<{ workflowId: string }> }) {
  const { workflowId } = await params;
  const workflow = getWorkflow(workflowId);

  if (!workflow) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const updated = await executeWorkflow(workflow);
  return NextResponse.json(mapWorkflow(updated));
}
