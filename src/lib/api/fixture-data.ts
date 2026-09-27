import type {
  CandidateView,
  CatalogRun,
  DispatchWorkflow,
  HirewallReceipt,
  PolicyView,
  VerificationCheck,
} from "@/lib/types";
import { PROOF_LAB_SCENARIOS } from "@/lib/proof-lab-scenarios";

// Development fixture data. Every object here carries evidenceMode
// "fixture" or "fault_injection" so the UI can never mistake it for
// live production evidence. See handoff spec section 28.

const NOW = "2026-08-31T14:32:00Z";

const basePolicy: PolicyView = {
  network: "Base",
  maxSpend: "0.10",
  currency: "USDC",
  freshAttestationRequired: true,
  walletMatchRequired: true,
  freshAtDispatchRequired: true,
  policyHash: "0x9c1a...4e2f",
};

function candidate(overrides: Partial<CandidateView> = {}): CandidateView {
  return {
    id: "cand_orion_courier_01",
    name: "Courier-7",
    slug: "courier-7",
    wallet: "0xA11c...9F02",
    listingUrl: "https://orion.market/listing/courier-7",
    category: "logistics.courier",
    source: "direct",
    ...overrides,
  };
}

const fullChecklist = (
  overrides: Partial<Record<string, Partial<VerificationCheck>>> = {}
): VerificationCheck[] => {
  const base: VerificationCheck[] = [
    { id: "attestation_present", label: "Attestation present", status: "pass" },
    { id: "payload_parses", label: "Payload parses", status: "pass" },
    { id: "signature", label: "Signature", status: "pass" },
    { id: "expected_signer", label: "Expected signer", status: "pass" },
    { id: "base_chain", label: "Base chain", status: "pass" },
    { id: "agentbound_identity", label: "AgentBound identity", status: "pass" },
    { id: "wallet_binding", label: "Wallet binding", status: "pass" },
    { id: "fresh_at_dispatch", label: "Fresh at dispatch", status: "pass" },
    { id: "buyer_policy", label: "Buyer policy", status: "pass" },
  ];
  return base.map((c) => (overrides[c.id] ? { ...c, ...overrides[c.id] } : c));
};

function workflow(partial: Partial<DispatchWorkflow> & { id: string }): DispatchWorkflow {
  return {
    evidenceMode: "fixture",
    state: "complete",
    task: "Deliver a signed package to 44 Harbor St by 6pm",
    policy: basePolicy,
    verification: fullChecklist(),
    settlement: "NOT_ATTEMPTED",
    createdAt: NOW,
    updatedAt: NOW,
    ...partial,
  };
}

