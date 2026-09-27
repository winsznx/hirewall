import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { createRequire } from "node:module";
import type { DatabaseSync as DatabaseSyncType } from "node:sqlite";

const { DatabaseSync } = createRequire("/package.json")("node:sqlite") as { DatabaseSync: typeof DatabaseSyncType };

// Durable local persistence via Node's built-in synchronous SQLite driver
// (stable in Node 22.5+, no native dependency to install). This is the
// "local durable path" required before any hosted database credential is
// requested — see DECISIONS.md DEC-005 and SETUP.md.
//
// Known limitation, documented rather than hidden: a SQLite file on local
// disk does not survive a serverless deployment's ephemeral filesystem
// across multiple instances. Production deployment on Vercel (or any
// horizontally-scaled host) needs a real hosted database — Postgres via
// the Vercel Marketplace is the natural next step. That swap only
// requires a new implementation of the repository interfaces in this
// directory; nothing above the repository boundary changes.
function resolveDbPath(): string {
  return process.env.HIREWALL_DB_PATH ?? "./.data/hirewall.sqlite";
}

function runMigrations(db: DatabaseSyncType): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS leases (
      id TEXT PRIMARY KEY,
      contextId TEXT NOT NULL,
      candidateId TEXT NOT NULL,
      targetWallet TEXT,
      maxAmountAtomic TEXT NOT NULL,
      chainId INTEGER NOT NULL,
      credentialResultHash TEXT NOT NULL,
      policyHash TEXT NOT NULL,
      issuedAt TEXT NOT NULL,
      expiresAt TEXT NOT NULL,
      nonce TEXT NOT NULL UNIQUE,
      revoked INTEGER NOT NULL DEFAULT 0,
      consumedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS consumed_nonces (
      nonce TEXT PRIMARY KEY,
      consumedAt TEXT NOT NULL
    );

    -- UNIQUE(leaseId) is the atomicity primitive: only one process can
    -- ever successfully claim a given lease for execution. A second
    -- concurrent attempt fails the INSERT rather than racing past a
    -- read-then-write check. See executor.ts and DECISIONS.md DEC-005.
    CREATE TABLE IF NOT EXISTS executions (
      leaseId TEXT PRIMARY KEY,
      claimedAt TEXT NOT NULL,
      resultJson TEXT
    );

    CREATE TABLE IF NOT EXISTS workflows (
      id TEXT PRIMARY KEY,
      json TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS receipts (
      receiptId TEXT PRIMARY KEY,
      json TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );
  `);
}

let singleton: DatabaseSyncType | undefined;
let singletonPath: string | undefined;

export function getDb(): DatabaseSyncType {
  const path = resolveDbPath();
  if (singleton && singletonPath === path) return singleton;

  if (path !== ":memory:") {
    mkdirSync(dirname(path), { recursive: true });
  }

  const db = new DatabaseSync(path);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  runMigrations(db);

  singleton = db;
  singletonPath = path;
  return db;
}

// Closes the current connection and forces the next getDb() call to open
// a fresh one. Used by restart/recovery tests to simulate a real process
// restart against a file-backed database — see
// src/server/__tests__/persistence-restart.test.ts. Has no durability
// effect on a ":memory:" database (that data is genuinely gone, which is
// the honest behavior being tested against).
export function closeDbForRestartTest(): void {
  if (singleton) {
    singleton.close();
    singleton = undefined;
    singletonPath = undefined;
  }
}
