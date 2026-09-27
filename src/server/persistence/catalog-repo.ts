import type { CatalogRun } from "@/lib/types";
import { neonQuery } from "./neon";

export async function putCatalogRun(run: CatalogRun, snapshot: unknown, rawBody: string): Promise<void> {
  await neonQuery(`INSERT INTO hirewall_catalog_runs (id, payload, snapshot, created_at, raw_body) VALUES ($1, $2::jsonb, $3::jsonb, $4, $5)
    ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload`,
  [run.id, JSON.stringify(run), JSON.stringify(snapshot), run.runTimestamp, rawBody]);
}

export async function getLatestCatalogRun(): Promise<CatalogRun | null> {
  if (!process.env.DATABASE_URL && process.env.NODE_ENV !== "production") return null;
  const [row] = await neonQuery(`SELECT payload FROM hirewall_catalog_runs ORDER BY created_at DESC LIMIT 1`);
  return row ? row.payload as CatalogRun : null;
}

export async function getCatalogSnapshot(id: string): Promise<string | null> {
  if (!process.env.DATABASE_URL && process.env.NODE_ENV !== "production") return null;
  const [row] = await neonQuery(`SELECT raw_body FROM hirewall_catalog_runs WHERE id = $1`, [id]);
  return typeof row?.raw_body === "string" ? row.raw_body : null;
}
