import { describe, expect, it } from "vitest";
import { privateKeyToAccount } from "viem/accounts";
import { ORION_AGENTBOUND, orionAttestationMessage, verifyOrionAttestation, type OrionAttestation } from "../providers/orion-attestation";

const account = privateKeyToAccount(`0x${"01".repeat(32)}`);
const now = 1_800_000_000;

async function signedAttestation(): Promise<OrionAttestation> {
  const base: OrionAttestation = {
    version: "orion-agentbound-attestation-v1",
    agentId: 16,
    wallet: "0x95b24cab4ea9f63e031c207d62fb41853e67122d",
    score: 4700,
    tier: 1,
    tierName: "Bronze",
    mintStatus: "minted",
    contract: ORION_AGENTBOUND,
    chainId: 8453,
    tokenId: 16,
    issuedAt: now - 60,
    expiresAt: now + 3540,
    message: "",
    signature: "0x",
    signer: account.address,
  };
  base.message = orionAttestationMessage(base);
  base.signature = await account.signMessage({ message: base.message });
  return base;
}

describe("Orion EIP-191 credential verification", () => {
  const expected = { agentId: 16, wallet: "0x95b24cab4ea9f63e031c207d62fb41853e67122d",
    oracle: account.address, score: 4700, tier: 1, now };

  it("accepts a correctly bound, fresh, signed message", async () => {
    expect((await verifyOrionAttestation(await signedAttestation(), expected)).ok).toBe(true);
  });

  it("rejects a changed score without a new signature", async () => {
    const att = await signedAttestation();
    att.score = 9000;
    expect((await verifyOrionAttestation(att, { ...expected, score: 9000 })).ok).toBe(false);
  });

  it("rejects wrong wallet, expiry, and wrong oracle", async () => {
    const att = await signedAttestation();
    expect(await verifyOrionAttestation(att, { ...expected, wallet: "0x1111111111111111111111111111111111111111" }))
      .toMatchObject({ ok: false, code: "WALLET_MISMATCH" });
    expect(await verifyOrionAttestation(att, { ...expected, now: now + 3600 }))
      .toMatchObject({ ok: false, code: "ATTESTATION_EXPIRED" });
    expect(await verifyOrionAttestation(att, { ...expected, oracle: "0x1111111111111111111111111111111111111111" }))
      .toMatchObject({ ok: false, code: "SIGNER_UNTRUSTED" });
  });
});
