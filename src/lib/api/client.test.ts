import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("frontend data mode", () => {
  it("uses the remote API when no fixture flag is set", async () => {
    vi.stubEnv("NEXT_PUBLIC_HIREWALL_USE_FIXTURES", "");
    const { hirewallApi, usingFixtures } = await import("./client");
    const { RemoteHirewallApi } = await import("./remote-api");
    expect(usingFixtures).toBe(false);
    expect(hirewallApi).toBeInstanceOf(RemoteHirewallApi);
  });

  it("rejects fixture mode in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_HIREWALL_USE_FIXTURES", "true");
    await expect(import("./client")).rejects.toThrow("development-only");
  });

  it("does not return a static catalog when the remote API reports no run", async () => {
    const { RemoteHirewallApi } = await import("./remote-api");
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 404 })));
    expect(await new RemoteHirewallApi("https://hirewall.example").getLatestCatalogRun()).toBeNull();
  });

  it("surfaces remote dispatch failure", async () => {
    const { RemoteHirewallApi } = await import("./remote-api");
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 503 })));
    await expect(new RemoteHirewallApi("https://hirewall.example").createDispatch({ mode: "check",
      task: "risk assessment", maxBudget: "0.10", workerIdentifier: "rigel" })).rejects.toThrow("503");
  });
});
