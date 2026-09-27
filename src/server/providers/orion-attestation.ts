import { recoverMessageAddress, type Address, type Hex } from "viem";
import type { RefusalCode } from "../refusal-codes";

export const ORION_CHAIN_ID = 8453;
export const ORION_AGENTBOUND = "0xb006ca09e390eb3082bb3cb0b43e788ebc6e76a0" as Address;

const TIER_NAMES = ["Slashed", "Bronze", "Silver", "Gold", "Platinum"] as const;

export interface OrionAttestation {
  version: string;
  agentId: number;
  wallet: Address;
  score: number;
  tier: number;
  tierName: string;
  mintStatus: string;
  contract: Address;
  chainId: number;
  tokenId: number;
  issuedAt: number;
  expiresAt: number;
  message: string;
  signature: Hex;
  signer: Address;
}

export function orionAttestationMessage(att: OrionAttestation): string {
  return [
    "Orion AgentBound Reputation Attestation v1",
    `Agent ID: ${att.agentId}`,
    `Wallet: ${att.wallet.toLowerCase()}`,
    `Composite Score: ${att.score}`,
    `Tier: ${att.tier} (${att.tierName})`,
    `Mint Status: ${att.mintStatus}`,
    `Token: eip155:${att.chainId}/erc5192:${att.contract.toLowerCase()}/${att.tokenId}`,
    `Issued At: ${att.issuedAt}`,
    `Expires At: ${att.expiresAt}`,
  ].join("\n");
}

export async function verifyOrionAttestation(
  value: unknown,
  expected: { agentId: number; wallet: string; oracle: Address; score: number; tier: number; now: number }
): Promise<{ ok: true; attestation: OrionAttestation } | { ok: false; code: RefusalCode }> {
  if (!value || typeof value !== "object") return { ok: false, code: "ATTESTATION_MALFORMED" };
  const att = value as Record<string, unknown>;
  const numeric = ["agentId", "score", "tier", "chainId", "tokenId", "issuedAt", "expiresAt"];
  const strings = ["version", "wallet", "tierName", "mintStatus", "contract", "message", "signature", "signer"];
  if (numeric.some((key) => !Number.isSafeInteger(att[key])) || strings.some((key) => typeof att[key] !== "string")) {
    return { ok: false, code: "ATTESTATION_MALFORMED" };
  }
  const typed = att as unknown as OrionAttestation;
  if (typed.version !== "orion-agentbound-attestation-v1" || typed.agentId !== expected.agentId ||
      typed.tokenId !== expected.agentId || typed.mintStatus !== "minted" ||
      typed.tierName !== TIER_NAMES[typed.tier] || typed.score < 0 || typed.score > 10000) {
    return { ok: false, code: "ATTESTATION_MALFORMED" };
  }
  if (typed.chainId !== ORION_CHAIN_ID || typed.contract.toLowerCase() !== ORION_AGENTBOUND) {
    return { ok: false, code: "CHAIN_MISMATCH" };
  }
  if (typed.wallet.toLowerCase() !== expected.wallet.toLowerCase()) {
    return { ok: false, code: "WALLET_MISMATCH" };
  }
  if (typed.expiresAt <= expected.now || typed.issuedAt > expected.now ||
      typed.expiresAt <= typed.issuedAt || typed.expiresAt - typed.issuedAt > 3600) {
    return { ok: false, code: "ATTESTATION_EXPIRED" };
  }
  if (typed.message !== orionAttestationMessage(typed)) return { ok: false, code: "SIGNATURE_INVALID" };
  if (!/^0x[0-9a-fA-F]{130}$/.test(typed.signature)) return { ok: false, code: "SIGNATURE_INVALID" };
  let signer: Address;
  try {
    signer = await recoverMessageAddress({ message: typed.message, signature: typed.signature });
  } catch {
    return { ok: false, code: "SIGNATURE_INVALID" };
  }
  if (signer.toLowerCase() !== expected.oracle.toLowerCase() ||
      typed.signer.toLowerCase() !== expected.oracle.toLowerCase()) {
    return { ok: false, code: "SIGNER_UNTRUSTED" };
  }
  if (typed.score !== expected.score || typed.tier !== expected.tier) {
    return { ok: false, code: "POLICY_REJECTED" };
  }
  return { ok: true, attestation: typed };
}
