import type { CatalogRun } from "@/lib/types";
import { neonQuery } from "./neon";

export async function putCatalogRun(run: CatalogRun, snapshot: unknown): Promise<void> {
  await neonQuery(`INSERT INTO hirewall_catalog_runs (id, payload, snapshot, created_at) VALUES ($1, $2::jsonb, $3::jsonb, $4)
    ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload`,
  [run.id, JSON.stringify(run), JSON.stringify(snapshot), run.runTimestamp]);
}

export async function getLatestCatalogRun(): Promise<CatalogRun | null> {
  if (!process.env.DATABASE_URL && process.env.NODE_ENV !== "production") return null;
  const [row] = await neonQuery(`SELECT payload FROM hirewall_catalog_runs ORDER BY created_at DESC LIMIT 1`);
  return row ? row.payload as CatalogRun : null;
}

export async function getCatalogSnapshot(id: string): Promise<unknown | null> {
  if (!process.env.DATABASE_URL && process.env.NODE_ENV !== "production") return null;
  const [row] = await neonQuery(`SELECT snapshot FROM hirewall_catalog_runs WHERE id = $1`, [id]);
  return row?.snapshot ?? null;
}
