// Proves the durability claim in DECISIONS.md DEC-005: lease, revocation,
// consumption/replay, execution, and receipt state survive a process
// restart. "Restart" is simulated by closing the current SQLite
// connection and reopening a fresh one against the same file path —
// closeDbForRestartTest() forces the next getDb() call to do exactly
// that. Every module under test is the real production module; nothing
// here is a special test-only code path.
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closeDbForRestartTest } from "../persistence/db";
import { createLease, getLease, revokeLease, validateLease } from "../authorization/lease-service";
import { Executor } from "../executor/executor";
import { buildReceipt, getReceipt } from "../receipts/receipt-service";
import { verifyReceipt } from "../receipts/verifier";
import type { DispatchRequest, ExecutionResult } from "../types";

let dbDir: string;

beforeAll(() => {
  dbDir = mkdtempSync(join(tmpdir(), "hirewall-restart-test-"));
  process.env.HIREWALL_DB_PATH = join(dbDir, "hirewall.sqlite");
});

afterAll(() => {
  closeDbForRestartTest();
  rmSync(dbDir, { recursive: true, force: true });
});

function restart(): void {
  closeDbForRestartTest();
}

const NOW = "2026-09-04T12:00:00.000Z";
const LATER = "2026-09-04T12:05:00.000Z";
const MUCH_LATER = "2026-09-04T13:00:00.000Z";

function leaseInput(overrides: Partial<Parameters<typeof createLease>[0]> = {}) {
  return {
    contextId: "ctx_restart",
    candidateId: "cand_restart",
    targetWallet: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    maxAmountAtomic: "100000",
    chainId: 8453,
    credentialResultHash: "0xcred",
    policyHash: "0xpolicy",
    now: NOW,
    ...overrides,
  };
}

function requestFor(lease: Awaited<ReturnType<typeof createLease>>, overrides: Partial<DispatchRequest> = {}): DispatchRequest {
  return {
    contextId: lease.contextId,
    candidateId: lease.candidateId,
    targetWallet: lease.targetWallet,
    amountAtomic: lease.maxAmountAtomic,
    chainId: lease.chainId,
    credentialResultHash: lease.credentialResultHash,
    policyHash: lease.policyHash,
    ...overrides,
  };
}

