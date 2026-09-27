import { NextResponse } from "next/server";
import { getLatestCatalogRun } from "@/server/persistence/catalog-repo";

export async function GET() {
  const run = await getLatestCatalogRun();
  return run ? NextResponse.json(run) : NextResponse.json({ error: "not_found" }, { status: 404 });
}
