import { NextResponse } from "next/server";
import { selectProvider } from "@/server/providers";
import { createWorkflow } from "@/server/workflow/orchestrator";
import { mapWorkflow } from "@/server/view-mapper";

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); }
  if (!body || typeof body !== "object") return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  const input = body as Record<string, unknown>;
  const task = typeof input.task === "string" ? input.task.trim() : "";
  const target = input.target ?? input.workerIdentifier;
  const mode = input.mode ?? (target ? "check" : "find");
  if (!task || task.length > 2000 || typeof input.maxSpend !== "string" || input.maxSpend.length > 32 || !/^\d+$/.test(input.maxSpend) ||
      BigInt(input.maxSpend) === BigInt(0) || input.chainId !== 8453 ||
      (mode !== "find" && mode !== "check") || (mode === "check" && (typeof target !== "string" || !target.trim())) ||
      (target !== undefined && (typeof target !== "string" || target.length > 200)) ||
      (input.category !== undefined && (typeof input.category !== "string" || input.category.length > 100)) ||
      (input.allowFallback !== undefined && typeof input.allowFallback !== "boolean")) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const { provider, evidenceMode } = selectProvider();

  const workflow = await createWorkflow(
    {
      task,
      maxSpend: input.maxSpend,
      chainId: 8453,
      workerIdentifier: typeof target === "string" ? target.trim() : undefined,
      allowFallback: input.allowFallback === true,
      mode,
      category: typeof input.category === "string" ? input.category : undefined,
    },
    provider,
    evidenceMode
  );

  return NextResponse.json({ workflowId: workflow.id, status: workflow.state, workflow: mapWorkflow(workflow) });
}
