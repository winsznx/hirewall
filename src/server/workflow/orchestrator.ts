import { randomUUID } from "node:crypto";
import { createLease, getLease } from "../authorization/lease-service";
import { executor } from "../executor/executor";
import { evaluatePolicy } from "../policy/engine";
import type { CredentialProvider } from "../providers/provider";
import { hashObject } from "../policy/hash";
import { buildReceipt, POLICY_VERSION, VERIFIER_VERSION } from "../receipts/receipt-service";
import type { BuyerPolicy, DispatchRequest, PolicyLevel, ResolvedCandidate, WorkflowRecord } from "../types";
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
  policyLevel?: PolicyLevel;
}

const SOFTWARE_COMMIT = process.env.HIREWALL_COMMIT ?? process.env.VERCEL_GIT_COMMIT_SHA ?? "unknown";

function nowIso(): string {
  return new Date().toISOString();
}

// Persists the workflow every time it's called. Every mutation path in
// this file sets its fields immediately before calling pushEvent(), so
// this is the single point that keeps the durable record consistent with
// in-memory state — there is no mutation path that skips it. See
// DECISIONS.md DEC-005.
async function pushEvent(workflow: WorkflowRecord, type: string, data: Record<string, unknown>, candidateId?: string): Promise<void> {
  workflow.events.push({
    seq: workflow.events.length + 1,
    type,
    timestamp: nowIso(),
    candidateId,
    data,
  });
  workflow.updatedAt = nowIso();
  await workflowStore.put(workflow);
}

