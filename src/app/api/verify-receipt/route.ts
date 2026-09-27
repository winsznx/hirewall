import { NextResponse } from "next/server";
import { getReceipt } from "@/server/receipts/receipt-service";
import { verifyReceipt } from "@/server/receipts/verifier";
import { mapVerification } from "@/server/view-mapper";
import type { HirewallReceipt } from "@/server/receipts/receipt-types";

// Recomputes a supplied or public receipt. Never simply reads a stored
// "verified: true" — see src/server/receipts/verifier.ts.
export async function POST(request: Request) {
  const body = await request.json();

  let receipt: HirewallReceipt | undefined;

  if (body.receiptId) {
    receipt = await getReceipt(body.receiptId);
  } else if (body.receiptJson) {
    try {
      receipt = JSON.parse(body.receiptJson) as HirewallReceipt;
    } catch {
      return NextResponse.json({ error: "malformed_receipt_json" }, { status: 400 });
    }
  }

  if (!receipt) {
    return NextResponse.json({ error: "receipt_not_found" }, { status: 404 });
  }

  const outcome = verifyReceipt(receipt);
  return NextResponse.json(mapVerification(receipt.receiptId, outcome));
}