export const FIXTURE_WORKFLOWS: Record<string, DispatchWorkflow> = {
  valid_authorized: workflow({
    id: "valid_authorized",
    candidate: candidate(),
    decision: "AUTHORIZE",
    authorization: {
      id: "auth_7f3a",
      amount: "0.05",
      currency: "USDC",
      network: "Base",
      issuedAt: NOW,
      expiresAt: "2026-08-31T14:52:00Z",
      status: "ACTIVE",
      attestationHash: "0x71ab...c390",
      policyHash: "0x9c1a...4e2f",
    },
    settlement: "NOT_ATTEMPTED",
    receiptId: "rcpt_valid_authorized",
  }),

  valid_authorized_payment_pending: workflow({
    id: "valid_authorized_payment_pending",
    candidate: candidate(),
    decision: "AUTHORIZE",
    authorization: {
      id: "auth_7f3b",
      amount: "0.05",
      currency: "USDC",
      network: "Base",
      issuedAt: NOW,
      expiresAt: "2026-08-31T14:52:00Z",
      status: "ACTIVE",
      attestationHash: "0x71ab...c390",
      policyHash: "0x9c1a...4e2f",
    },
    settlement: "PENDING",
    execution: { state: "PENDING", amount: "0.05", currency: "USDC" },
    receiptId: "rcpt_valid_authorized_payment_pending",
  }),

  valid_authorized_payment_success: workflow({
    id: "valid_authorized_payment_success",
    candidate: candidate(),
    decision: "AUTHORIZE",
    authorization: {
      id: "auth_7f3c",
      amount: "0.05",
      currency: "USDC",
      network: "Base",
      issuedAt: NOW,
      expiresAt: "2026-08-31T14:52:00Z",
      status: "CONSUMED",
      attestationHash: "0x71ab...c390",
      policyHash: "0x9c1a...4e2f",
    },
    settlement: "SUCCEEDED",
    execution: {
      state: "SUCCEEDED",
      amount: "0.05",
      currency: "USDC",
      txId: "0x4d9e2f1a7c...b820",
      explorerUrl: "https://basescan.org/tx/0x4d9e2f1a7c",
      x402RequestId: "x402_2b91f",
      responseHash: "0x88bc...7a11",
    },
    receiptId: "rcpt_valid_authorized_payment_success",
  }),

  valid_authorized_payment_failed: workflow({
    id: "valid_authorized_payment_failed",
    candidate: candidate(),
    decision: "AUTHORIZE",
    authorization: {
      id: "auth_7f3d",
      amount: "0.05",
      currency: "USDC",
      network: "Base",
      issuedAt: NOW,
      expiresAt: "2026-08-31T14:52:00Z",
      status: "ACTIVE",
      attestationHash: "0x71ab...c390",
      policyHash: "0x9c1a...4e2f",
    },
    settlement: "FAILED",
    execution: { state: "FAILED", amount: "0.05", currency: "USDC" },
    receiptId: "rcpt_valid_authorized_payment_failed",
  }),

  attestation_missing: workflow({
    id: "attestation_missing",
    candidate: candidate({ id: "cand_orion_02", name: "Fetchling", slug: "fetchling" }),
    verification: fullChecklist({
      attestation_present: { status: "fail", code: "ATTESTATION_MISSING" },
      payload_parses: { status: "skipped" },
      signature: { status: "skipped" },
      expected_signer: { status: "skipped" },
      base_chain: { status: "skipped" },
      agentbound_identity: { status: "skipped" },
      wallet_binding: { status: "skipped" },
      fresh_at_dispatch: { status: "skipped" },
      buyer_policy: { status: "skipped" },
    }),
    decision: "REFUSE",
    refusalCode: "ATTESTATION_MISSING",
    refusalDetail: "No Orion AgentBound attestation was found for this listing.",
    receiptId: "rcpt_attestation_missing",
  }),

  signature_invalid: workflow({
    id: "signature_invalid",
    candidate: candidate({ id: "cand_orion_03", name: "Palletworks", slug: "palletworks" }),
    verification: fullChecklist({
      signature: {
        status: "fail",
        code: "SIGNATURE_INVALID",
        expected: "valid ed25519 signature",
        observed: "signature does not match payload",
      },
      expected_signer: { status: "skipped" },
      base_chain: { status: "skipped" },
      agentbound_identity: { status: "skipped" },
      wallet_binding: { status: "skipped" },
      fresh_at_dispatch: { status: "skipped" },
      buyer_policy: { status: "skipped" },
    }),
    decision: "REFUSE",
    refusalCode: "SIGNATURE_INVALID",
    refusalDetail: "The attestation signature did not verify against the signed payload.",
    receiptId: "rcpt_signature_invalid",
  }),

  signer_untrusted: workflow({
    id: "signer_untrusted",
    candidate: candidate({ id: "cand_orion_04", name: "Northline", slug: "northline" }),
    verification: fullChecklist({
      expected_signer: {
        status: "fail",
        code: "SIGNER_UNTRUSTED",
        expected: "0x9F1c...oracle",
        observed: "0x00de...unknown",
      },
      base_chain: { status: "skipped" },
      agentbound_identity: { status: "skipped" },
      wallet_binding: { status: "skipped" },
      fresh_at_dispatch: { status: "skipped" },
      buyer_policy: { status: "skipped" },
    }),
    decision: "REFUSE",
    refusalCode: "SIGNER_UNTRUSTED",
    refusalDetail: "The attestation was signed by a key outside the trusted Orion signer set.",
    receiptId: "rcpt_signer_untrusted",
  }),

  attestation_expired: workflow({
    id: "attestation_expired",
    candidate: candidate({ id: "cand_orion_05", name: "Meridian Runner", slug: "meridian-runner" }),
    verification: fullChecklist({
      fresh_at_dispatch: {
        status: "fail",
        code: "ATTESTATION_EXPIRED",
        expected: "expiresAt > dispatch time",
        observed: "expired 00:04:12 before dispatch",
      },
      buyer_policy: { status: "skipped" },
    }),
    decision: "REFUSE",
    refusalCode: "ATTESTATION_EXPIRED",
    refusalDetail: "This credential expired before dispatch. HIREWALL created no payment authority.",
    receiptId: "rcpt_attestation_expired",
  }),

  wallet_mismatch: workflow({
    id: "wallet_mismatch",
    candidate: candidate({ id: "cand_orion_06", name: "Sideband Labs", slug: "sideband-labs" }),
    verification: fullChecklist({
      wallet_binding: {
        status: "fail",
        code: "WALLET_MISMATCH",
        expected: "0xA11c...9F02",
        observed: "0xB204...11ee",
      },
      fresh_at_dispatch: { status: "skipped" },
      buyer_policy: { status: "skipped" },
    }),
    decision: "REFUSE",
    refusalCode: "WALLET_MISMATCH",
    refusalDetail: "The declared listing wallet does not match the wallet bound in the credential.",
    receiptId: "rcpt_wallet_mismatch",
  }),

  policy_rejected: workflow({
    id: "policy_rejected",
    candidate: candidate({ id: "cand_orion_07", name: "Groundcast", slug: "groundcast" }),
    verification: fullChecklist({
      buyer_policy: {
        status: "fail",
        code: "POLICY_REJECTED",
        expected: "tier >= verified",
        observed: "tier = unverified",
      },
    }),
    decision: "REFUSE",
    refusalCode: "POLICY_REJECTED",
    refusalDetail: "This worker's credential is valid but does not satisfy your buyer policy.",
    receiptId: "rcpt_policy_rejected",
  }),

  authorization_expired: workflow({
    id: "authorization_expired",
    candidate: candidate(),
    decision: "AUTHORIZE",
    authorization: {
      id: "auth_expired_1",
      amount: "0.05",
      currency: "USDC",
      network: "Base",
      issuedAt: "2026-08-31T14:10:00Z",
      expiresAt: "2026-08-31T14:30:00Z",
      status: "EXPIRED",
      attestationHash: "0x71ab...c390",
      policyHash: "0x9c1a...4e2f",
    },
    settlement: "NOT_ATTEMPTED",
    receiptId: "rcpt_authorization_expired",
  }),

  budget_exceeded: workflow({
    id: "budget_exceeded",
    candidate: candidate({ id: "cand_orion_08", name: "Dockside Ops", slug: "dockside-ops" }),
    verification: fullChecklist({
      buyer_policy: {
        status: "fail",
        code: "BUDGET_EXCEEDED",
        expected: "quoted <= 0.10 USDC",
        observed: "quoted 0.34 USDC",
      },
    }),
    decision: "REFUSE",
    refusalCode: "BUDGET_EXCEEDED",
    refusalDetail: "The worker's quoted price exceeds the buyer's maximum spend.",
    receiptId: "rcpt_budget_exceeded",
  }),

  dependency_unavailable: workflow({
    id: "dependency_unavailable",
    candidate: candidate({ id: "cand_orion_09", name: "Waypoint Co.", slug: "waypoint-co" }),
    verification: fullChecklist({
      attestation_present: { status: "unavailable", code: "DEPENDENCY_UNAVAILABLE" },
      payload_parses: { status: "unavailable" },
      signature: { status: "unavailable" },
      expected_signer: { status: "unavailable" },
      base_chain: { status: "unavailable" },
      agentbound_identity: { status: "unavailable" },
      wallet_binding: { status: "unavailable" },
      fresh_at_dispatch: { status: "unavailable" },
      buyer_policy: { status: "unavailable" },
    }),
    decision: "UNVERIFIABLE",
    refusalCode: "DEPENDENCY_UNAVAILABLE",
    refusalDetail:
      "HIREWALL cannot establish the required identity state right now, so no dispatch is authorized.",
    receiptId: "rcpt_dependency_unavailable",
  }),

  execution_unknown: workflow({
    id: "execution_unknown",
    candidate: candidate(),
    decision: "AUTHORIZE",
    authorization: {
      id: "auth_unk_1",
      amount: "0.05",
      currency: "USDC",
      network: "Base",
      issuedAt: NOW,
      expiresAt: "2026-08-31T14:52:00Z",
      status: "ACTIVE",
      attestationHash: "0x71ab...c390",
      policyHash: "0x9c1a...4e2f",
    },
    settlement: "UNKNOWN",
    execution: { state: "UNKNOWN", amount: "0.05", currency: "USDC" },
    receiptId: "rcpt_execution_unknown",
  }),

  fallback_first_refused_second_authorized: workflow({
    id: "fallback_first_refused_second_authorized",
    candidate: candidate({ id: "cand_orion_11", name: "Courier-7", slug: "courier-7" }),
    decision: "AUTHORIZE",
    attemptedCandidates: [
      {
        candidate: candidate({ id: "cand_orion_10", name: "Fastlane Bots", slug: "fastlane-bots" }),
        decision: "REFUSE",
        refusalCode: "ATTESTATION_EXPIRED",
      },
      {
        candidate: candidate({ id: "cand_orion_11", name: "Courier-7", slug: "courier-7" }),
        decision: "AUTHORIZE",
      },
    ],
    authorization: {
      id: "auth_fb_1",
      amount: "0.05",
      currency: "USDC",
      network: "Base",
      issuedAt: NOW,
      expiresAt: "2026-08-31T14:52:00Z",
      status: "ACTIVE",
      attestationHash: "0x71ab...c390",
      policyHash: "0x9c1a...4e2f",
    },
    settlement: "NOT_ATTEMPTED",
    receiptId: "rcpt_fallback_first_refused_second_authorized",
  }),

  all_candidates_rejected: workflow({
    id: "all_candidates_rejected",
    attemptedCandidates: [
      {
        candidate: candidate({ id: "cand_orion_12", name: "Fastlane Bots", slug: "fastlane-bots" }),
        decision: "REFUSE",
        refusalCode: "ATTESTATION_EXPIRED",
      },
      {
        candidate: candidate({ id: "cand_orion_13", name: "Dockside Ops", slug: "dockside-ops" }),
        decision: "REFUSE",
        refusalCode: "BUDGET_EXCEEDED",
      },
      {
        candidate: candidate({ id: "cand_orion_14", name: "Sideband Labs", slug: "sideband-labs" }),
        decision: "REFUSE",
        refusalCode: "WALLET_MISMATCH",
      },
    ],
    verification: [],
    decision: "REFUSE",
    refusalCode: "NO_ELIGIBLE_CANDIDATE",
    refusalDetail: "No candidate satisfied this dispatch policy. No payment authority was created.",
  }),
};

