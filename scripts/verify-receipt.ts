#!/usr/bin/env -S npx tsx
// Offline receipt verifier CLI. Per BUILD_CONTRACT.md section 17: recomputes
// HIREWALL-owned claims from the receipt artifact and never requires the
// LLM, a funded wallet, private developer state, or the application
// database to trust its own stored result — it accepts a receipt from a
// file, a URL, or stdin, and calls the exact same verifyReceipt() function
// the /api/verify-receipt route uses. There is no separate CLI-only
// verification logic to drift out of sync.
import { readFileSync } from "node:fs";
import { verifyReceipt } from "../src/server/receipts/verifier";
import type { HirewallReceipt } from "../src/server/receipts/receipt-types";

async function readReceipt(source: string): Promise<HirewallReceipt> {
  if (source === "-") {
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  }
  if (source.startsWith("http://") || source.startsWith("https://")) {
    const res = await fetch(source);
    if (!res.ok) throw new Error(`fetch ${source} failed: ${res.status}`);
    return res.json();
  }
  return JSON.parse(readFileSync(source, "utf8"));
}

function statusLabel(status: "PASS" | "FAIL" | "NOT_CLAIMED"): string {
  return status === "PASS" ? "PASS" : status === "FAIL" ? "FAIL" : "NOT CLAIMED";
}

function pad(label: string, width: number): string {
  return label.length >= width ? label : label + " ".repeat(width - label.length);
}

async function main(): Promise<void> {
  const source = process.argv[2];
  if (!source) {
    console.error("Usage: npm run verify:receipt -- <path|url|-> ");
    console.error("  path|url  a receipt JSON file, an https:// receipt URL, or - for stdin");
    process.exitCode = 2;
    return;
  }

  let receipt: HirewallReceipt;
  try {
    receipt = await readReceipt(source);
  } catch (err) {
    console.error(`Could not read/parse receipt: ${err instanceof Error ? err.message : String(err)}`);
    process.exitCode = 2;
    return;
  }

  const outcome = verifyReceipt(receipt);

  console.log(`Receipt        ${receipt.receiptId}`);
  console.log(`Evidence mode  ${outcome.evidenceMode.toUpperCase()}`);
  console.log(`Decision       ${outcome.decision}`);
  console.log("");

  const labelWidth = Math.max(...outcome.checks.map((c) => c.label.length)) + 2;
  for (const check of outcome.checks) {
    console.log(`${pad(check.label, labelWidth)}${statusLabel(check.status)}`);
    if (check.detail) console.log(`${" ".repeat(labelWidth)}${check.detail}`);
  }

  console.log("");
  console.log(`Receipt integrity              ${outcome.integrityOk ? "PASS" : "FAIL"}`);
  console.log(`Orion credential verification  ${outcome.orionCredentialVerification === "NOT_CLAIMED" ? "NOT CLAIMED" : outcome.orionCredentialVerification}`);

  process.exitCode = outcome.integrityOk ? 0 : 1;
}

main().catch((err) => {
  console.error(err instanceof Error ? err.stack ?? err.message : String(err));
  process.exitCode = 2;
});
