import { NextResponse } from "next/server";
import { getReceipt } from "@/server/receipts/receipt-service";
import { mapReceipt } from "@/server/view-mapper";

export async function GET(_request: Request, { params }: { params: Promise<{ receiptId: string }> }) {
  const { receiptId } = await params;
  const receipt = getReceipt(receiptId);

  if (!receipt) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json(mapReceipt(receipt));
}
