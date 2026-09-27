import { randomUUID } from "node:crypto";
import { createLease } from "../authorization/lease-service";
import { executor } from "../executor/executor";
import { evaluatePolicy } from "../policy/engine";
import type { CredentialProvider } from "../providers/provider";
import { hashObject } from "../policy/hash";
import { buildReceipt, POLICY_VERSION, VERIFIER_VERSION } from "../receipts/receipt-service";
import type { BuyerPolicy, DispatchRequest, ResolvedCandidate, WorkflowRecord } from "../types";
import type { Decision, EvidenceMode, RefusalCode } from "../refusal-codes";
import { workflowStore } from "./store";

export interface CreateWorkflowInput {
  task: string;
  maxSpend: string;
  chainId: number;
  workerIdentifier?: string;
  allowFallback: boolean;
  mode?: "find" | "check";
  category?: string;
}

const SOFTWARE_COMMIT = process.env.HIREWALL_COMMIT ?? "unknown";

function nowIso(): string {
  return new Date().toISOString();
}

// Persists the workflow every time it's called. Every mutation path in
// this file sets its fields immediately before calling pushEvent(), so
// this is the single point that keeps the durable record consistent with
// in-memory state — there is no mutation path that skips it. See
// DECISIONS.md DEC-005.
function pushEvent(workflow: WorkflowRecord, type: string, data: Record<string, unknown>, candidateId?: string): void {
  workflow.events.push({
    seq: workflow.events.length + 1,
    type,
    timestamp: nowIso(),
    candidateId,
    data,
  });
  workflow.updatedAt = nowIso();
  workflowStore.put(workflow);
}

function defaultPolicy(chainId: number, maxSpend: string): BuyerPolicy {
  return {
    chainId,
    maxSpendAtomic: maxSpend,
    requireValidAttestation: true,
    requireWalletMatch: true,
    requireFreshAtDispatch: true,
  };
}

// Drives one candidate through resolve -> verify -> policy -> (lease).
// This is the only place the provider boundary, policy engine, and lease
// service are wired together — components and API routes call this, not
// the individual modules, so the invariant chain can't be bypassed by a
// caller wiring things together differently.
export async function createWorkflow(
  input: CreateWorkflowInput,
  provider: CredentialProvider<never>,
  evidenceMode: EvidenceMode
): Promise<WorkflowRecord> {
  const id = `hw_${randomUUID()}`;
  const contextId = `ctx_${id}`;
  const createdAt = nowIso();

  const workflow: WorkflowRecord = {
    id,
    contextId,
    evidenceMode,
    createdAt,
    updatedAt: createdAt,
    state: "RESOLVING",
    request: {
      task: input.task,
      maxSpendAtomic: input.maxSpend,
      chainId: input.chainId,
      workerIdentifier: input.workerIdentifier,
      allowFallback: input.allowFallback,
    },
    attemptedCandidates: [],
    policy: defaultPolicy(input.chainId, input.maxSpend),
    execution: { state: "NOT_ATTEMPTED" },
    events: [],
  };

  workflowStore.put(workflow);
  pushEvent(workflow, "workflow.created", { task: input.task });

  let candidateInputs: string[];
  if (input.workerIdentifier) {
    candidateInputs = [input.workerIdentifier];
  } else if (input.mode === "find" && provider.matchCandidates) {
    try {
      const matches = await provider.matchCandidates(input.task, input.category);
      candidateInputs = matches.map((candidate) => candidate.slug ?? candidate.id);
      pushEvent(workflow, "candidates.matched", { count: candidateInputs.length, category: input.category });
    } catch (error) {
      finalizeUnverifiable(workflow, "DEPENDENCY_UNAVAILABLE", describeProviderError(error));
      return workflow;
    }
  } else {
    candidateInputs = [];
  }

  if (candidateInputs.length === 0) {
    finalizeUnverifiable(workflow, "DEPENDENCY_UNAVAILABLE", "No matching Orion candidate was available.");
    return workflow;
  }
  const toTry = input.allowFallback && input.mode === "find" ? candidateInputs.slice(0, 5) : candidateInputs.slice(0, 1);
  for (let index = 0; index < toTry.length; index++) {
    const authorized = await runCandidate(workflow, provider, toTry[index], index < toTry.length - 1);
    if (authorized) break;
  }

  return workflow;
}

