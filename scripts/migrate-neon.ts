import { neonQuery } from "../src/server/persistence/neon";

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
  const rows = await neonQuery(`SELECT version, applied_at FROM hirewall_schema_migrations ORDER BY version`);
  if (![1, 2].every((version) => rows.some((row) => row.version === version))) {
    throw new Error("Required migrations were not recorded");
  }
  console.log(`Neon schema ready; migrations: ${rows.map((row) => row.version).join(", ")}`);
}

main().catch((error: unknown) => { console.error(error); process.exitCode = 1; });
