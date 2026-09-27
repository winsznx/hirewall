import { randomUUID } from "node:crypto";
import { hashObject } from "../policy/hash";
import { receiptRepo } from "../persistence/receipt-repo";
import type { HirewallReceipt, ReceiptInputForBuild } from "./receipt-types";

export const VERIFIER_VERSION = "0.1.0";
export const POLICY_VERSION = "0.1.0";

export async function buildReceipt(input: ReceiptInputForBuild): Promise<HirewallReceipt> {
  const createdAt = input.createdAt ?? new Date().toISOString();
  const withoutHash: Omit<HirewallReceipt, "receiptHash"> = {
    schemaVersion: "1.0",
    receiptId: `rcpt_${randomUUID()}`,
    createdAt,
    ...input,
  };
  const receiptHash = hashObject(withoutHash);
  const receipt: HirewallReceipt = { ...withoutHash, receiptHash };
  await receiptRepo.put(receipt);
  return receipt;
}

export function getReceipt(receiptId: string): Promise<HirewallReceipt | undefined> {
  return receiptRepo.get(receiptId);
}
