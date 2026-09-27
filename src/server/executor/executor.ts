import { consumeLease, validateLease } from "../authorization/lease-service";
import { executionRepo } from "../persistence/execution-repo";
import type { DispatchRequest, ExecutionResult } from "../types";
import { x402Transport } from "./x402-transport";

// The only module allowed to touch the paid-dispatch signer/wallet. There
// is exactly one public method. It cannot be called without a leaseId,
// and it always revalidates that lease against the lease store itself
// before doing anything else — see BUILD_CONTRACT.md section 3 and
// HIREWALL_PRD.md section 12.8. There is no second method that skips
// validateLease().
//
// Concurrency: before touching the transport, dispatch() atomically
// claims the lease in the durable `executions` table (INSERT with a
// PRIMARY KEY on leaseId — see persistence/execution-repo.ts). Two
// concurrent calls for the same lease race on that single INSERT; only
// one wins. The loser returns REPLAY_REJECTED without ever reaching the
// transport, and without the transport's own idempotency (if any) being
// relied on. src/server/__tests__/persistence-restart.test.ts and
// lease-executor-invariants.test.ts assert this.
export type PaymentTransport = (request: DispatchRequest) => Promise<ExecutionResult>;

export class Executor {
  // Transport is injectable so deterministic local/test scenarios can
  // exercise settlement-state handling (SUCCEEDED/FAILED/UNKNOWN) without
  // a real endpoint. Production wiring (once GATE-001 unblocks) passes
  // the real x402 call here; nothing about validateLease()/the claim/
  // consumeLease() below changes.
  constructor(private readonly transport?: PaymentTransport) {}

  async dispatch(request: DispatchRequest, leaseId: string, now: string): Promise<ExecutionResult> {
    const validation = await validateLease(leaseId, request, now);
    if (!validation.ok) {
      return { state: "NOT_ATTEMPTED", errorCode: validation.failureCode };
    }

    const preparation = this.transport ? undefined : await x402Transport.prepare(request);
    if (preparation && !preparation.ok) return preparation.result;
    if (preparation) {
      const current = await validateLease(leaseId, request, new Date().toISOString());
      if (!current.ok) return { state: "NOT_ATTEMPTED", errorCode: current.failureCode };
    }

    const claimed = await executionRepo.tryClaim(leaseId, now);
    if (!claimed) {
      return { state: "NOT_ATTEMPTED", errorCode: "REPLAY_REJECTED" };
    }

    const consumed = await consumeLease(leaseId, now);
    if (!consumed) {
      // Should be unreachable given the claim above already serializes
      // concurrent attempts, but fail closed rather than assume.
      return { state: "NOT_ATTEMPTED", errorCode: "REPLAY_REJECTED" };
    }

    const result = this.transport ? await this.transport(request) : await x402Transport.execute(preparation!.quote, request);
    await executionRepo.recordResult(leaseId, result);
    return result;
  }
}

export const executor = new Executor();
