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
    const base = this.baseUrl.replace(/\/$/, "");
    if (base) return `${base}${path}`;
    if (typeof window !== "undefined") return path;
    // Server-side self-fetch (e.g. a Server Component rendering a
    // workflow page). VERCEL_URL is the per-deployment hash URL
    // (hirewall-<hash>-<team>.vercel.app), which Vercel's Deployment
    // Protection gates behind an SSO redirect even in production —
    // fetching it here would get an HTML login page back instead of
    // JSON. VERCEL_PROJECT_PRODUCTION_URL is the stable, unprotected
    // production domain (hirewall.vercel.app) and must be preferred.
    const host = process.env.VERCEL_ENV === "production" ? process.env.VERCEL_PROJECT_PRODUCTION_URL : process.env.VERCEL_URL;
    return host ? `https://${host}${path}` : `http://localhost:${process.env.PORT ?? "3000"}${path}`;
  }

  async createDispatch(input: CreateDispatchInput): Promise<{ workflowId: string }> {
    if (!/^\d+(?:\.\d{1,6})?$/.test(input.maxBudget)) {
      throw new Error("Max budget must be a non-negative USDC amount with at most six decimal places.");
    }
    const [whole, fraction = ""] = input.maxBudget.split(".");
    const maxSpendAtomic = (BigInt(whole) * BigInt(1_000_000) + BigInt(fraction.padEnd(6, "0"))).toString();
    const res = await fetch(this.url("/api/dispatch"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        task: input.task,
        maxSpend: maxSpendAtomic,
        chainId: 8453,
        target: input.workerIdentifier,
        mode: input.mode,
        category: input.category,
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
    const source = new EventSource(this.url(`/api/dispatch/${encodeURIComponent(id)}/events`));
    source.addEventListener("workflow", (message) => {
      try { onEvent(JSON.parse((message as MessageEvent).data) as WorkflowEvent); } catch { source.close(); }
    });
    return () => source.close();
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
    const response = await fetch(this.url("/api/catalog/latest"), { cache: "no-store" });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`getLatestCatalogRun failed: ${response.status}`);
    return response.json();
  }
}
