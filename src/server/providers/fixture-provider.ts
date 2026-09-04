import { createHash } from "node:crypto";
import type { NormalizedCredentialResult, ResolvedCandidate, VerificationContext } from "../types";
import type { CredentialProvider } from "./provider";

function hash(input: string): string {
  return `0x${createHash("sha256").update(input).digest("hex").slice(0, 40)}`;
}

interface FixtureCandidateInput {
  slug: string;
}

// Deterministic, dev/test-only provider. Every result this returns must be
// consumed as evidenceMode "fixture" by the caller — see
// src/server/workflow/orchestrator.ts, which stamps the workflow record
// rather than trusting the provider to self-report. Never selected by
// default; see src/server/providers/index.ts.
export class FixtureCredentialProvider implements CredentialProvider<FixtureCandidateInput> {
  readonly providerId = "fixture";

  private readonly candidates: Record<string, ResolvedCandidate> = {
    "fixture-valid": {
      id: "fixture-valid",
      slug: "fixture-valid",
      name: "Fixture Courier",
      declaredWallet: "0x1111111111111111111111111111111111111a",
      category: "logistics",
      source: "fixture",
    },
    "fixture-expired": {
      id: "fixture-expired",
      slug: "fixture-expired",
      name: "Fixture Meridian",
      declaredWallet: "0x2222222222222222222222222222222222222b",
      category: "logistics",
      source: "fixture",
    },
    "fixture-wallet-mismatch": {
      id: "fixture-wallet-mismatch",
      slug: "fixture-wallet-mismatch",
      name: "Fixture Sideband",
      declaredWallet: "0x3333333333333333333333333333333333333c",
      category: "research",
      source: "fixture",
    },
    "fixture-unverifiable": {
      id: "fixture-unverifiable",
      slug: "fixture-unverifiable",
      name: "Fixture Waypoint",
      declaredWallet: "0x4444444444444444444444444444444444444d",
      category: "research",
      source: "fixture",
    },
  };

  async resolveCandidate(input: FixtureCandidateInput): Promise<ResolvedCandidate> {
    const candidate = this.candidates[input.slug];
    if (!candidate) {
      throw new Error(`FixtureCredentialProvider: unknown fixture slug "${input.slug}"`);
    }
    return candidate;
  }

  async verifyCandidate(
    candidate: ResolvedCandidate,
    context: VerificationContext
  ): Promise<NormalizedCredentialResult> {
    const checkedAt = context.requestedAt;
    const base = {
      providerId: this.providerId,
      checkedAt,
      subject: { id: candidate.id, wallet: candidate.declaredWallet, chainId: context.chainId },
      rawArtifactHash: hash(`${candidate.id}:${checkedAt}`),
    };

    switch (candidate.id) {
      case "fixture-valid":
        return {
          ...base,
          status: "VERIFIED",
          expiresAt: new Date(Date.parse(checkedAt) + 20 * 60 * 1000).toISOString(),
          checks: [
            { id: "attestation_present", status: "PASS" },
            { id: "signature", status: "PASS" },
            { id: "signer", status: "PASS" },
            { id: "wallet_binding", status: "PASS" },
            { id: "freshness", status: "PASS" },
          ],
        };

      case "fixture-expired":
        return {
          ...base,
          status: "REFUSED",
          expiresAt: new Date(Date.parse(checkedAt) - 4 * 60 * 1000).toISOString(),
          refusalCode: "ATTESTATION_EXPIRED",
          checks: [
            { id: "attestation_present", status: "PASS" },
            { id: "signature", status: "PASS" },
            { id: "signer", status: "PASS" },
            { id: "wallet_binding", status: "PASS" },
            { id: "freshness", status: "FAIL", code: "ATTESTATION_EXPIRED" },
          ],
        };

      case "fixture-wallet-mismatch":
        return {
          ...base,
          status: "REFUSED",
          refusalCode: "WALLET_MISMATCH",
          checks: [
            { id: "attestation_present", status: "PASS" },
            { id: "signature", status: "PASS" },
            { id: "signer", status: "PASS" },
            { id: "wallet_binding", status: "FAIL", code: "WALLET_MISMATCH" },
          ],
        };

      case "fixture-unverifiable":
        return {
          ...base,
          status: "UNVERIFIABLE",
          refusalCode: "DEPENDENCY_UNAVAILABLE",
          checks: [{ id: "attestation_present", status: "UNAVAILABLE", code: "DEPENDENCY_UNAVAILABLE" }],
        };

      default:
        return {
          ...base,
          status: "UNVERIFIABLE",
          refusalCode: "ATTESTATION_MISSING",
          checks: [{ id: "attestation_present", status: "FAIL", code: "ATTESTATION_MISSING" }],
        };
    }
  }
}
