import type { NormalizedCredentialResult, ResolvedCandidate, VerificationContext } from "../types";
import type { CredentialProvider } from "./provider";
import { ProviderUnavailableError } from "./provider";

// The real Orion integration seam. Deliberately a shell — see GATES.md
// GATE-001 (status: FAIL, direct-probe retest 2026-09-04) and
// DECISIONS.md DEC-004.
//
// Every primary-source URL supplied for this integration
// (orionagents.org, /store, /concierge, /docs, /docs/x402, and the
// claimed GET /api/x402/attestation/{id} route) currently returns an
// identical "app isn't live yet" placeholder on direct HTTP request. This
// class therefore encodes NO guessed endpoint, attestation schema, signer
// identity, signature format, TTL, or on-chain contract address. Doing so
// would violate BUILD_CONTRACT.md section 6 (no silent fallback) and
// section 5 (evidence honesty).
//
// TODO(GATE-001): once a confirmed-live Orion surface is available, wire
// resolveCandidate() to the real Store/listing lookup and verifyCandidate()
// to the real attestation fetch + local signature/schema verification.
// Re-run GATE-001 before touching this file.
export class OrionCredentialProvider implements CredentialProvider<{ slug?: string; wallet?: string }> {
  readonly providerId = "orion";

  constructor(private readonly baseUrl?: string) {}

  async resolveCandidate(_input: { slug?: string; wallet?: string }): Promise<ResolvedCandidate> {
    throw new ProviderUnavailableError(
      this.providerId,
      "ORION_PROVIDER_UNAVAILABLE: no confirmed-live Orion candidate resolution surface is configured. See GATES.md GATE-001."
    );
  }

  async verifyCandidate(
    _candidate: ResolvedCandidate,
    _context: VerificationContext
  ): Promise<NormalizedCredentialResult> {
    throw new ProviderUnavailableError(
      this.providerId,
      "ORION_PROVIDER_UNAVAILABLE: no confirmed-live Orion attestation surface is configured. See GATES.md GATE-001."
    );
  }
}
