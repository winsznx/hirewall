import type { RefusalCode } from "../refusal-codes";
import { consumeLease, validateLease } from "../authorization/lease-service";
import type { DispatchRequest, ExecutionResult } from "../types";

// The only module allowed to touch the paid-dispatch signer/wallet. There
// is exactly one public method. It cannot be called without a leaseId,
// and it always revalidates that lease against the lease store itself
// before doing anything else — see BUILD_CONTRACT.md section 3 and
// HIREWALL_PRD.md section 12.8. There is no second method that skips
// validateLease(); src/server/__tests__/executor.test.ts asserts this.
export type PaymentTransport = (request: DispatchRequest) => Promise<ExecutionResult>;

export class Executor {
  // Transport is injectable so deterministic local/test scenarios can
  // exercise settlement-state handling (SUCCEEDED/FAILED/UNKNOWN) without
  // a real endpoint. Production wiring (once GATE-001 unblocks) passes
  // the real x402 call here; nothing about validateLease()/consumeLease()
  // below changes.
  constructor(private readonly transport: PaymentTransport = defaultUnavailableTransport) {}

  async dispatch(request: DispatchRequest, leaseId: string, now: string): Promise<ExecutionResult> {
    const validation = validateLease(leaseId, request, now);
    if (!validation.ok) {
      return { state: "NOT_ATTEMPTED", errorCode: validation.failureCode };
    }

    consumeLease(leaseId, now);

    return this.transport(request);
  }
}

// x402 payment transport. Real endpoint not wired yet — Orion's x402
// surface is blocked behind GATE-001 (see GATES.md). Default behavior
// fails closed and honestly rather than simulating success. Its output
// is never reported as live Orion volume — see BUILD_CONTRACT.md section 5.
async function defaultUnavailableTransport(request: DispatchRequest): Promise<ExecutionResult> {
  void request;
  return {
    state: "NOT_ATTEMPTED",
    errorCode: "DEPENDENCY_UNAVAILABLE" as RefusalCode,
  };
}

export const executor = new Executor();
