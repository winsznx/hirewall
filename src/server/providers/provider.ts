import type { NormalizedCredentialResult, ResolvedCandidate, VerificationContext } from "../types";

// Strict credential-provider boundary. HIREWALL's core modules depend on
// this interface only — never on a provider-specific payload shape.
// See DECISIONS.md DEC-004.
export interface CredentialProvider<CandidateInput = unknown> {
  providerId: string;

  resolveCandidate(input: CandidateInput): Promise<ResolvedCandidate>;

  matchCandidates?(intent: string, category?: string): Promise<ResolvedCandidate[]>;

  verifyCandidate(
    candidate: ResolvedCandidate,
    context: VerificationContext
  ): Promise<NormalizedCredentialResult>;
}

export class ProviderUnavailableError extends Error {
  constructor(
    public readonly providerId: string,
    message: string
  ) {
    super(message);
    this.name = "ProviderUnavailableError";
  }
}
