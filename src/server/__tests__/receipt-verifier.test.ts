import { describe, expect, it } from "vitest";
import { buildReceipt, POLICY_VERSION, VERIFIER_VERSION } from "../receipts/receipt-service";
import { verifyReceipt } from "../receipts/verifier";
import type { ReceiptInputForBuild } from "../receipts/receipt-types";

function baseInput(overrides: Partial<ReceiptInputForBuild> = {}): ReceiptInputForBuild {
  return {
    evidenceMode: "fixture",
    request: { contextId: "ctx_1", maxSpendAtomic: "100000", chainId: 8453 },
    candidate: { id: "cand_1", source: "fixture" },
    provider: { providerId: "fixture" },
    verification: {
      providerId: "fixture",
      status: "VERIFIED",
      checkedAt: "2026-09-04T12:00:00.000Z",
      subject: { id: "cand_1" },
      checks: [{ id: "signature", status: "PASS" }],
    },
    policy: { policyHash: "0xabc", result: "PASS" },
    decision: "AUTHORIZE",
    execution: { state: "NOT_ATTEMPTED" },
    software: { commit: "test", verifierVersion: VERIFIER_VERSION, policyVersion: POLICY_VERSION },
    ...overrides,
  };
}

describe("receipt verifier recomputation", () => {
  it("a genuine receipt's hash recomputes to PASS", async () => {
    const receipt = await buildReceipt(
      baseInput({
        authorization: {
          id: "lease_1",
          contextId: "ctx_1",
          candidateId: "cand_1",
          maxAmountAtomic: "100000",
          chainId: 8453,
          credentialResultHash: "0xcred",
          policyHash: "0xabc",
          issuedAt: "2026-09-04T12:00:00.000Z",
          expiresAt: "2026-09-04T12:20:00.000Z",
          nonce: "nonce_1",
          revoked: false,
        },
      })
    );
    const outcome = verifyReceipt(receipt);
    const hashCheck = outcome.checks.find((c) => c.id === "receipt_hash");
    expect(hashCheck?.status).toBe("PASS");
    expect(outcome.integrityOk).toBe(true);
  });

  it("mutating a receipt field after issuance is detected by hash recomputation, not just trusted", async () => {
    const receipt = await buildReceipt(baseInput({ decision: "REFUSE", refusalCode: "ATTESTATION_EXPIRED" }));
    const tampered = { ...receipt, decision: "AUTHORIZE" as const, refusalCode: undefined };

    const outcome = verifyReceipt(tampered);
    const hashCheck = outcome.checks.find((c) => c.id === "receipt_hash");
    expect(hashCheck?.status).toBe("FAIL");
    expect(outcome.integrityOk).toBe(false);
  });

  it("a valid REFUSE receipt is a successful proof artifact, not treated as an error", async () => {
    const receipt = await buildReceipt(baseInput({ decision: "REFUSE", refusalCode: "WALLET_MISMATCH", authorization: undefined }));
    const outcome = verifyReceipt(receipt);
    expect(outcome.integrityOk).toBe(true);
    expect(outcome.decision).toBe("REFUSE");
  });

  it("orion-provider receipts always report credential verification as NOT_CLAIMED", async () => {
    const receipt = await buildReceipt(
      baseInput({
        evidenceMode: "live",
        provider: { providerId: "orion" },
        verification: {
          providerId: "orion",
          status: "UNVERIFIABLE",
          checkedAt: "2026-09-04T12:00:00.000Z",
          subject: { id: "cand_1" },
          checks: [],
          refusalCode: "DEPENDENCY_UNAVAILABLE",
        },
        decision: "UNVERIFIABLE",
        refusalCode: "DEPENDENCY_UNAVAILABLE",
      })
    );
    const outcome = verifyReceipt(receipt);
    expect(outcome.orionCredentialVerification).toBe("NOT_CLAIMED");
  });

  it("an AUTHORIZE decision with no recorded lease fails the authorization-structure check", async () => {
    const receipt = await buildReceipt(baseInput({ decision: "AUTHORIZE", authorization: undefined }));
    const outcome = verifyReceipt(receipt);
    const authCheck = outcome.checks.find((c) => c.id === "authorization_structure");
    expect(authCheck?.status).toBe("FAIL");
    expect(outcome.integrityOk).toBe(false);
  });
});

// Required tamper vectors — BUILD_CONTRACT.md section 17 / operator
// instruction: "every material mutation should either invalidate the
// receipt or produce the exact documented limitation." Every mutation
// below is applied post-issuance, the same way a malicious actor editing
// a stored/transmitted receipt would, and must be caught by the receipt
// hash recomputation rather than any field-specific check.
describe("receipt verifier tamper vectors", () => {
  async function issuedReceipt() {
    return await buildReceipt(
      baseInput({
        decision: "AUTHORIZE",
        authorization: {
          id: "lease_tamper",
          contextId: "ctx_1",
          candidateId: "cand_1",
          maxAmountAtomic: "100000",
          chainId: 8453,
          credentialResultHash: "0xcred",
          policyHash: "0xabc",
          issuedAt: "2026-09-04T12:00:00.000Z",
          expiresAt: "2026-09-04T12:20:00.000Z",
          nonce: "nonce_tamper",
          revoked: false,
        },
      })
    );
  }

  it.each([
    ["amount", (r: Awaited<ReturnType<typeof issuedReceipt>>) => ({ ...r, authorization: { ...r.authorization!, maxAmountAtomic: "999999999" } })],
    ["target/candidate", (r: Awaited<ReturnType<typeof issuedReceipt>>) => ({ ...r, candidate: { ...r.candidate, id: "cand_other" } })],
    ["policy hash", (r: Awaited<ReturnType<typeof issuedReceipt>>) => ({ ...r, policy: { ...r.policy, policyHash: "0xdifferent" } })],
    [
      "credential-result hash",
      (r: Awaited<ReturnType<typeof issuedReceipt>>) => ({ ...r, authorization: { ...r.authorization!, credentialResultHash: "0xdifferent" } }),
    ],
    ["context", (r: Awaited<ReturnType<typeof issuedReceipt>>) => ({ ...r, request: { ...r.request, contextId: "ctx_other" } })],
    ["settlement data", (r: Awaited<ReturnType<typeof issuedReceipt>>) => ({ ...r, execution: { state: "SUCCEEDED" as const, transactionHash: "0xfake" } })],
    ["evidence mode", (r: Awaited<ReturnType<typeof issuedReceipt>>) => ({ ...r, evidenceMode: "live" as const })],
    ["receipt hash itself", (r: Awaited<ReturnType<typeof issuedReceipt>>) => ({ ...r, receiptHash: "0xforged" })],
  ])("mutating %s is detected, not silently accepted", async (_label, mutate) => {
    const receipt = await issuedReceipt();
    const tampered = mutate(receipt);

    const outcome = verifyReceipt(tampered);
    const hashCheck = outcome.checks.find((c) => c.id === "receipt_hash");

    expect(hashCheck?.status).toBe("FAIL");
    expect(outcome.integrityOk).toBe(false);
  });
});
