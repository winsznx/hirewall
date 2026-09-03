import type { HirewallApi } from "./hirewall-api";
import {
  FIXTURE_CATALOG_RUN,
  FIXTURE_FAULT_INJECTIONS,
  FIXTURE_RECEIPTS,
  FIXTURE_WORKFLOWS,
  PROOF_LAB_SCENARIOS,
} from "./fixture-data";
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

// Development-only adapter backed by static fixtures. Every value returned
// carries evidenceMode "fixture" or "fault_injection" — never "live".
export class FixtureHirewallApi implements HirewallApi {
  async createDispatch(input: CreateDispatchInput): Promise<{ workflowId: string }> {
    const fallbackId = input.mode === "check" ? "valid_authorized" : "fallback_first_refused_second_authorized";
    return { workflowId: fallbackId };
  }

  async getDispatch(id: string): Promise<DispatchWorkflow | null> {
    return FIXTURE_WORKFLOWS[id] ?? FIXTURE_FAULT_INJECTIONS[id] ?? null;
  }

  subscribeToDispatch(_id: string, _onEvent: (event: WorkflowEvent) => void): () => void {
    // Fixtures are static snapshots; there is no live event stream to replay.
    return () => {};
  }

  async executeDispatch(id: string): Promise<DispatchWorkflow> {
    const workflow = FIXTURE_WORKFLOWS[id] ?? FIXTURE_FAULT_INJECTIONS[id];
    if (!workflow) throw new Error(`Unknown fixture workflow: ${id}`);
    return workflow;
  }

  async getReceipt(id: string): Promise<HirewallReceipt | null> {
    return FIXTURE_RECEIPTS[id] ?? null;
  }

  async verifyReceipt(input: ReceiptInput): Promise<ReceiptVerification> {
    const receipt = input.receiptId
      ? FIXTURE_RECEIPTS[input.receiptId]
      : input.receiptJson
        ? (JSON.parse(input.receiptJson) as HirewallReceipt)
        : null;

    if (!receipt) {
      return {
        receiptId: input.receiptId ?? "unknown",
        checks: [{ id: "receipt_schema", label: "Receipt schema", status: "fail", detail: "Receipt not found." }],
        decision: "UNVERIFIABLE",
        overallValid: false,
      };
    }

    const settlementClaimed = receipt.settlement !== "NOT_ATTEMPTED";

    return {
      receiptId: receipt.id,
      checks: [
        { id: "receipt_schema", label: "Receipt schema", status: "pass" },
        { id: "receipt_hash", label: "Receipt hash", status: "pass" },
        { id: "attestation_artifact", label: "Attestation artifact", status: receipt.credential ? "pass" : "not_claimed" },
        { id: "signature", label: "Signature", status: receipt.credential ? "pass" : "not_claimed" },
        { id: "expected_signer", label: "Expected signer", status: receipt.credential ? "pass" : "not_claimed" },
        { id: "wallet_binding", label: "Wallet binding", status: receipt.candidate ? "pass" : "not_claimed" },
        { id: "fresh_at_dispatch", label: "Fresh at dispatch", status: receipt.credential ? "pass" : "not_claimed" },
        { id: "policy_recomputation", label: "Policy recomputation", status: "pass" },
        { id: "authorization", label: "Authorization", status: receipt.authorization ? "pass" : "not_claimed" },
        {
          id: "settlement_evidence",
          label: "Settlement evidence",
          status: settlementClaimed ? "pass" : "not_claimed",
          detail: settlementClaimed
            ? undefined
            : "No payment was attempted for this workflow, so there is no settlement evidence to verify.",
        },
      ],
      decision: receipt.decision,
      refusalCode: receipt.refusalCode,
      overallValid: true,
    };
  }

  async runProofLab(input: ProofLabInput): Promise<ProofLabRun> {
    const scenario = PROOF_LAB_SCENARIOS.find((s) => s.id === input.scenarioId) ?? PROOF_LAB_SCENARIOS[0];

    if (scenario.id === "valid") {
      const source = FIXTURE_WORKFLOWS[input.sourceFixtureId] ?? FIXTURE_WORKFLOWS.valid_authorized;
      return {
        id: `lab_${scenario.id}`,
        scenario,
        mutation: {
          description: "No mutation applied.",
          expected: "Verification passes and authorization is created.",
          observed: "AUTHORIZE",
        },
        verification: source.verification,
        decision: "AUTHORIZE",
        receiptId: source.receiptId ?? "rcpt_valid_authorized",
      };
    }

    const mutationMap: Record<string, { workflowId: string; description: string; expected: string; observed: string }> = {
      tamper_payload: {
        workflowId: "fault_injection_tamper",
        description: "Changed: one byte in signed payload",
        expected: "Signature verification fails",
        observed: "SIGNATURE_INVALID",
      },
      expire_credential: {
        workflowId: "fault_injection_expiry",
        description: "Changed: attestation expiry rewritten to a past timestamp",
        expected: "Freshness check fails",
        observed: "ATTESTATION_EXPIRED",
      },
      swap_wallet: {
        workflowId: "wallet_mismatch",
        description: "Changed: bound wallet replaced with a different address",
        expected: "Wallet binding check fails",
        observed: "WALLET_MISMATCH",
      },
      exceed_budget: {
        workflowId: "budget_exceeded",
        description: "Changed: quoted price raised above buyer maximum spend",
        expected: "Buyer policy check fails",
        observed: "BUDGET_EXCEEDED",
      },
      malformed_attestation: {
        workflowId: "attestation_missing",
        description: "Changed: attestation payload replaced with invalid bytes",
        expected: "Payload fails to parse",
        observed: "ATTESTATION_MISSING",
      },
      replay_authorization: {
        workflowId: "authorization_expired",
        description: "Changed: a previously consumed authorization ID resubmitted",
        expected: "Authorization replay is rejected",
        observed: "AUTHORIZATION_EXPIRED",
      },
    };

    const m = mutationMap[scenario.id] ?? mutationMap.tamper_payload;
    const source = FIXTURE_WORKFLOWS[m.workflowId] ?? FIXTURE_FAULT_INJECTIONS[m.workflowId];

    return {
      id: `lab_${scenario.id}`,
      scenario,
      mutation: { description: m.description, expected: m.expected, observed: m.observed },
      verification: source.verification,
      decision: source.decision ?? "REFUSE",
      refusalCode: source.refusalCode,
      receiptId: source.receiptId ?? "rcpt_fault_injection_tamper",
    };
  }

  async getLatestCatalogRun(): Promise<CatalogRun | null> {
    return FIXTURE_CATALOG_RUN;
  }
}
