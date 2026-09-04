import { createHash } from "node:crypto";

// Deterministic canonicalization: sort object keys recursively, then hash
// the resulting JSON. Same input always produces the same hash regardless
// of key insertion order — required so a policy/credential-result hash
// can be independently recomputed by a verifier.
export function canonicalize(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortKeys);
  }
  if (value !== null && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = sortKeys((value as Record<string, unknown>)[key]);
        return acc;
      }, {});
  }
  return value;
}

export function hashObject(value: unknown): string {
  return `0x${createHash("sha256").update(canonicalize(value)).digest("hex")}`;
}
