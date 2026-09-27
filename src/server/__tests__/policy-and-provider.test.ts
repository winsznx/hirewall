import { describe, expect, it } from "vitest";
import { evaluatePolicy, policyHash } from "../policy/engine";
import { FixtureCredentialProvider } from "../providers/fixture-provider";
import { OrionCredentialProvider } from "../providers/orion-provider";
import { ProviderUnavailableError } from "../providers/provider";
import type { BuyerPolicy, NormalizedCredentialResult } from "../types";

const NOW = "2026-09-04T12:00:00.000Z";

function policy(overrides: Partial<BuyerPolicy> = {}): BuyerPolicy {
  return {
    chainId: 8453,
    maxSpendAtomic: "100000",
    policyLevel: "REPUTATION_REQUIRED",
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
      { maxSpendAtomic: "100000", chainId: 8453, requireFreshAtDispatch: true, policyLevel: "REPUTATION_REQUIRED", requireWalletMatch: true },
      verifiedCredential(),
      "50000",
      NOW
    );
    expect(a.policyHash).toBe(b.policyHash);
  });
});

describe("provider fail-closed behavior", () => {
  it("OrionCredentialProvider rejects missing candidates and invalid chain context", async () => {
    const provider = new OrionCredentialProvider();
    await expect(provider.resolveCandidate({})).rejects.toThrow(ProviderUnavailableError);
    const result = await provider.verifyCandidate(
      { id: "x", source: "orion_store" }, { contextId: "ctx", chainId: 8453, requestedAt: NOW }
    );
    expect(result.status).toBe("REFUSED");
    expect(result.refusalCode).toBe("CHAIN_MISMATCH");
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

// Matches OrionCredentialProvider.verifyCandidate()'s real UNVERIFIABLE
// shape when onchain AgentBound identity checks pass but the signed
// reputation attestation 404s — see orion-provider.ts.
function identityOnlyCredential(): NormalizedCredentialResult {
  return {
    providerId: "orion",
    status: "UNVERIFIABLE",
    checkedAt: NOW,
    subject: { id: "16", chainId: 8453 },
    refusalCode: "ATTESTATION_MISSING",
    checks: [
      { id: "onchain_agentbound", status: "PASS" },
      { id: "onchain_reputation", status: "PASS" },
      { id: "signed_attestation", status: "UNAVAILABLE", code: "ATTESTATION_MISSING" },
      { id: "wallet_binding", status: "UNAVAILABLE", code: "WALLET_MISMATCH" },
    ],
  };
}

describe("policy level separation (DECISIONS.md DEC-006)", () => {
  it("IDENTITY_REQUIRED authorizes on onchain identity alone, with no signed credential", () => {
    const result = evaluatePolicy(policy({ policyLevel: "IDENTITY_REQUIRED" }), identityOnlyCredential(), "50000", NOW);
    expect(result.ok).toBe(true);
  });

  it("REPUTATION_REQUIRED refuses the exact same identity-only credential as UNVERIFIABLE", () => {
    const result = evaluatePolicy(policy({ policyLevel: "REPUTATION_REQUIRED" }), identityOnlyCredential(), "50000", NOW);
    expect(result.ok).toBe(false);
    expect(result.failureCode).toBe("ATTESTATION_MISSING");
  });

  it("IDENTITY_REQUIRED still refuses when onchain AgentBound identity itself fails", () => {
    const noIdentity: NormalizedCredentialResult = {
      providerId: "orion",
      status: "REFUSED",
      checkedAt: NOW,
      subject: { id: "999", chainId: 8453 },
      refusalCode: "AGENTBOUND_MISSING",
      checks: [{ id: "onchain_agentbound", status: "FAIL", code: "AGENTBOUND_MISSING" }],
    };
    const result = evaluatePolicy(policy({ policyLevel: "IDENTITY_REQUIRED" }), noIdentity, "50000", NOW);
    expect(result.ok).toBe(false);
    expect(result.failureCode).toBe("AGENTBOUND_MISSING");
  });

  it("IDENTITY_REQUIRED still enforces the budget cap", () => {
    const result = evaluatePolicy(
      policy({ policyLevel: "IDENTITY_REQUIRED", maxSpendAtomic: "1000" }),
      identityOnlyCredential(),
      "5000",
      NOW
    );
    expect(result.ok).toBe(false);
    expect(result.failureCode).toBe("BUDGET_EXCEEDED");
  });

  it("a fully VERIFIED credential passes under both policy levels", () => {
    const identity = evaluatePolicy(policy({ policyLevel: "IDENTITY_REQUIRED" }), verifiedCredential(), "50000", NOW);
    const reputation = evaluatePolicy(policy({ policyLevel: "REPUTATION_REQUIRED" }), verifiedCredential(), "50000", NOW);
    expect(identity.ok).toBe(true);
    expect(reputation.ok).toBe(true);
  });

  it("IDENTITY_REQUIRED and REPUTATION_REQUIRED policies hash differently", () => {
    const a = policyHash(policy({ policyLevel: "IDENTITY_REQUIRED" }));
    const b = policyHash(policy({ policyLevel: "REPUTATION_REQUIRED" }));
    expect(a).not.toBe(b);
  });
});
