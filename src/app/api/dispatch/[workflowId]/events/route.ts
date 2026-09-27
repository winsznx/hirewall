import { getWorkflow } from "@/server/workflow/orchestrator";

export async function GET(request: Request, { params }: { params: Promise<{ workflowId: string }> }) {
  const { workflowId } = await params;
  if (!await getWorkflow(workflowId)) return new Response("not_found", { status: 404 });

  let after = Number(request.headers.get("last-event-id") ?? new URL(request.url).searchParams.get("after") ?? "0");
  if (!Number.isSafeInteger(after) || after < 0) after = 0;
  const encoder = new TextEncoder();
  let timer: ReturnType<typeof setInterval> | undefined;
  let closed = false;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const emit = async () => {
        if (closed) return;
        try {
          const workflow = await getWorkflow(workflowId);
          if (!workflow) return;
          for (const event of workflow.events) {
            if (event.seq <= after) continue;
            controller.enqueue(encoder.encode(`id: ${event.seq}\nevent: workflow\ndata: ${JSON.stringify(event)}\n\n`));
            after = event.seq;
          }
        } catch (error) {
          controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ message: String(error) })}\n\n`));
        }
      };
      void emit();
      timer = setInterval(() => { void emit(); }, 1000);
      request.signal.addEventListener("abort", () => {
        closed = true;
        if (timer) clearInterval(timer);
        try { controller.close(); } catch { /* request already closed */ }
      }, { once: true });
    },
    cancel() {
      closed = true;
      if (timer) clearInterval(timer);
    },
  });
  return new Response(stream, { headers: { "content-type": "text/event-stream", "cache-control": "no-cache", connection: "keep-alive" } });
}
