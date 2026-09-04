import { describe, expect, it } from "vitest";
import { evaluatePolicy } from "../policy/engine";
import { FixtureCredentialProvider } from "../providers/fixture-provider";
import { OrionCredentialProvider } from "../providers/orion-provider";
import { ProviderUnavailableError } from "../providers/provider";
import type { BuyerPolicy, NormalizedCredentialResult } from "../types";

const NOW = "2026-09-04T12:00:00.000Z";

function policy(overrides: Partial<BuyerPolicy> = {}): BuyerPolicy {
  return {
    chainId: 8453,
    maxSpendAtomic: "100000",
    requireValidAttestation: true,
    requireWalletMatch: true,
    requireFreshAtDispatch: true,
    ...overrides,
  };
}

function verifiedCredential(overrides: Partial<NormalizedCredentialResult> = {}): NormalizedCredentialResult {
  return {
    providerId: "fixture",
    status: "VERIFIED",
    checkedAt: NOW,
    subject: { id: "cand_1", wallet: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", chainId: 8453 },
    expiresAt: "2026-09-04T12:30:00.000Z",
    checks: [{ id: "signature", status: "PASS" }],
    ...overrides,
  };
}

describe("deterministic buyer policy (LLM cannot influence this)", () => {
  it("passes for a valid, fresh, wallet-bound credential within budget", () => {
    const result = evaluatePolicy(policy(), verifiedCredential(), "50000", NOW);
    expect(result.ok).toBe(true);
  });

  it("a REFUSED credential can never produce a PASS policy result", () => {
    const refused: NormalizedCredentialResult = { ...verifiedCredential(), status: "REFUSED", refusalCode: "ATTESTATION_EXPIRED" };
    const result = evaluatePolicy(policy(), refused, "50000", NOW);
    expect(result.ok).toBe(false);
    expect(result.failureCode).toBe("ATTESTATION_EXPIRED");
  });

  it("missing wallet on a policy requiring wallet match fails WALLET_MISMATCH", () => {
    const noWallet = verifiedCredential({ subject: { id: "cand_1" } });
    const result = evaluatePolicy(policy(), noWallet, "50000", NOW);
    expect(result.ok).toBe(false);
    expect(result.failureCode).toBe("WALLET_MISMATCH");
  });

  it("stale credential fails ATTESTATION_EXPIRED even if status is VERIFIED", () => {
    const stale = verifiedCredential({ expiresAt: "2026-09-04T11:00:00.000Z" });
    const result = evaluatePolicy(policy(), stale, "50000", NOW);
    expect(result.ok).toBe(false);
    expect(result.failureCode).toBe("ATTESTATION_EXPIRED");
  });

  it("requested amount over policy cap fails BUDGET_EXCEEDED", () => {
    const result = evaluatePolicy(policy({ maxSpendAtomic: "1000" }), verifiedCredential(), "5000", NOW);
    expect(result.ok).toBe(false);
    expect(result.failureCode).toBe("BUDGET_EXCEEDED");
  });

  it("same policy object always hashes identically regardless of key order", () => {
    const a = evaluatePolicy(policy(), verifiedCredential(), "50000", NOW);
    const b = evaluatePolicy(
      { maxSpendAtomic: "100000", chainId: 8453, requireFreshAtDispatch: true, requireValidAttestation: true, requireWalletMatch: true },
      verifiedCredential(),
      "50000",
      NOW
    );
    expect(a.policyHash).toBe(b.policyHash);
  });
});

describe("provider fail-closed behavior", () => {
  it("OrionCredentialProvider always fails closed (never returns a fabricated result)", async () => {
    const provider = new OrionCredentialProvider();
    await expect(provider.resolveCandidate({})).rejects.toThrow(ProviderUnavailableError);
    await expect(
      provider.verifyCandidate({ id: "x", source: "orion_store" }, { contextId: "ctx", chainId: 8453, requestedAt: NOW })
    ).rejects.toThrow(ProviderUnavailableError);
  });

  it("FixtureCredentialProvider never claims VERIFIED for a scenario tagged expired", async () => {
    const provider = new FixtureCredentialProvider();
    const candidate = await provider.resolveCandidate({ slug: "fixture-expired" });
    const result = await provider.verifyCandidate(candidate, { contextId: "ctx", chainId: 8453, requestedAt: NOW });
    expect(result.status).not.toBe("VERIFIED");
    expect(result.refusalCode).toBe("ATTESTATION_EXPIRED");
  });

  it("fixture provider results are never labeled as the orion providerId", async () => {
    const provider = new FixtureCredentialProvider();
    expect(provider.providerId).not.toBe("orion");
  });
});
