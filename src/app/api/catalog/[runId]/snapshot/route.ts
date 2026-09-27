import { NextResponse } from "next/server";
import { getCatalogSnapshot } from "@/server/persistence/catalog-repo";

export async function GET(_request: Request, { params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  const snapshot = await getCatalogSnapshot(runId);
  return snapshot ? new Response(snapshot, { headers: { "content-type": "application/json; charset=utf-8" } })
    : NextResponse.json({ error: "not_found" }, { status: 404 });
}
