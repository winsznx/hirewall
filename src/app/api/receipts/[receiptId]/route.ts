import { NextResponse } from "next/server";
import { getReceipt } from "@/server/receipts/receipt-service";
import { mapReceipt } from "@/server/view-mapper";

// Default response is the frontend view-model shape (what the /receipts
// page renders). ?format=raw returns the full server HirewallReceipt
// (HIREWALL_PRD.md section 12.9 schema, including receiptHash) — this is
// the "public JSON receipt" the CLI verifier (scripts/verify-receipt.ts)
// and any independent third-party verifier consume, per
// BUILD_CONTRACT.md section 17.
export async function GET(request: Request, { params }: { params: Promise<{ receiptId: string }> }) {
  const { receiptId } = await params;
  const receipt = await getReceipt(receiptId);

  if (!receipt) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const format = new URL(request.url).searchParams.get("format");
  if (format === "raw") {
    return NextResponse.json(receipt);
  }

  return NextResponse.json(mapReceipt(receipt));
}
