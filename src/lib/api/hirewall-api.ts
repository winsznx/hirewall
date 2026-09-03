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

// Typed adapter boundary. Components must depend on this interface only —
// never on FixtureHirewallApi or RemoteHirewallApi directly.
// See HIREWALL_FRONTEND_HANDOFF.md section 26.
export interface HirewallApi {
  createDispatch(input: CreateDispatchInput): Promise<{ workflowId: string }>;
  getDispatch(id: string): Promise<DispatchWorkflow | null>;
  subscribeToDispatch(
    id: string,
    onEvent: (event: WorkflowEvent) => void
  ): () => void;
  executeDispatch(id: string): Promise<DispatchWorkflow>;
  getReceipt(id: string): Promise<HirewallReceipt | null>;
  verifyReceipt(input: ReceiptInput): Promise<ReceiptVerification>;
  runProofLab(input: ProofLabInput): Promise<ProofLabRun>;
  getLatestCatalogRun(): Promise<CatalogRun | null>;
}
