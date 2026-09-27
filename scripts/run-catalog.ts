import { createHash, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import type { CatalogRun } from "../src/lib/types";
import { putCatalogRun } from "../src/server/persistence/catalog-repo";
import { OrionCredentialProvider } from "../src/server/providers/orion-provider";
import { createWorkflow } from "../src/server/workflow/orchestrator";

interface StoreAgent {
  id: number;
  name: string;
  slug: string;
}

function isStoreAgent(value: unknown): value is StoreAgent {
  if (!value || typeof value !== "object") return false;
  const agent = value as Record<string, unknown>;
  return Number.isSafeInteger(agent.id) && typeof agent.name === "string" && typeof agent.slug === "string";
}

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required to freeze the catalog run");
  const base = (process.env.ORION_API_BASE_URL ?? "https://orionagents.org").replace(/\/$/, "");
  const response = await fetch(`${base}/api/agents`, { cache: "no-store", signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new Error(`Orion Store returned HTTP ${response.status}`);
  const raw = await response.text();
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed) || !parsed.every(isStoreAgent)) throw new Error("Malformed Orion Store snapshot");
  const snapshotHash = `sha256:${createHash("sha256").update(raw).digest("hex")}`;
  const runTimestamp = new Date().toISOString();
  const run: CatalogRun = {
    id: `cat_${randomUUID()}`,
    evidenceMode: "live",
    runTimestamp,
    snapshotHash,
    cohortDenominator: parsed.length,
    policy: { network: "Base", maxSpend: "0.1", currency: "USDC", freshAttestationRequired: true,
      walletMatchRequired: true, freshAtDispatchRequired: true },
    softwareCommit: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
    baselineRule: "A current Orion Store listing is discoverable, regardless of AgentBound status.",
    hirewallRule: "A fresh oracle-signed Orion AgentBound attestation and buyer policy must pass before a lease exists.",
    counts: { authorize: 0, refuse: 0, unverifiable: 0 },
    candidates: [],
  };
  await putCatalogRun(run, parsed, raw);
  const provider = new OrionCredentialProvider(base);
  for (const [index, agent] of parsed.entries()) {
    const workflow = await createWorkflow({ task: "Catalog screening: Base agent dispatch", maxSpend: "100000", chainId: 8453,
      workerIdentifier: agent.slug, allowFallback: false, mode: "check" }, provider, "live");
    const decision = workflow.decision ?? "UNVERIFIABLE";
    if (decision === "AUTHORIZE") run.counts.authorize += 1;
    else if (decision === "REFUSE") run.counts.refuse += 1;
    else run.counts.unverifiable += 1;
    run.candidates.push({ candidateId: String(agent.id), name: agent.name, baselineEligible: true,
      decision, refusalCode: workflow.refusalCode,
      attestationFreshnessAtRun: workflow.credentialResult?.expiresAt ?? "unavailable",
      receiptId: workflow.receiptId ?? "unavailable" });
    await putCatalogRun(run, parsed, raw);
    process.stdout.write(`${index + 1}/${parsed.length} ${agent.slug}: ${decision} ${workflow.refusalCode ?? ""}\n`);
  }
  process.stdout.write(`${JSON.stringify({ runId: run.id, snapshotHash, counts: run.counts })}\n`);
}

main().catch((error: unknown) => { console.error(error); process.exitCode = 1; });
