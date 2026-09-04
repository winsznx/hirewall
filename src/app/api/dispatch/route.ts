import { NextResponse } from "next/server";
import { selectProvider } from "@/server/providers";
import { createWorkflow } from "@/server/workflow/orchestrator";
import { mapWorkflow } from "@/server/view-mapper";

export async function POST(request: Request) {
  const body = await request.json();

  const { provider, evidenceMode } = selectProvider();

  const workflow = await createWorkflow(
    {
      task: body.task ?? "",
      maxSpend: body.maxSpend ?? "0",
      chainId: body.chainId ?? 8453,
      workerIdentifier: body.target ?? body.workerIdentifier,
      allowFallback: body.allowFallback ?? false,
    },
    provider,
    evidenceMode
  );

  return NextResponse.json({ workflowId: workflow.id, status: workflow.state, workflow: mapWorkflow(workflow) });
}
