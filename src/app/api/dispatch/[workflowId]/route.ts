import { NextResponse } from "next/server";
import { getWorkflow } from "@/server/workflow/orchestrator";
import { mapWorkflow } from "@/server/view-mapper";

export async function GET(_request: Request, { params }: { params: Promise<{ workflowId: string }> }) {
  const { workflowId } = await params;
  const workflow = await getWorkflow(workflowId);

  if (!workflow) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json(mapWorkflow(workflow));
}
