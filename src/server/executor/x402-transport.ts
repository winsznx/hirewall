import { createHash } from "node:crypto";
import { x402Client, x402HTTPClient, wrapFetchWithPayment } from "@x402/fetch";
import { ExactEvmScheme } from "@x402/evm/exact/client";
import { privateKeyToAccount } from "viem/accounts";
import type { DispatchRequest, ExecutionResult } from "../types";

const BASE_USDC = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";

interface X402Option { scheme: string; network: string; amount: string; asset: string; payTo: string }
interface X402Quote { endpoint: string; option: X402Option }
export type Preparation = { ok: true; quote: X402Quote } | { ok: false; result: ExecutionResult };

function failure(errorCode: ExecutionResult["errorCode"]): Preparation {
  return { ok: false, result: { state: "NOT_ATTEMPTED", errorCode } };
}

export const x402Transport = {
  async prepare(request: DispatchRequest): Promise<Preparation> {
    const endpoint = process.env.HIREWALL_X402_ENDPOINT;
    if (!endpoint) return failure("DEPENDENCY_UNAVAILABLE");
    let url: URL;
    try { url = new URL(endpoint); } catch { return failure("DEPENDENCY_UNAVAILABLE"); }
    if (url.protocol !== "https:" || url.username || url.password) return failure("DEPENDENCY_UNAVAILABLE");
    if (!request.targetWallet || request.chainId !== 8453) return failure("WALLET_MISMATCH");

    let response: Response;
    try { response = await fetch(endpoint, { cache: "no-store", signal: AbortSignal.timeout(15_000) }); }
    catch { return failure("DEPENDENCY_UNAVAILABLE"); }
    if (response.status !== 402) return failure("DEPENDENCY_UNAVAILABLE");
    const header = response.headers.get("payment-required");
    if (!header) return failure("DEPENDENCY_UNAVAILABLE");
    let declaration: unknown;
    try { declaration = JSON.parse(Buffer.from(header, "base64").toString("utf8")); }
    catch { return failure("DEPENDENCY_UNAVAILABLE"); }
    if (!declaration || typeof declaration !== "object") return failure("DEPENDENCY_UNAVAILABLE");
    const accepts = (declaration as { accepts?: unknown }).accepts;
    if (!Array.isArray(accepts)) return failure("DEPENDENCY_UNAVAILABLE");
    const options = accepts.filter((value): value is X402Option =>
      !!value && typeof value === "object" &&
      typeof value.scheme === "string" && typeof value.network === "string" &&
      typeof value.amount === "string" && typeof value.asset === "string" && typeof value.payTo === "string");
    const option = options.find((value) => value.scheme === "exact" && value.network === "eip155:8453" &&
      value.asset.toLowerCase() === BASE_USDC && value.payTo.toLowerCase() === request.targetWallet?.toLowerCase());
    if (!option) return failure("WALLET_MISMATCH");
    if (!/^\d+$/.test(option.amount) || BigInt(option.amount) > BigInt(request.amountAtomic)) return failure("BUDGET_EXCEEDED");
    const key = process.env.HIREWALL_PAYER_PRIVATE_KEY;
    if (!key || !/^0x[0-9a-fA-F]{64}$/.test(key)) return failure("DEPENDENCY_UNAVAILABLE");
    return { ok: true, quote: { endpoint, option } };
  },

  async execute(quote: X402Quote, request: DispatchRequest): Promise<ExecutionResult> {
    const key = process.env.HIREWALL_PAYER_PRIVATE_KEY;
    if (!key || !/^0x[0-9a-fA-F]{64}$/.test(key)) return { state: "NOT_ATTEMPTED", errorCode: "DEPENDENCY_UNAVAILABLE" };
    const account = privateKeyToAccount(key as `0x${string}`);
    const client = new x402Client((_version, accepts) => {
      const selected = accepts.find((value) => value.scheme === quote.option.scheme && value.network === quote.option.network &&
        value.amount === quote.option.amount && value.asset.toLowerCase() === quote.option.asset.toLowerCase() &&
        value.payTo.toLowerCase() === quote.option.payTo.toLowerCase());
      if (!selected) throw new Error("x402 quote changed after lease claim");
      return selected;
    }).register("eip155:8453", new ExactEvmScheme(account));
    const whole = BigInt(request.amountAtomic) / BigInt(1_000_000);
    const fraction = (BigInt(request.amountAtomic) % BigInt(1_000_000)).toString().padStart(6, "0");
    client.setSpendControls({ maxAmountPerPayment: `$${whole}.${fraction}` });
    try {
      const response = await wrapFetchWithPayment(fetch, client)(quote.endpoint, { signal: AbortSignal.timeout(60_000) });
      const parsed = await new x402HTTPClient(client).processResponse(response);
      const settlement = parsed.header;
      if (parsed.paymentStatus !== "settled" || !settlement || !("success" in settlement) || !settlement.success ||
        settlement.network !== "eip155:8453" || !/^0x[0-9a-fA-F]{64}$/.test(settlement.transaction)) {
        return { state: "UNKNOWN", errorCode: "EXECUTION_UNKNOWN", endpoint: quote.endpoint, amountAtomic: quote.option.amount };
      }
      return { state: "SUCCEEDED", amountAtomic: quote.option.amount, transactionHash: settlement.transaction,
        endpoint: quote.endpoint, x402RequestId: response.headers.get("x-request-id") ?? undefined,
        responseHash: createHash("sha256").update(JSON.stringify(parsed.body)).digest("hex") };
    } catch {
      return { state: "UNKNOWN", errorCode: "EXECUTION_UNKNOWN", endpoint: quote.endpoint, amountAtomic: quote.option.amount };
    }
  },
};