export const FIXTURE_RECEIPTS: Record<string, HirewallReceipt> = Object.fromEntries(
  Object.entries(FIXTURE_WORKFLOWS)
    .filter(([, w]) => w.receiptId)
    .map(([, w]) => {
      const r: HirewallReceipt = {
        id: w.receiptId!,
        evidenceMode: "fixture",
        decision: w.decision ?? "UNVERIFIABLE",
        refusalCode: w.refusalCode,
        settlement: w.settlement,
        timestamp: w.updatedAt,
        request: {
          taskSummary: w.task,
          budget: `${w.policy.maxSpend} ${w.policy.currency}`,
          network: "Base",
          contextId: `ctx_${w.id}`,
        },
        candidate: w.candidate,
        credential: w.candidate
          ? {
              attestationHash: w.authorization?.attestationHash ?? "0x0000...0000",
              signer: "0x9F1c...oracle",
              issuedAt: w.createdAt,
              expiresAt: w.authorization?.expiresAt ?? w.updatedAt,
              agentBoundId: `agentbound_${w.candidate.slug}`,
            }
          : undefined,
        verification: w.verification,
        policy: w.policy,
        authorization: w.authorization,
        execution: w.execution,
        limitations: [
          "This receipt proves that HIREWALL verified the recorded Orion credential and applied the recorded policy. It does not prove that the agent will perform well in future jobs.",
        ],
      };
      return [r.id, r];
    })
);

