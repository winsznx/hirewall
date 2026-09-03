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

// Talks to the real HIREWALL backend. Not wired to a live backend yet —
// each method throws until NEXT_PUBLIC_HIREWALL_API_URL is configured and
// the corresponding backend route exists. Fill in fetch calls here without
// touching any component.
export class RemoteHirewallApi implements HirewallApi {
  constructor(private readonly baseUrl: string) {}

  private notImplemented(method: string): never {
    throw new Error(
      `RemoteHirewallApi.${method} is not wired to a backend yet (baseUrl: ${this.baseUrl}).`
    );
  }

  async createDispatch(_input: CreateDispatchInput): Promise<{ workflowId: string }> {
    this.notImplemented("createDispatch");
  }

  async getDispatch(_id: string): Promise<DispatchWorkflow | null> {
    this.notImplemented("getDispatch");
  }

  subscribeToDispatch(_id: string, _onEvent: (event: WorkflowEvent) => void): () => void {
    this.notImplemented("subscribeToDispatch");
  }

  async executeDispatch(_id: string): Promise<DispatchWorkflow> {
    this.notImplemented("executeDispatch");
  }

  async getReceipt(_id: string): Promise<HirewallReceipt | null> {
    this.notImplemented("getReceipt");
  }

  async verifyReceipt(_input: ReceiptInput): Promise<ReceiptVerification> {
    this.notImplemented("verifyReceipt");
  }

  async runProofLab(_input: ProofLabInput): Promise<ProofLabRun> {
    this.notImplemented("runProofLab");
  }

  async getLatestCatalogRun(): Promise<CatalogRun | null> {
    this.notImplemented("getLatestCatalogRun");
  }
}
