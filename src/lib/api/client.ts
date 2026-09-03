import type { HirewallApi } from "./hirewall-api";
import { FixtureHirewallApi } from "./fixture-api";
import { RemoteHirewallApi } from "./remote-api";

const apiUrl = process.env.NEXT_PUBLIC_HIREWALL_API_URL;

// Single source of truth for which adapter the app runs against.
// Set NEXT_PUBLIC_HIREWALL_API_URL to switch from fixtures to the real backend.
export const usingFixtures = !apiUrl;

export const hirewallApi: HirewallApi = apiUrl
  ? new RemoteHirewallApi(apiUrl)
  : new FixtureHirewallApi();