async function runCandidate(
  workflow: WorkflowRecord,
  provider: CredentialProvider<never>,
  candidateInput: string,
  deferFailure = false
): Promise<boolean> {
  let candidate: ResolvedCandidate;

  try {
    candidate = await provider.resolveCandidate({ slug: candidateInput } as never);
  } catch (err) {
    if (deferFailure) {
      pushEvent(workflow, "candidate.unavailable", { input: candidateInput, detail: describeProviderError(err) });
    } else finalizeUnverifiable(workflow, "DEPENDENCY_UNAVAILABLE", describeProviderError(err));
    return false;
  }

  workflow.candidate = candidate;
  workflow.state = "VERIFYING";
  pushEvent(workflow, "candidate.resolved", { candidate }, candidate.id);

  const context = { contextId: workflow.contextId, chainId: workflow.request.chainId, requestedAt: nowIso() };
  workflow.policyResult = undefined;

  try {
    const credential = await provider.verifyCandidate(candidate, context);
    workflow.credentialResult = credential;
    pushEvent(workflow, "verification.result", { status: credential.status }, candidate.id);

    if (credential.status === "UNVERIFIABLE") {
      const code = credential.refusalCode ?? "DEPENDENCY_UNAVAILABLE";
      workflow.attemptedCandidates.push({ candidate, decision: "UNVERIFIABLE", refusalCode: code });
      if (deferFailure) pushEvent(workflow, "candidate.unverifiable", { code }, candidate.id);
      else finalizeUnverifiable(workflow, code, "provider returned UNVERIFIABLE");
      return false;
    }

    workflow.state = "POLICY_EVALUATING";
    const policyResult = evaluatePolicy(workflow.policy, credential, workflow.request.maxSpendAtomic, nowIso());
    workflow.policyResult = policyResult;
    pushEvent(workflow, "policy.evaluated", { ok: policyResult.ok, failureCode: policyResult.failureCode }, candidate.id);

    if (!policyResult.ok) {
      const code = policyResult.failureCode ?? "POLICY_REJECTED";
      if (deferFailure) {
        workflow.attemptedCandidates.push({ candidate, decision: "REFUSE", refusalCode: code });
        pushEvent(workflow, "candidate.refused", { code }, candidate.id);
      } else finalizeRefuse(workflow, code, candidate);
      return false;
    }

    const credentialResultHash = hashObject(credential);
    const lease = createLease({
      contextId: workflow.contextId,
      candidateId: candidate.id,
      targetWallet: candidate.declaredWallet,
      maxAmountAtomic: workflow.request.maxSpendAtomic,
      chainId: workflow.request.chainId,
      credentialResultHash,
      policyHash: policyResult.policyHash,
      credentialExpiresAt: credential.expiresAt,
      now: nowIso(),
    });

    workflow.authorization = lease;
    workflow.decision = "AUTHORIZE";
    workflow.state = "AUTHORIZED";
    pushEvent(workflow, "authorization.created", { leaseId: lease.id, expiresAt: lease.expiresAt }, candidate.id);

    emitReceipt(workflow);
    return true;
  } catch (err) {
    if (deferFailure) {
      workflow.attemptedCandidates.push({ candidate, decision: "UNVERIFIABLE", refusalCode: "DEPENDENCY_UNAVAILABLE" });
      pushEvent(workflow, "candidate.unavailable", { detail: describeProviderError(err) }, candidate.id);
    } else finalizeUnverifiable(workflow, "DEPENDENCY_UNAVAILABLE", describeProviderError(err));
    return false;
  }
}

