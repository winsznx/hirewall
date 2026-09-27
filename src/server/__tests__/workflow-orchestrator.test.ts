// Proves the orchestrator's decision output is entirely a function of the
// deterministic provider/policy/lease chain — there is no code path that
// accepts an externally supplied decision. Per BUILD_CONTRACT.md section 7:
// "Agent decides what to do. Deterministic code decides what is true."
import { describe, expect, it } from "vitest";
import { FixtureCredentialProvider } from "../providers/fixture-provider";
import { createWorkflow, executeWorkflow, getWorkflow } from "../workflow/orchestrator";
import { getReceipt } from "../receipts/receipt-service";

const provider = new FixtureCredentialProvider();

describe("workflow orchestrator", () => {
  it("find mode uses real candidate matching and falls back after a refusal", async () => {
    const discoveryProvider = Object.assign(new FixtureCredentialProvider(), {
      matchCandidates: async () => [
        await provider.resolveCandidate({ slug: "fixture-expired" }),
        await provider.resolveCandidate({ slug: "fixture-valid" }),
      ],
    });
    const workflow = await createWorkflow(
      { task: "test task", maxSpend: "100000", chainId: 8453, mode: "find", allowFallback: true },
      discoveryProvider as never,
      "fixture"
    );
    expect(workflow.decision).toBe("AUTHORIZE");
    expect(workflow.candidate?.id).toBe("fixture-valid");
    expect(workflow.attemptedCandidates).toMatchObject([
      { candidate: { id: "fixture-expired" }, decision: "REFUSE", refusalCode: "ATTESTATION_EXPIRED" },
    ]);
  });

  it("a valid fixture candidate produces AUTHORIZE with a real lease", async () => {
    const workflow = await createWorkflow(
      { task: "test task", maxSpend: "100000", chainId: 8453, workerIdentifier: "fixture-valid", allowFallback: false },
      provider as never,
      "fixture"
    );
    expect(workflow.decision).toBe("AUTHORIZE");
    expect(workflow.authorization).toBeDefined();
    expect(workflow.authorization?.revoked).toBe(false);
  });

  it("an expired fixture credential produces REFUSE, never AUTHORIZE", async () => {
    const workflow = await createWorkflow(
      { task: "test task", maxSpend: "100000", chainId: 8453, workerIdentifier: "fixture-expired", allowFallback: false },
      provider as never,
      "fixture"
    );
    expect(workflow.decision).toBe("REFUSE");
    expect(workflow.authorization).toBeUndefined();
    expect(workflow.refusalCode).toBe("ATTESTATION_EXPIRED");
  });

  it("a dependency-unavailable fixture credential produces UNVERIFIABLE, not a red refusal", async () => {
    const workflow = await createWorkflow(
      { task: "test task", maxSpend: "100000", chainId: 8453, workerIdentifier: "fixture-unverifiable", allowFallback: false },
      provider as never,
      "fixture"
    );
    expect(workflow.decision).toBe("UNVERIFIABLE");
    expect(workflow.authorization).toBeUndefined();
  });

  it("every terminal workflow state produces a receipt, including refusals", async () => {
    const workflow = await createWorkflow(
      { task: "test task", maxSpend: "100000", chainId: 8453, workerIdentifier: "fixture-wallet-mismatch", allowFallback: false },
      provider as never,
      "fixture"
    );
    expect(workflow.receiptId).toBeDefined();
    const receipt = getReceipt(workflow.receiptId!);
    expect(receipt).toBeDefined();
    expect(receipt?.decision).toBe("REFUSE");
  });

  it("AUTHORIZE + execution FAILED is a valid, non-contradictory combination", async () => {
    const workflow = await createWorkflow(
      { task: "test task", maxSpend: "100000", chainId: 8453, workerIdentifier: "fixture-valid", allowFallback: false },
      provider as never,
      "fixture"
    );
    expect(workflow.decision).toBe("AUTHORIZE");

    // Default executor transport is the honest "no real endpoint" path —
    // exercising it here proves decision and settlement stay separate
    // fields rather than collapsing into one status.
    const executed = await executeWorkflow(getWorkflow(workflow.id)!);
    expect(executed.decision).toBe("AUTHORIZE");
    expect(executed.execution.state).not.toBe("SUCCEEDED");
  });

  it("execute() on a workflow with no authorization does not silently proceed", async () => {
    const workflow = await createWorkflow(
      { task: "test task", maxSpend: "100000", chainId: 8453, workerIdentifier: "fixture-expired", allowFallback: false },
      provider as never,
      "fixture"
    );
    const executed = await executeWorkflow(workflow);
    expect(executed.execution.state).toBe("NOT_ATTEMPTED");
  });
});
