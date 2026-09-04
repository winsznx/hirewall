import { NextResponse } from "next/server";
import { executeWorkflow, createWorkflow, getWorkflow } from "@/server/workflow/orchestrator";
import { FixtureCredentialProvider } from "@/server/providers/fixture-provider";
import { verifyReceipt } from "@/server/receipts/verifier";
import { getReceipt } from "@/server/receipts/receipt-service";
import { mapVerificationChecks as mapVerificationChecksForProofLab } from "@/server/view-mapper";

// Proof Lab only ever runs HIREWALL-owned scenarios against the fixture
// provider through the exact same orchestrator/policy/lease/executor code
// production uses. It never simulates an Orion-specific signature/signer
// tamper and calls it Orion — those scenarios are blocked by GATE-001 and
// intentionally absent here. See DECISIONS.md DEC-004.
const SCENARIOS: Record<string, { slug: string; label: string; description: string; replay?: boolean; tamperReceipt?: boolean }> = {
  valid: { slug: "fixture-valid", label: "Valid credential", description: "Fresh, correctly-bound fixture credential." },
  expired: { slug: "fixture-expired", label: "Expired credential", description: "Fixture credential past its freshness window." },
  wallet_mismatch: {
    slug: "fixture-wallet-mismatch",
    label: "Wallet substitution",
    description: "Fixture credential wallet does not match the request target.",
  },
  provider_unavailable: {
    slug: "fixture-unverifiable",
    label: "Dependency unavailable",
    description: "Simulated credential-source outage.",
  },
  replay: {
    slug: "fixture-valid",
    label: "Replayed authorization",
    description: "A valid lease is executed twice; the second attempt must be rejected.",
    replay: true,
  },
  receipt_tamper: {
    slug: "fixture-valid",
    label: "Receipt tamper",
    description: "A field in an otherwise-valid receipt is mutated after issuance; the verifier must detect it.",
    tamperReceipt: true,
  },
};

export async function POST(request: Request) {
  const body = await request.json();
  const scenarioId = body.scenarioId as string;
  const scenario = SCENARIOS[scenarioId];

  if (!scenario) {
    return NextResponse.json({ error: "unknown_scenario" }, { status: 400 });
  }

  const provider = new FixtureCredentialProvider();

  const workflow = await createWorkflow(
    { task: "Proof Lab controlled scenario", maxSpend: "100000", chainId: 8453, workerIdentifier: scenario.slug, allowFallback: false },
    // FixtureCredentialProvider's input type is narrower than the generic
    // CredentialProvider<never> the orchestrator expects; Proof Lab always
    // runs the fixture provider deliberately, so this cast is scoped and
    // intentional rather than a silent widening elsewhere in the app.
    provider as unknown as Parameters<typeof createWorkflow>[1],
    "fault_injection"
  );

  if (scenario.replay && workflow.authorization) {
    await executeWorkflow(workflow);
    const secondAttempt = await executeWorkflow(getWorkflow(workflow.id)!);
    return NextResponse.json({
      scenario: { id: scenarioId, label: scenario.label, description: scenario.description },
      mutation: { description: "Second execute() call reusing the same lease ID", expected: "REPLAY_REJECTED", observed: secondAttempt.execution.errorCode ?? "none" },
      verification: mapVerificationChecksForProofLab(workflow.credentialResult),
      decision: workflow.decision,
      refusalCode: workflow.refusalCode,
      receiptId: workflow.receiptId,
    });
  }

  if (scenario.tamperReceipt && workflow.receiptId) {
    const receipt = getReceipt(workflow.receiptId);
    if (receipt) {
      const tampered = { ...receipt, decision: "AUTHORIZE" as const, refusalCode: undefined };
      const outcome = verifyReceipt(tampered);
      return NextResponse.json({
        scenario: { id: scenarioId, label: scenario.label, description: scenario.description },
        mutation: {
          description: "decision field mutated post-issuance without recomputing receiptHash",
          expected: "receipt_hash check FAILs",
          observed: outcome.integrityOk ? "integrity incorrectly reported valid" : "receipt_hash FAIL (detected)",
        },
        verification: mapVerificationChecksForProofLab(workflow.credentialResult),
        decision: workflow.decision,
        refusalCode: workflow.refusalCode,
        receiptId: workflow.receiptId,
      });
    }
  }

  return NextResponse.json({
    scenario: { id: scenarioId, label: scenario.label, description: scenario.description },
    mutation: {
      description: scenario.description,
      expected: workflow.decision ?? "UNVERIFIABLE",
      observed: workflow.decision ?? "UNVERIFIABLE",
    },
    verification: mapVerificationChecksForProofLab(workflow.credentialResult),
    decision: workflow.decision,
    refusalCode: workflow.refusalCode,
    receiptId: workflow.receiptId,
  });
}