describe("persistence survives a simulated process restart", () => {
  it("a valid lease is still valid after restart", async () => {
    const lease = await createLease(leaseInput());
    restart();
    const reread = await getLease(lease.id);
    expect(reread).toBeDefined();
    expect(reread?.id).toBe(lease.id);
    const result = await validateLease(lease.id, requestFor(lease), LATER);
    expect(result.ok).toBe(true);
  });

  it("an already-expired lease remains expired after restart", async () => {
    const lease = await createLease(leaseInput());
    restart();
    const result = await validateLease(lease.id, requestFor(lease), MUCH_LATER);
    expect(result.ok).toBe(false);
    expect(result.failureCode).toBe("AUTHORIZATION_EXPIRED");
  });

  it("a revoked lease remains revoked after restart", async () => {
    const lease = await createLease(leaseInput());
    await revokeLease(lease.id);
    restart();
    const reread = await getLease(lease.id);
    expect(reread?.revoked).toBe(true);
    const result = await validateLease(lease.id, requestFor(lease), LATER);
    expect(result.ok).toBe(false);
    expect(result.failureCode).toBe("AUTHORIZATION_REVOKED");
  });

  it("a consumed single-use authorization cannot be replayed after restart", async () => {
    const lease = await createLease(leaseInput());
    const succeeding = async (): Promise<ExecutionResult> => ({ state: "SUCCEEDED" });
    const executor = new Executor(succeeding);

    const first = await executor.dispatch(requestFor(lease), lease.id, LATER);
    expect(first.state).toBe("SUCCEEDED");

    restart();

    const replay = await executor.dispatch(requestFor(lease), lease.id, LATER);
    expect(replay.state).toBe("NOT_ATTEMPTED");
    expect(replay.errorCode).toBe("REPLAY_REJECTED");
  });

  it("a duplicate execute request cannot create a second execution after restart", async () => {
    const lease = await createLease(leaseInput());
    let transportCalls = 0;
    const counting = async (): Promise<ExecutionResult> => {
      transportCalls += 1;
      return { state: "SUCCEEDED" };
    };
    const executor = new Executor(counting);

    await executor.dispatch(requestFor(lease), lease.id, LATER);
    restart();
    await executor.dispatch(requestFor(lease), lease.id, LATER);
    restart();
    await executor.dispatch(requestFor(lease), lease.id, LATER);

    expect(transportCalls).toBe(1);
  });

  it("a receipt remains retrievable and independently verifiable after restart", async () => {
    const receipt = await buildReceipt({
      evidenceMode: "fixture",
      request: { contextId: "ctx_restart", maxSpendAtomic: "100000", chainId: 8453 },
      candidate: { id: "cand_restart", source: "fixture" },
      provider: { providerId: "fixture" },
      verification: {
        providerId: "fixture",
        status: "VERIFIED",
        checkedAt: NOW,
        subject: { id: "cand_restart" },
        checks: [{ id: "signature", status: "PASS" }],
      },
      policy: { policyHash: "0xabc", policyLevel: "REPUTATION_REQUIRED", result: "PASS" },
      decision: "AUTHORIZE",
      authorization: {
        id: "lease_restart_receipt",
        contextId: "ctx_restart",
        candidateId: "cand_restart",
        maxAmountAtomic: "100000",
        chainId: 8453,
        credentialResultHash: "0xcred",
        policyHash: "0xabc",
        issuedAt: NOW,
        expiresAt: LATER,
        nonce: "nonce_restart_receipt",
        revoked: false,
      },
      execution: { state: "NOT_ATTEMPTED" },
      software: { commit: "test", verifierVersion: "0.1.0", policyVersion: "0.1.0" },
    });

    restart();

    const reread = await getReceipt(receipt.receiptId);
    expect(reread).toBeDefined();
    expect(reread?.receiptHash).toBe(receipt.receiptHash);

    const outcome = verifyReceipt(reread!);
    expect(outcome.integrityOk).toBe(true);
  });

  it("an EXECUTION_UNKNOWN result is persisted as-is and is never silently retried into a second attempt", async () => {
    const lease = await createLease(leaseInput());
    let transportCalls = 0;
    const ambiguous = async (): Promise<ExecutionResult> => {
      transportCalls += 1;
      return { state: "UNKNOWN", errorCode: "EXECUTION_UNKNOWN" };
    };
    const executor = new Executor(ambiguous);

    const first = await executor.dispatch(requestFor(lease), lease.id, LATER);
    expect(first.state).toBe("UNKNOWN");

    restart();

    // The lease is already consumed (single-use), so a naive retry
    // attempt after restart must still be rejected rather than blindly
    // re-attempting payment for an uncertain prior outcome.
    const retryAttempt = await executor.dispatch(requestFor(lease), lease.id, LATER);
    expect(retryAttempt.state).toBe("NOT_ATTEMPTED");
    expect(transportCalls).toBe(1);
  });

  it("fixture evidence mode survives persistence and is never upgraded to live on reread", async () => {
    const receipt = await buildReceipt({
      evidenceMode: "fault_injection",
      request: { contextId: "ctx_fault", maxSpendAtomic: "1", chainId: 8453 },
      candidate: { id: "cand_fault", source: "fixture" },
      provider: { providerId: "fixture" },
      verification: {
        providerId: "fixture",
        status: "REFUSED",
        checkedAt: NOW,
        subject: { id: "cand_fault" },
        checks: [],
        refusalCode: "SIGNATURE_INVALID",
      },
      policy: { policyHash: "0xabc", policyLevel: "REPUTATION_REQUIRED", result: "FAIL", failureCode: "SIGNATURE_INVALID" },
      decision: "REFUSE",
      refusalCode: "SIGNATURE_INVALID",
      execution: { state: "NOT_ATTEMPTED" },
      faultInjection: { faultId: "tamper_signature", mutation: "one byte flipped", sourceFixtureHash: "0xsrc" },
      software: { commit: "test", verifierVersion: "0.1.0", policyVersion: "0.1.0" },
    });

    restart();

    const reread = await getReceipt(receipt.receiptId);
    expect(reread?.evidenceMode).toBe("fault_injection");
  });
});