function finalizeRefuse(workflow: WorkflowRecord, code: RefusalCode, candidate: ResolvedCandidate): void {
  workflow.decision = "REFUSE";
  workflow.refusalCode = code;
  workflow.state = "REFUSED";
  workflow.attemptedCandidates.push({ candidate, decision: "REFUSE", refusalCode: code });
  pushEvent(workflow, "workflow.refused", { code }, candidate.id);
  emitReceipt(workflow);
}

function finalizeUnverifiable(workflow: WorkflowRecord, code: RefusalCode, detail: string): void {
  workflow.decision = "UNVERIFIABLE";
  workflow.refusalCode = code;
  workflow.state = "UNVERIFIABLE";
  pushEvent(workflow, "workflow.unverifiable", { code, detail });
  emitReceipt(workflow);
}

function describeProviderError(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

function emitReceipt(workflow: WorkflowRecord): void {
  const decision: Decision = workflow.decision ?? "UNVERIFIABLE";
  const receipt = buildReceipt({
    evidenceMode: workflow.evidenceMode,
    request: {
      contextId: workflow.contextId,
      taskHash: hashObject(workflow.request.task),
      maxSpendAtomic: workflow.request.maxSpendAtomic,
      chainId: workflow.request.chainId,
    },
    candidate: workflow.candidate ?? {
      id: "unresolved",
      source: workflow.evidenceMode === "fixture" ? "fixture" : "other_supported_orion_surface",
    },
    provider: {
      providerId: workflow.evidenceMode === "fixture" ? "fixture" : "orion",
      rawArtifactHash: workflow.credentialResult?.rawArtifactHash,
    },
    verification: workflow.credentialResult ?? {
      providerId: workflow.evidenceMode === "fixture" ? "fixture" : "orion",
      status: "UNVERIFIABLE",
      checkedAt: nowIso(),
      subject: { id: workflow.candidate?.id ?? "unresolved" },
      checks: [],
      refusalCode: workflow.refusalCode,
    },
    policy: {
      policyHash: workflow.policyResult?.policyHash ?? hashObject(workflow.policy),
      result: workflow.policyResult ? (workflow.policyResult.ok ? "PASS" : "FAIL") : "NOT_EVALUATED",
      failureCode: workflow.policyResult?.failureCode,
    },
    authorization: workflow.authorization,
    decision,
    refusalCode: workflow.refusalCode,
    execution: workflow.execution,
    software: {
      commit: SOFTWARE_COMMIT,
      verifierVersion: VERIFIER_VERSION,
      policyVersion: POLICY_VERSION,
    },
  });

  workflow.receiptId = receipt.receiptId;
  workflow.state = "RECEIPT_READY";
  pushEvent(workflow, "receipt.created", { receiptId: receipt.receiptId });
}

export async function executeWorkflow(workflow: WorkflowRecord): Promise<WorkflowRecord> {
  if (!workflow.authorization) {
    workflow.execution = { state: "NOT_ATTEMPTED", errorCode: "AUTHORIZATION_REVOKED" };
    return workflow;
  }

  const request: DispatchRequest = {
    contextId: workflow.contextId,
    candidateId: workflow.authorization.candidateId,
    targetWallet: workflow.authorization.targetWallet,
    amountAtomic: workflow.request.maxSpendAtomic,
    chainId: workflow.request.chainId,
    credentialResultHash: workflow.authorization.credentialResultHash,
    policyHash: workflow.authorization.policyHash,
  };

  workflow.state = "EXECUTING";
  pushEvent(workflow, "execution.requested", { leaseId: workflow.authorization.id });

  const result = await executor.dispatch(request, workflow.authorization.id, nowIso());
  workflow.execution = result;
  workflow.state = result.state === "SUCCEEDED" ? "SETTLED" : "EXECUTION_FAILED";
  pushEvent(workflow, "execution.result", { state: result.state, errorCode: result.errorCode });

  emitReceipt(workflow);
  return workflow;
}

export function getWorkflow(id: string): WorkflowRecord | undefined {
  return workflowStore.get(id);
}