export { PROOF_LAB_SCENARIOS };

export const FIXTURE_FAULT_INJECTIONS: Record<string, DispatchWorkflow> = {
  fault_injection_tamper: workflow({
    id: "fault_injection_tamper",
    evidenceMode: "fault_injection",
    candidate: candidate({ id: "cand_orion_lab", name: "Courier-7", slug: "courier-7" }),
    verification: fullChecklist({
      signature: {
        status: "fail",
        code: "SIGNATURE_INVALID",
        expected: "signature verification succeeds",
        observed: "signature verification fails",
      },
      expected_signer: { status: "skipped" },
      base_chain: { status: "skipped" },
      agentbound_identity: { status: "skipped" },
      wallet_binding: { status: "skipped" },
      fresh_at_dispatch: { status: "skipped" },
      buyer_policy: { status: "skipped" },
    }),
    decision: "REFUSE",
    refusalCode: "SIGNATURE_INVALID",
    refusalDetail: "One byte was changed in the signed payload. Signature verification failed as expected.",
    receiptId: "rcpt_fault_injection_tamper",
  }),
  fault_injection_expiry: workflow({
    id: "fault_injection_expiry",
    evidenceMode: "fault_injection",
    candidate: candidate({ id: "cand_orion_lab", name: "Courier-7", slug: "courier-7" }),
    verification: fullChecklist({
      fresh_at_dispatch: {
        status: "fail",
        code: "ATTESTATION_EXPIRED",
        expected: "expiresAt > dispatch time",
        observed: "expiry rewritten to the past",
      },
      buyer_policy: { status: "skipped" },
    }),
    decision: "REFUSE",
    refusalCode: "ATTESTATION_EXPIRED",
    refusalDetail: "The attestation expiry was rewritten to a past timestamp before dispatch.",
    receiptId: "rcpt_fault_injection_expiry",
  }),
};

