import type { EvidenceMode } from "../refusal-codes";
import { FixtureCredentialProvider } from "./fixture-provider";
import { OrionCredentialProvider } from "./orion-provider";
import type { CredentialProvider } from "./provider";

// Explicit, server-side-only provider selection. Default is "orion" —
// i.e. the honest fail-closed UNVERIFIABLE state — so a deployment never
// silently serves fixture data as if it were live just because Orion is
// down. Only an explicit HIREWALL_PROVIDER=fixture opt-in (local dev)
// selects the fixture provider. See DECISIONS.md DEC-004.
export function selectProvider(): { provider: CredentialProvider<never>; evidenceMode: EvidenceMode } {
  const configured = process.env.HIREWALL_PROVIDER;

  if (configured === "fixture") {
    if (process.env.NODE_ENV === "production") {
      throw new Error("HIREWALL_PROVIDER=fixture is development-only; production dispatch must fail closed.");
    }
    return {
      provider: new FixtureCredentialProvider() as unknown as CredentialProvider<never>,
      evidenceMode: "fixture",
    };
  }

  return {
    provider: new OrionCredentialProvider(process.env.ORION_API_BASE_URL) as unknown as CredentialProvider<never>,
    evidenceMode: "live",
  };
}

export { FixtureCredentialProvider } from "./fixture-provider";
export { OrionCredentialProvider } from "./orion-provider";
export type { CredentialProvider } from "./provider";
export { ProviderUnavailableError } from "./provider";
