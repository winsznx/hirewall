import { createHash } from "node:crypto";
import { createPublicClient, http, parseAbi } from "viem";
import { base } from "viem/chains";
import type { NormalizedCredentialResult, ResolvedCandidate, VerificationContext } from "../types";
import type { CredentialProvider } from "./provider";
import { ProviderUnavailableError } from "./provider";
import { ORION_AGENTBOUND, ORION_CHAIN_ID, verifyOrionAttestation } from "./orion-attestation";

const ABI = parseAbi([
  "function oracle() view returns (address)",
  "function exists(uint256 agentId) view returns (bool)",
  "function reputationOf(uint256 agentId) view returns (bool minted, bool slashed, uint8 tier, uint32 attestationCount, uint64 attestedAt, int32 roiBps, uint16 winRateBps, uint16 maxDrawdownBps, uint16 uptimeBps, uint16 intelligenceScore, uint16 compositeScore)",
]);

interface OrionAgent {
  id: number;
  name: string;
  slug: string;
  category?: string;
  builderWallet?: string;
}

function isAgent(value: unknown): value is OrionAgent {
  if (!value || typeof value !== "object") return false;
  const agent = value as Record<string, unknown>;
  return Number.isSafeInteger(agent.id) && typeof agent.name === "string" &&
    typeof agent.slug === "string" &&
    (agent.builderWallet === undefined || typeof agent.builderWallet === "string");
}

// Store data identifies the candidate. Only the Base registry and a fresh
// oracle signature can establish the facts needed to grant a lease.
export class OrionCredentialProvider implements CredentialProvider<{ slug?: string; wallet?: string }> {
  readonly providerId = "orion";
  private readonly baseUrl: string;
  private readonly client = createPublicClient({
    chain: base,
    transport: http(process.env.BASE_RPC_URL ?? "https://base-rpc.publicnode.com"),
  });