Object.assign(
  FIXTURE_RECEIPTS,
  Object.fromEntries(
    Object.values(FIXTURE_FAULT_INJECTIONS).map((w) => {
      const r: HirewallReceipt = {
        id: w.receiptId!,
        evidenceMode: "fault_injection",
        decision: w.decision ?? "UNVERIFIABLE",
        refusalCode: w.refusalCode,
        settlement: w.settlement,
        timestamp: w.updatedAt,
        request: {
          taskSummary: w.task,
          budget: `${w.policy.maxSpend} ${w.policy.currency}`,
          network: "Base",
          contextId: `ctx_${w.id}`,
        },
        candidate: w.candidate,
        verification: w.verification,
        policy: w.policy,
        authorization: w.authorization,
        execution: w.execution,
        limitations: [
          "This receipt was produced by Proof Lab controlled fault injection. The source Orion agent did not publish this data.",
        ],
      };
      return [r.id, r];
    })
  )
);

// Required dev fixture scenario: catalog_mixed_results (frontend handoff
// section 28). Candidates below intentionally mix AUTHORIZE, REFUSE, and
// UNVERIFIABLE outcomes so /catalog has a non-trivial fixture to render
// before a real frozen catalog run exists.
export const FIXTURE_CATALOG_RUN: CatalogRun = {
  id: "catalog_mixed_results",
  evidenceMode: "fixture",
  runTimestamp: "2026-08-30T09:00:00Z",
  snapshotHash: "0x2e91...aa04",
  cohortDenominator: 128,
  policy: basePolicy,
  softwareCommit: "a67b55a",
  baselineRule: "Listed on Orion Store with a non-empty wallet field",
  hirewallRule: "Fresh, signed AgentBound attestation bound to the listed wallet, passing buyer policy",
  counts: { authorize: 71, refuse: 49, unverifiable: 8 },
  candidates: [
    {
      candidateId: "cand_orion_courier_01",
      name: "Courier-7",
      baselineEligible: true,
      decision: "AUTHORIZE",
      attestationFreshnessAtRun: "3m12s",
      receiptId: "rcpt_valid_authorized",
    },
    {
      candidateId: "cand_orion_05",
      name: "Meridian Runner",
      baselineEligible: true,
      decision: "REFUSE",
      refusalCode: "ATTESTATION_EXPIRED",
      attestationFreshnessAtRun: "expired",
      receiptId: "rcpt_attestation_expired",
    },
    {
      candidateId: "cand_orion_09",
      name: "Waypoint Co.",
      baselineEligible: true,
      decision: "UNVERIFIABLE",
      refusalCode: "DEPENDENCY_UNAVAILABLE",
      attestationFreshnessAtRun: "unknown",
      receiptId: "rcpt_dependency_unavailable",
    },
    {
      candidateId: "cand_orion_06",
      name: "Sideband Labs",
      baselineEligible: true,
      decision: "REFUSE",
      refusalCode: "WALLET_MISMATCH",
      attestationFreshnessAtRun: "2m01s",
      receiptId: "rcpt_wallet_mismatch",
    },
  ],
};
