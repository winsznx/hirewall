import { neon } from "@neondatabase/serverless";

type Row = Record<string, unknown>;

let migration: Promise<void> | undefined;

export function isNeonBackend(): boolean {
  return process.env.NODE_ENV === "production" || process.env.HIREWALL_DB_BACKEND === "neon";
}

function client() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required for production persistence");
  return neon(url);
}

async function migrate(): Promise<void> {
  const sql = client();
  await sql.query(`CREATE TABLE IF NOT EXISTS hirewall_leases (id text PRIMARY KEY, payload jsonb NOT NULL)`);
  await sql.query(`CREATE TABLE IF NOT EXISTS hirewall_consumed_nonces (nonce text PRIMARY KEY, consumed_at text NOT NULL)`);
  await sql.query(`CREATE TABLE IF NOT EXISTS hirewall_executions (lease_id text PRIMARY KEY, claimed_at text NOT NULL, result jsonb)`);
  await sql.query(`CREATE TABLE IF NOT EXISTS hirewall_workflows (id text PRIMARY KEY, payload jsonb NOT NULL, updated_at text NOT NULL)`);
  await sql.query(`CREATE TABLE IF NOT EXISTS hirewall_receipts (id text PRIMARY KEY, payload jsonb NOT NULL, created_at text NOT NULL)`);
  await sql.query(`CREATE TABLE IF NOT EXISTS hirewall_catalog_runs (id text PRIMARY KEY, payload jsonb NOT NULL, snapshot jsonb NOT NULL, created_at text NOT NULL)`);
  await sql.query(`CREATE TABLE IF NOT EXISTS hirewall_schema_migrations (version integer PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`);
  await sql.query(`INSERT INTO hirewall_schema_migrations (version) VALUES (1) ON CONFLICT DO NOTHING`);
}

export async function neonQuery(query: string, params: unknown[] = []): Promise<Row[]> {
  if (!migration) migration = migrate().catch((error: unknown) => {
    migration = undefined;
    throw error;
  });
  await migration;
  const rows = await client().query(query, params);
  return rows as Row[];
}
