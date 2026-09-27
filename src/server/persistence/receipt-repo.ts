import { getDb } from "./db";
import { neonQuery, isNeonBackend } from "./neon";
import type { HirewallReceipt } from "../receipts/receipt-types";

interface ReceiptRow {
  receiptId: string;
  json: string;
  createdAt: string;
}

export const receiptRepo = {
  async put(receipt: HirewallReceipt): Promise<void> {
    if (isNeonBackend()) {
      await neonQuery(`INSERT INTO hirewall_receipts (id, payload, created_at) VALUES ($1, $2::jsonb, $3)`, [receipt.receiptId, JSON.stringify(receipt), receipt.createdAt]);
      return;
    }
    getDb()
      .prepare(`INSERT INTO receipts (receiptId, json, createdAt) VALUES (?, ?, ?)`)
      .run(receipt.receiptId, JSON.stringify(receipt), receipt.createdAt);
  },

  async get(receiptId: string): Promise<HirewallReceipt | undefined> {
    if (isNeonBackend()) {
      const [row] = await neonQuery(`SELECT payload FROM hirewall_receipts WHERE id = $1`, [receiptId]);
      return row?.payload as HirewallReceipt | undefined;
    }
    const row = getDb().prepare(`SELECT * FROM receipts WHERE receiptId = ?`).get(receiptId) as ReceiptRow | undefined;
    return row ? (JSON.parse(row.json) as HirewallReceipt) : undefined;
  },
};
