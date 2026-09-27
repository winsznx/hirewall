import type { HirewallApi } from "./hirewall-api";
import { FixtureHirewallApi } from "./fixture-api";
import { RemoteHirewallApi } from "./remote-api";

// Fixtures require an explicit local opt-in. A missing environment variable
// must never turn the judge path into a static success scenario.
export const usingFixtures = process.env.NEXT_PUBLIC_HIREWALL_USE_FIXTURES === "true";

if (usingFixtures && process.env.NODE_ENV === "production") {
  throw new Error("Frontend fixtures are development-only. Unset NEXT_PUBLIC_HIREWALL_USE_FIXTURES for production.");
}

const apiUrl = process.env.NEXT_PUBLIC_HIREWALL_API_URL ?? "";

export const hirewallApi: HirewallApi = usingFixtures
  ? new FixtureHirewallApi()
  : new RemoteHirewallApi(apiUrl);
