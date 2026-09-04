import type { HirewallApi } from "./hirewall-api";
import type {
  CatalogRun,
  CreateDispatchInput,
  DispatchWorkflow,
  HirewallReceipt,
  ProofLabInput,
  ProofLabRun,
  ReceiptInput,
  ReceiptVerification,
  WorkflowEvent,
} from "@/lib/types";

// Talks to HIREWALL's own backend (src/app/api/*, src/server/*). This is
// "live" in the sense that it's a real running backend, not a fixture —
// but the Orion credential integration itself is blocked by GATE-001, so
// every workflow it produces is honestly UNVERIFIABLE/DEPENDENCY_UNAVAILABLE
// until that unblocks. See GATES.md and DECISIONS.md DEC-004.
export class RemoteHirewallApi implements HirewallApi {
  constructor(private readonly baseUrl: string) {}

  private url(path: string): string {
    return `${this.baseUrl}${path}`;
  }

  async createDispatch(input: CreateDispatchInput): Promise<{ workflowId: string }> {
    const res = await fetch(this.url("/api/dispatch"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        task: input.task,
        maxSpend: input.maxBudget,
        chainId: 8453,
        target: input.workerIdentifier,
        allowFallback: input.allowFallback ?? false,
      }),
    });
    if (!res.ok) throw new Error(`createDispatch failed: ${res.status}`);
    const data = await res.json();
    return { workflowId: data.workflowId };
  }

  async getDispatch(id: string): Promise<DispatchWorkflow | null> {
    const res = await fetch(this.url(`/api/dispatch/${id}`));
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`getDispatch failed: ${res.status}`);
    return res.json();
  }

  subscribeToDispatch(id: string, onEvent: (event: WorkflowEvent) => void): () => void {
    // SSE trace streaming (/api/dispatch/:id/events) is not implemented
    // yet — the backend currently returns the full workflow synchronously
    // on create/execute rather than streaming incremental events. Callers
    // should poll getDispatch() in the meantime. This is a real limitation,
    // not a fixture fallback.
    void id;
    void onEvent;
    return () => {};
  }

  async executeDispatch(id: string): Promise<DispatchWorkflow> {
    const res = await fetch(this.url(`/api/dispatch/${id}/execute`), { method: "POST" });
    if (!res.ok) throw new Error(`executeDispatch failed: ${res.status}`);
    return res.json();
  }

  async getReceipt(id: string): Promise<HirewallReceipt | null> {
    const res = await fetch(this.url(`/api/receipts/${id}`));
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`getReceipt failed: ${res.status}`);
    return res.json();
  }

  async verifyReceipt(input: ReceiptInput): Promise<ReceiptVerification> {
    const res = await fetch(this.url("/api/verify-receipt"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error(`verifyReceipt failed: ${res.status}`);
    return res.json();
  }

  async runProofLab(input: ProofLabInput): Promise<ProofLabRun> {
    const res = await fetch(this.url("/api/proof-lab/run"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error(`runProofLab failed: ${res.status}`);
    return res.json();
  }

  async getLatestCatalogRun(): Promise<CatalogRun | null> {
    // No frozen catalog experiment exists yet — that requires a live
    // Orion Store cohort (HIREWALL_PRD.md section 12.12), which is
    // blocked by GATE-001. Honestly return null rather than fabricating
    // or silently reusing frontend fixture data — see BUILD_CONTRACT.md
    // section 6.
    return null;
  }
}