function defaultPolicy(chainId: number, maxSpend: string, policyLevel: PolicyLevel): BuyerPolicy {
  // requireWalletMatch/requireFreshAtDispatch only mean anything under
  // REPUTATION_REQUIRED — IDENTITY_REQUIRED never claims to have checked
  // either, since both are properties of the signed attestation it
  // doesn't require. See policy/engine.ts and DECISIONS.md DEC-006.
  const reputation = policyLevel === "REPUTATION_REQUIRED";
  return {
    chainId,
    maxSpendAtomic: maxSpend,
    policyLevel,
    requireWalletMatch: reputation,
    requireFreshAtDispatch: reputation,
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
    policy: defaultPolicy(input.chainId, input.maxSpend, input.policyLevel ?? "REPUTATION_REQUIRED"),
    execution: { state: "NOT_ATTEMPTED" },
    events: [],
  };

  await workflowStore.put(workflow);
  await pushEvent(workflow, "workflow.created", { task: input.task });

  let candidateInputs: string[];
  if (input.workerIdentifier) {
    candidateInputs = [input.workerIdentifier];
  } else if (input.mode === "find" && provider.matchCandidates) {
    try {
      const matches = await provider.matchCandidates(input.task, input.category);
      candidateInputs = matches.map((candidate) => candidate.slug ?? candidate.id);
      await pushEvent(workflow, "candidates.matched", { count: candidateInputs.length, category: input.category });
    } catch (error) {
      await finalizeUnverifiable(workflow, "DEPENDENCY_UNAVAILABLE", describeProviderError(error));
      return workflow;
    }
  } else {
    candidateInputs = [];
  }

  if (candidateInputs.length === 0) {
    await finalizeUnverifiable(workflow, "DEPENDENCY_UNAVAILABLE", "No matching Orion candidate was available.");
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
      await pushEvent(workflow, "candidate.unavailable", { input: candidateInput, detail: describeProviderError(err) });
    } else await finalizeUnverifiable(workflow, "DEPENDENCY_UNAVAILABLE", describeProviderError(err));
    return false;
  }

  workflow.candidate = candidate;
  workflow.state = "VERIFYING";
  await pushEvent(workflow, "candidate.resolved", { candidate }, candidate.id);

  const context = { contextId: workflow.contextId, chainId: workflow.request.chainId, requestedAt: nowIso() };
  workflow.policyResult = undefined;

  try {
    const credential = await provider.verifyCandidate(candidate, context);
    workflow.credentialResult = credential;
    await pushEvent(workflow, "verification.result", { status: credential.status }, candidate.id);

    if (credential.status === "UNVERIFIABLE") {
      const code = credential.refusalCode ?? "DEPENDENCY_UNAVAILABLE";
      workflow.attemptedCandidates.push({ candidate, decision: "UNVERIFIABLE", refusalCode: code });
      if (deferFailure) await pushEvent(workflow, "candidate.unverifiable", { code }, candidate.id);
      else await finalizeUnverifiable(workflow, code, "provider returned UNVERIFIABLE");
      return false;
    }

    workflow.state = "POLICY_EVALUATING";
    const policyResult = evaluatePolicy(workflow.policy, credential, workflow.request.maxSpendAtomic, nowIso());
    workflow.policyResult = policyResult;
    await pushEvent(workflow, "policy.evaluated", { ok: policyResult.ok, failureCode: policyResult.failureCode }, candidate.id);

    if (!policyResult.ok) {
      const code = policyResult.failureCode ?? "POLICY_REJECTED";
      if (deferFailure) {
        workflow.attemptedCandidates.push({ candidate, decision: "REFUSE", refusalCode: code });
        await pushEvent(workflow, "candidate.refused", { code }, candidate.id);
      } else await finalizeRefuse(workflow, code, candidate);
      return false;
    }

    const credentialResultHash = hashObject(credential);
    const lease = await createLease({
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
    await pushEvent(workflow, "authorization.created", { leaseId: lease.id, expiresAt: lease.expiresAt }, candidate.id);

    await emitReceipt(workflow);
    return true;
  } catch (err) {
    if (deferFailure) {
      workflow.attemptedCandidates.push({ candidate, decision: "UNVERIFIABLE", refusalCode: "DEPENDENCY_UNAVAILABLE" });
      await pushEvent(workflow, "candidate.unavailable", { detail: describeProviderError(err) }, candidate.id);
    } else await finalizeUnverifiable(workflow, "DEPENDENCY_UNAVAILABLE", describeProviderError(err));
    return false;
  }
}

async function finalizeRefuse(workflow: WorkflowRecord, code: RefusalCode, candidate: ResolvedCandidate): Promise<void> {
  workflow.decision = "REFUSE";
  workflow.refusalCode = code;
  workflow.state = "REFUSED";
  workflow.attemptedCandidates.push({ candidate, decision: "REFUSE", refusalCode: code });
  await pushEvent(workflow, "workflow.refused", { code }, candidate.id);
  await emitReceipt(workflow);
}

async function finalizeUnverifiable(workflow: WorkflowRecord, code: RefusalCode, detail: string): Promise<void> {
  workflow.decision = "UNVERIFIABLE";
  workflow.refusalCode = code;
  workflow.state = "UNVERIFIABLE";
  await pushEvent(workflow, "workflow.unverifiable", { code, detail });
  await emitReceipt(workflow);
}

function describeProviderError(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

async function emitReceipt(workflow: WorkflowRecord): Promise<void> {
  const decision: Decision = workflow.decision ?? "UNVERIFIABLE";
  const receipt = await buildReceipt({
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
      policyLevel: workflow.policy.policyLevel,
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
  await pushEvent(workflow, "receipt.created", { receiptId: receipt.receiptId });
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
  await pushEvent(workflow, "execution.requested", { leaseId: workflow.authorization.id });

  const result = await executor.dispatch(request, workflow.authorization.id, nowIso());
  workflow.execution = result;
  workflow.state = result.state === "SUCCEEDED" ? "SETTLED" : "EXECUTION_FAILED";
  await pushEvent(workflow, "execution.result", { state: result.state, errorCode: result.errorCode });

  await emitReceipt(workflow);
  return workflow;
}

export async function getWorkflow(id: string): Promise<WorkflowRecord | undefined> {
  const workflow = await workflowStore.get(id);
  if (workflow?.authorization) {
    workflow.authorization = await getLease(workflow.authorization.id) ?? { ...workflow.authorization, revoked: true };
  }
  return workflow;
}
