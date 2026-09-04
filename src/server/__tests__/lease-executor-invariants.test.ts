// Security invariant proof per HIREWALL_PRD.md section 19 and
// BUILD_CONTRACT.md section 11 (gates 4-7, 11-12). Every test here
// exercises the real production lease-service/executor code, not a
// simplified stand-in — this is the point of the deterministic proof
// carve-out in BUILD_CONTRACT.md section 6.
import { describe, expect, it } from "vitest";
import { createLease, validateLease } from "../authorization/lease-service";
import { Executor } from "../executor/executor";
import type { DispatchRequest, ExecutionResult } from "../types";

const NOW = "2026-09-04T12:00:00.000Z";
const LATER = "2026-09-04T12:05:00.000Z";
const MUCH_LATER = "2026-09-04T13:00:00.000Z";

function baseLeaseInput() {
  return {
    contextId: "ctx_test",
    candidateId: "cand_1",
    targetWallet: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    maxAmountAtomic: "100000",
    chainId: 8453,
    credentialResultHash: "0xcred",
    policyHash: "0xpolicy",
    now: NOW,
  };
}

function requestFor(lease: ReturnType<typeof createLease>, overrides: Partial<DispatchRequest> = {}): DispatchRequest {
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

const succeedingTransport = async (): Promise<ExecutionResult> => ({ state: "SUCCEEDED", amountAtomic: "1" });

describe("authorization lease invariants", () => {
  it("a currently-valid lease validates for its exact matching request", () => {
    const lease = createLease(baseLeaseInput());
    const result = validateLease(lease.id, requestFor(lease), LATER);
    expect(result.ok).toBe(true);
  });

  it("no lease exists -> validation fails (AUTHORIZATION_REVOKED)", () => {
    const result = validateLease("lease_does_not_exist", {
      contextId: "ctx_test",
      candidateId: "cand_1",
      amountAtomic: "1",
      chainId: 8453,
      credentialResultHash: "0xcred",
      policyHash: "0xpolicy",
    }, LATER);
    expect(result.ok).toBe(false);
    expect(result.failureCode).toBe("AUTHORIZATION_REVOKED");
  });

  it("expired lease cannot execute", () => {
    const lease = createLease(baseLeaseInput());
    const result = validateLease(lease.id, requestFor(lease), MUCH_LATER);
    expect(result.ok).toBe(false);
    expect(result.failureCode).toBe("AUTHORIZATION_EXPIRED");
  });

  it("revoked lease cannot execute", async () => {
    const lease = createLease(baseLeaseInput());
    const { revokeLease } = await import("../authorization/lease-service");
    revokeLease(lease.id);
    const result = validateLease(lease.id, requestFor(lease), LATER);
    expect(result.ok).toBe(false);
    expect(result.failureCode).toBe("AUTHORIZATION_REVOKED");
  });

  it("wrong target wallet fails WALLET_MISMATCH", () => {
    const lease = createLease(baseLeaseInput());
    const result = validateLease(lease.id, requestFor(lease, { targetWallet: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" }), LATER);
    expect(result.ok).toBe(false);
    expect(result.failureCode).toBe("WALLET_MISMATCH");
  });

  it("wrong context cannot cross workflows", () => {
    const lease = createLease(baseLeaseInput());
    const result = validateLease(lease.id, requestFor(lease, { contextId: "ctx_other_workflow" }), LATER);
    expect(result.ok).toBe(false);
  });

  it("amount over lease cap fails BUDGET_EXCEEDED", () => {
    const lease = createLease(baseLeaseInput());
    const result = validateLease(lease.id, requestFor(lease, { amountAtomic: "999999999" }), LATER);
    expect(result.ok).toBe(false);
    expect(result.failureCode).toBe("BUDGET_EXCEEDED");
  });

  it("altered policy hash fails", () => {
    const lease = createLease(baseLeaseInput());
    const result = validateLease(lease.id, requestFor(lease, { policyHash: "0xdifferent" }), LATER);
    expect(result.ok).toBe(false);
  });

  it("altered credential-result hash fails", () => {
    const lease = createLease(baseLeaseInput());
    const result = validateLease(lease.id, requestFor(lease, { credentialResultHash: "0xdifferent" }), LATER);
    expect(result.ok).toBe(false);
  });
});

describe("executor no-bypass invariant", () => {
  it("executor.dispatch() with a valid lease revalidates and succeeds via transport", async () => {
    const lease = createLease(baseLeaseInput());
    const executor = new Executor(succeedingTransport);
    const result = await executor.dispatch(requestFor(lease), lease.id, LATER);
    expect(result.state).toBe("SUCCEEDED");
  });

  it("executor.dispatch() with an expired lease never reaches the transport", async () => {
    const lease = createLease(baseLeaseInput());
    let transportCalled = false;
    const executor = new Executor(async () => {
      transportCalled = true;
      return { state: "SUCCEEDED" };
    });
    const result = await executor.dispatch(requestFor(lease), lease.id, MUCH_LATER);
    expect(result.state).toBe("NOT_ATTEMPTED");
    expect(result.errorCode).toBe("AUTHORIZATION_EXPIRED");
    expect(transportCalled).toBe(false);
  });

  it("executor.dispatch() cannot be forged around by passing a mismatched request", async () => {
    const lease = createLease(baseLeaseInput());
    const executor = new Executor(succeedingTransport);
    const result = await executor.dispatch(requestFor(lease, { amountAtomic: "999999999" }), lease.id, LATER);
    expect(result.state).toBe("NOT_ATTEMPTED");
    expect(result.errorCode).toBe("BUDGET_EXCEEDED");
  });

  it("duplicate execution of the same lease is rejected (replay protection)", async () => {
    const lease = createLease(baseLeaseInput());
    const executor = new Executor(succeedingTransport);

    const first = await executor.dispatch(requestFor(lease), lease.id, LATER);
    expect(first.state).toBe("SUCCEEDED");

    const second = await executor.dispatch(requestFor(lease), lease.id, LATER);
    expect(second.state).toBe("NOT_ATTEMPTED");
    expect(second.errorCode).toBe("REPLAY_REJECTED");
  });

  it("executor exposes no method that bypasses validateLease", () => {
    const executor = new Executor();
    const publicMethods = Object.getOwnPropertyNames(Executor.prototype).filter((m) => m !== "constructor");
    expect(publicMethods).toEqual(["dispatch"]);
    void executor;
  });
});
