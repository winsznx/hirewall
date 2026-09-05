import { getDb } from "./db";
import type { HirewallReceipt } from "../receipts/receipt-types";

interface ReceiptRow {
  receiptId: string;
  json: string;
  createdAt: string;
}

export const receiptRepo = {
  put(receipt: HirewallReceipt): void {
    getDb()
      .prepare(`INSERT INTO receipts (receiptId, json, createdAt) VALUES (?, ?, ?)`)
      .run(receipt.receiptId, JSON.stringify(receipt), receipt.createdAt);
  },

  get(receiptId: string): HirewallReceipt | undefined {
    const row = getDb().prepare(`SELECT * FROM receipts WHERE receiptId = ?`).get(receiptId) as ReceiptRow | undefined;
    return row ? (JSON.parse(row.json) as HirewallReceipt) : undefined;
  },
};
