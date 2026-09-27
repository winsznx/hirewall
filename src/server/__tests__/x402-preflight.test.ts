import { afterEach, describe, expect, it, vi } from "vitest";
import { x402Transport } from "../executor/x402-transport";
import type { DispatchRequest } from "../types";

const payTo = "0x1111111111111111111111111111111111111111";
const endpoint = "https://seller.example/api/work";
const request: DispatchRequest = { contextId: "ctx", candidateId: "16", targetWallet: payTo,
  amountAtomic: "100000", chainId: 8453, credentialResultHash: "hash", policyHash: "policy" };
const previousEndpoint = process.env.HIREWALL_X402_ENDPOINT;
const previousKey = process.env.HIREWALL_PAYER_PRIVATE_KEY;

afterEach(() => {
  vi.unstubAllGlobals();
  if (previousEndpoint === undefined) delete process.env.HIREWALL_X402_ENDPOINT;
  else process.env.HIREWALL_X402_ENDPOINT = previousEndpoint;
  if (previousKey === undefined) delete process.env.HIREWALL_PAYER_PRIVATE_KEY;
  else process.env.HIREWALL_PAYER_PRIVATE_KEY = previousKey;
});

function quote(amount = "30000", wallet = payTo): void {
  const paymentRequired = { x402Version: 2, accepts: [{ scheme: "exact", network: "eip155:8453",
    amount, asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", payTo: wallet }] };
  vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 402,
    headers: { "payment-required": Buffer.from(JSON.stringify(paymentRequired)).toString("base64") } })));
  process.env.HIREWALL_X402_ENDPOINT = endpoint;
  process.env.HIREWALL_PAYER_PRIVATE_KEY = `0x${"11".repeat(32)}`;
}

describe("x402 payment preflight", () => {
  it("accepts a Base USDC quote bound to the authorized wallet and budget", async () => {
    quote();
    const result = await x402Transport.prepare(request);
    expect(result).toMatchObject({ ok: true, quote: { option: { amount: "30000", payTo } } });
  });

  it("rejects a quote paying a different wallet before a lease is consumed", async () => {
    quote("30000", "0x2222222222222222222222222222222222222222");
    expect(await x402Transport.prepare(request)).toMatchObject({ ok: false, result: { errorCode: "WALLET_MISMATCH" } });
  });

  it("rejects a quote above the lease budget before a lease is consumed", async () => {
    quote("100001");
    expect(await x402Transport.prepare(request)).toMatchObject({ ok: false, result: { errorCode: "BUDGET_EXCEEDED" } });
  });

  it("requires a configured payer before any signing attempt", async () => {
    quote();
    delete process.env.HIREWALL_PAYER_PRIVATE_KEY;
    expect(await x402Transport.prepare(request)).toMatchObject({ ok: false, result: { errorCode: "DEPENDENCY_UNAVAILABLE" } });
  });
});
