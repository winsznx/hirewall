import { NextResponse } from "next/server";
import { executeWorkflow, createWorkflow, getWorkflow } from "@/server/workflow/orchestrator";
import { FixtureCredentialProvider } from "@/server/providers/fixture-provider";
import { verifyReceipt } from "@/server/receipts/verifier";
import { getReceipt } from "@/server/receipts/receipt-service";
import { mapVerificationChecks as mapVerificationChecksForProofLab } from "@/server/view-mapper";
import { PROOF_LAB_SCENARIOS } from "@/lib/proof-lab-scenarios";

// Proof Lab only ever runs HIREWALL-owned scenarios against the fixture
// provider through the exact same orchestrator/policy/lease/executor code
// production uses. It never simulates an Orion-specific signature/signer
// tamper and calls it Orion — those scenarios are blocked by GATE-001 and
// intentionally absent here. See DECISIONS.md DEC-004.
//
// The operational fields below (fixture slug, replay/tamperReceipt flags)
// are keyed by the same ids as PROOF_LAB_SCENARIOS so the frontend
// dropdown and this route can never drift apart again — every id here
// must exist in PROOF_LAB_SCENARIOS, enforced at module load below.
const SCENARIO_OPERATIONS: Record<string, { slug: string; replay?: boolean; tamperReceipt?: boolean }> = {
  valid: { slug: "fixture-valid" },
  expired: { slug: "fixture-expired" },
  wallet_mismatch: { slug: "fixture-wallet-mismatch" },
  provider_unavailable: { slug: "fixture-unverifiable" },
  replay: { slug: "fixture-valid", replay: true },
  receipt_tamper: { slug: "fixture-valid", tamperReceipt: true },
};

const SCENARIOS: Record<string, { slug: string; label: string; description: string; replay?: boolean; tamperReceipt?: boolean }> =
  Object.fromEntries(
    PROOF_LAB_SCENARIOS.map((s) => {
      const ops = SCENARIO_OPERATIONS[s.id];
      if (!ops) throw new Error(`Proof Lab scenario "${s.id}" has no operational definition in route.ts`);
      return [s.id, { ...ops, label: s.label, description: s.description }];
    })
  );

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
    const secondAttempt = await executeWorkflow((await getWorkflow(workflow.id))!);
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
    const receipt = await getReceipt(workflow.receiptId);
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