  constructor(baseUrl = "https://orionagents.org") {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  private async get(path: string): Promise<Response> {
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, { cache: "no-store", signal: AbortSignal.timeout(10_000) });
    } catch (error) {
      throw new ProviderUnavailableError(this.providerId, `Orion request failed: ${String(error)}`);
    }
    if (response.status >= 500) throw new ProviderUnavailableError(this.providerId, `Orion HTTP ${response.status}`);
    return response;
  }

  async matchCandidates(intent: string, category?: string): Promise<ResolvedCandidate[]> {
    const response = await fetch(`${this.baseUrl}/api/agents/match`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ intent: category ? `${intent}\nCategory: ${category}` : intent }),
      cache: "no-store", signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new ProviderUnavailableError(this.providerId, `Store match HTTP ${response.status}`);
    const values: unknown = await response.json();
    if (!Array.isArray(values) || !values.every(isAgent)) {
      throw new ProviderUnavailableError(this.providerId, "Malformed Store match response");
    }
    return values.filter((agent) => !category || agent.category?.toLowerCase() === category.toLowerCase())
      .map((agent) => ({ id: String(agent.id), slug: agent.slug, name: agent.name,
        category: agent.category, declaredWallet: agent.builderWallet,
        listingUrl: `${this.baseUrl}/agent/${encodeURIComponent(agent.slug)}`,
        source: "orion_store" as const }));
  }

  async resolveCandidate(input: { slug?: string; wallet?: string }): Promise<ResolvedCandidate> {
    let value: unknown;
    const wallet = input.wallet ?? (/^0x[0-9a-fA-F]{40}$/.test(input.slug ?? "") ? input.slug : undefined);
    if (wallet) {
      const response = await this.get("/api/agents");
      if (!response.ok) throw new ProviderUnavailableError(this.providerId, `Store HTTP ${response.status}`);
      const agents: unknown = await response.json();
      if (!Array.isArray(agents)) throw new ProviderUnavailableError(this.providerId, "Malformed Store response");
      value = agents.find((agent) => isAgent(agent) && agent.builderWallet?.toLowerCase() === wallet.toLowerCase());
    } else if (input.slug) {
      const path = /^\d+$/.test(input.slug) ? `/api/agents/${encodeURIComponent(input.slug)}`
        : `/api/agents/slug/${encodeURIComponent(input.slug)}`;
      const response = await this.get(path);
      if (response.status === 404) throw new ProviderUnavailableError(this.providerId, "Store candidate not found");
      if (!response.ok) throw new ProviderUnavailableError(this.providerId, `Store HTTP ${response.status}`);
      value = await response.json();
    }
    if (!isAgent(value)) throw new ProviderUnavailableError(this.providerId, "Store candidate unavailable or malformed");
    return { id: String(value.id), slug: value.slug, name: value.name, category: value.category,
      declaredWallet: value.builderWallet, listingUrl: `${this.baseUrl}/agent/${encodeURIComponent(value.slug)}`,
      source: "orion_store" };
  }

  async verifyCandidate(candidate: ResolvedCandidate, context: VerificationContext): Promise<NormalizedCredentialResult> {
    const checkedAt = new Date().toISOString();
    const subject = { id: candidate.id, chainId: ORION_CHAIN_ID };
    const id = Number(candidate.id);
    if (context.chainId !== ORION_CHAIN_ID || !Number.isSafeInteger(id) || id < 0) {
      return { providerId: this.providerId, status: "REFUSED", checkedAt, subject,
        refusalCode: "CHAIN_MISMATCH", checks: [{ id: "chain", status: "FAIL", code: "CHAIN_MISMATCH" }] };
    }

    const [oracle, exists] = await Promise.all([
      this.client.readContract({ address: ORION_AGENTBOUND, abi: ABI, functionName: "oracle" }),
      this.client.readContract({ address: ORION_AGENTBOUND, abi: ABI, functionName: "exists", args: [BigInt(id)] }),
    ]);
    const checks: NormalizedCredentialResult["checks"] = [{ id: "onchain_agentbound", status: exists ? "PASS" : "FAIL",
      code: exists ? undefined : "AGENTBOUND_MISSING" }];
    if (!exists) return { providerId: this.providerId, status: "REFUSED", checkedAt, subject, checks,
      refusalCode: "AGENTBOUND_MISSING", providerReceipt: { registry: ORION_AGENTBOUND, agentId: id, exists } };

    const reputation = await this.client.readContract({ address: ORION_AGENTBOUND, abi: ABI,
      functionName: "reputationOf", args: [BigInt(id)] });
    const [minted, slashed, tier, attestationCount, attestedAt, , , , , , score] = reputation;
    const chainEvidence = { registry: ORION_AGENTBOUND, oracle, agentId: id, minted, slashed,
      tier, attestationCount, attestedAt: attestedAt.toString(), score };
    if (!minted || slashed) return { providerId: this.providerId, status: "REFUSED", checkedAt, subject,
      checks: [...checks, { id: "onchain_reputation", status: "FAIL", code: "POLICY_REJECTED" }],
      refusalCode: "POLICY_REJECTED", providerReceipt: chainEvidence };
    checks.push({ id: "onchain_reputation", status: "PASS" });

    const response = await this.get(`/api/x402/attestation/${id}`);
    if (response.status === 404) return { providerId: this.providerId, status: "UNVERIFIABLE", checkedAt, subject,
      checks: [...checks, { id: "signed_attestation", status: "UNAVAILABLE", code: "ATTESTATION_MISSING" },
        { id: "wallet_binding", status: "UNAVAILABLE", code: "WALLET_MISMATCH" }],
      refusalCode: "ATTESTATION_MISSING", providerReceipt: chainEvidence };
    if (!response.ok) throw new ProviderUnavailableError(this.providerId, `Attestation HTTP ${response.status}`);
    const raw = await response.text();
    const rawArtifactHash = createHash("sha256").update(raw).digest("hex");
    let artifact: unknown;
    try { artifact = JSON.parse(raw); } catch {
      return { providerId: this.providerId, status: "REFUSED", checkedAt, subject, checks,
        rawArtifactHash, refusalCode: "ATTESTATION_MALFORMED" };
    }
    if (!candidate.declaredWallet) return { providerId: this.providerId, status: "UNVERIFIABLE", checkedAt,
      subject, checks, rawArtifactHash, refusalCode: "WALLET_MISMATCH" };
    const verified = await verifyOrionAttestation(artifact, {
      agentId: id, wallet: candidate.declaredWallet, oracle, score, tier,
      now: Math.floor(Date.now() / 1000),
    });
    if (!verified.ok) return { providerId: this.providerId, status: "REFUSED", checkedAt, subject,
      checks: [...checks, { id: "signed_attestation", status: "FAIL", code: verified.code }],
      rawArtifactHash, refusalCode: verified.code, providerReceipt: chainEvidence };
    return { providerId: this.providerId, status: "VERIFIED", checkedAt,
      subject: { ...subject, wallet: verified.attestation.wallet },
      expiresAt: new Date(verified.attestation.expiresAt * 1000).toISOString(),
      checks: [...checks, { id: "signed_attestation", status: "PASS" },
        { id: "wallet_binding", status: "PASS" }, { id: "freshness", status: "PASS" }],
      rawArtifactHash, providerReceipt: { attestation: verified.attestation, chainEvidence } };
  }
}
