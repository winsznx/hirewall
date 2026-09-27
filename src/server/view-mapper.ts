// Maps server-side domain records to the frontend's view-model types
// (src/lib/types.ts). This is the one place that translation happens —
// API routes and remote-api.ts should not duplicate this logic.
import type {
  AuthorizationView,
  CandidateView,
  DispatchWorkflow,
  ExecutionView,
  HirewallReceipt as ClientReceipt,
  PolicyView,
  ReceiptVerification,
  VerificationCheck,
} from "@/lib/types";
import type { HirewallReceipt as ServerReceipt } from "./receipts/receipt-types";
import type { ReceiptVerificationOutcome } from "./receipts/verifier";
import type { BuyerPolicy, NormalizedCredentialResult, ResolvedCandidate, WorkflowRecord } from "./types";

function mapCandidate(candidate?: ResolvedCandidate): CandidateView | undefined {
  if (!candidate) return undefined;
  return {
    id: candidate.id,
    name: candidate.name,
    slug: candidate.slug,
    wallet: candidate.declaredWallet,
    listingUrl: candidate.listingUrl,
    category: candidate.category,
  };
}

function mapPolicy(policy: BuyerPolicy, policyHash?: string): PolicyView {
  return {
    network: "Base",
    maxSpend: formatUsdc(policy.maxSpendAtomic),
    currency: "USDC",
    policyLevel: policy.policyLevel,
    freshAttestationRequired: policy.policyLevel === "REPUTATION_REQUIRED",
    walletMatchRequired: policy.requireWalletMatch,
    freshAtDispatchRequired: policy.requireFreshAtDispatch,
    minimumTier: policy.minimumTier,
    minimumCompositeScore: policy.minimumCompositeScore,
    policyHash,
  };
}

function formatUsdc(atomic: string): string {
  const amount = BigInt(atomic);
  const whole = amount / BigInt(1_000_000);
  const fraction = (amount % BigInt(1_000_000)).toString().padStart(6, "0").replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole.toString();
}

export function mapVerificationChecks(credential?: NormalizedCredentialResult): VerificationCheck[] {
  if (!credential) return [];
  return credential.checks.map((check) => ({
    id: check.id,
    label: check.id.replace(/_/g, " "),
    status: check.status === "PASS" ? "pass" : check.status === "FAIL" ? "fail" : "unavailable",
    code: check.code,
  }));
}

function mapAuthorization(workflow: WorkflowRecord): AuthorizationView | undefined {
  const lease = workflow.authorization;
  if (!lease) return undefined;
  const status = lease.revoked
    ? "REVOKED"
    : lease.consumedAt
      ? "CONSUMED"
      : Date.parse(lease.expiresAt) <= Date.now()
        ? "EXPIRED"
        : "ACTIVE";
  return {
    id: lease.id,
    amount: formatUsdc(lease.maxAmountAtomic),
    currency: "USDC",
    network: "Base",
    issuedAt: lease.issuedAt,
    expiresAt: lease.expiresAt,
    status,
    attestationHash: lease.credentialResultHash,
    policyHash: lease.policyHash,
  };
}

function mapExecution(workflow: WorkflowRecord): ExecutionView | undefined {
  const execution = workflow.execution;
  if (!execution) return undefined;
  return {
    state: execution.state,
    amount: execution.amountAtomic,
    currency: "USDC",
    txId: execution.transactionHash,
    x402RequestId: execution.x402RequestId,
    responseHash: execution.responseHash,
  };
}

export function mapWorkflow(workflow: WorkflowRecord): DispatchWorkflow {
  return {
    id: workflow.id,
    evidenceMode: workflow.evidenceMode,
    state: workflow.state,
    task: workflow.request.task,
    policy: mapPolicy(workflow.policy, workflow.policyResult?.policyHash),
    candidate: mapCandidate(workflow.candidate),
    attemptedCandidates: workflow.attemptedCandidates.map((a) => ({
      candidate: mapCandidate(a.candidate)!,
      decision: a.decision,
      refusalCode: a.refusalCode,
    })),
    verification: mapVerificationChecks(workflow.credentialResult),
    decision: workflow.decision,
    refusalCode: workflow.refusalCode,
    authorization: mapAuthorization(workflow),
    settlement: workflow.execution.state,
    execution: mapExecution(workflow),
    receiptId: workflow.receiptId,
    createdAt: workflow.createdAt,
    updatedAt: workflow.updatedAt,
  };
}

export function mapReceipt(receipt: ServerReceipt): ClientReceipt {
  const limitations = [
    "This receipt proves HIREWALL's own deterministic policy, authorization, and execution logic ran as recorded.",
  ];
  if (receipt.provider.providerId === "orion") {
    limitations.push(
      "Orion credential verification is NOT independently proven by this receipt — the live Orion integration is blocked by GATE-001. See GATES.md."
    );
  }
  if (receipt.evidenceMode !== "live") {
    limitations.push(`This receipt was produced in ${receipt.evidenceMode} mode. It is not live production evidence.`);
  }

  return {
    id: receipt.receiptId,
    evidenceMode: receipt.evidenceMode,
    decision: receipt.decision,
    refusalCode: receipt.refusalCode,
    settlement: receipt.execution.state,
    timestamp: receipt.createdAt,
    request: {
      taskSummary: receipt.request.taskHash ?? "redacted",
      budget: receipt.request.maxSpendAtomic,
      network: "Base",
      contextId: receipt.request.contextId,
    },
    candidate: mapCandidate(receipt.candidate),
    verification: mapVerificationChecks(receipt.verification),
    policy: mapPolicy(
      {
        chainId: receipt.request.chainId,
        maxSpendAtomic: receipt.request.maxSpendAtomic,
        policyLevel: receipt.policy.policyLevel,
        requireWalletMatch: receipt.policy.policyLevel === "REPUTATION_REQUIRED",
        requireFreshAtDispatch: receipt.policy.policyLevel === "REPUTATION_REQUIRED",
      },
      receipt.policy.policyHash
    ),
    authorization: receipt.authorization
      ? {
          id: receipt.authorization.id,
          amount: receipt.authorization.maxAmountAtomic,
          currency: "USDC",
          network: "Base",
          issuedAt: receipt.authorization.issuedAt,
          expiresAt: receipt.authorization.expiresAt,
          status: receipt.authorization.revoked ? "REVOKED" : "ACTIVE",
          attestationHash: receipt.authorization.credentialResultHash,
          policyHash: receipt.authorization.policyHash,
        }
      : undefined,
    execution: {
      state: receipt.execution.state,
      amount: receipt.execution.amountAtomic,
      currency: "USDC",
      txId: receipt.execution.transactionHash,
      x402RequestId: receipt.execution.x402RequestId,
      responseHash: receipt.execution.responseHash,
    },
    limitations,
  };
}

export function mapVerification(receiptId: string, outcome: ReceiptVerificationOutcome): ReceiptVerification {
  return {
    receiptId,
    checks: outcome.checks.map((c) => ({
      id: c.id,
      label: c.label,
      status: c.status === "PASS" ? "pass" : c.status === "FAIL" ? "fail" : "not_claimed",
      detail: c.detail,
    })),
    decision: outcome.decision,
    overallValid: outcome.integrityOk,
  };
}
