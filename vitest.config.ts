import path from "node:path";
import { defineConfig } from "vitest/config";

// Deterministic fixture/unit tests only — kept separate from any future
// live Orion integration tests per BUILD_CONTRACT.md section 19.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/server/**/*.test.ts"],
    // Each test file gets its own SQLite database via a unique
    // HIREWALL_DB_PATH (see src/server/__tests__/setup.ts) so that tests
    // in different files never share persisted state, while tests within
    // one restart-focused file can deliberately share a file-backed DB to
    // simulate a process restart.
    setupFiles: ["src/server/__tests__/setup.ts"],
    fileParallelism: false,
    // node:sqlite is a newer Node builtin that this vite/vitest version's
    // builtin-module list predates — without this, importing it gets
    // misresolved as the bare package "sqlite" instead of staying an
    // external Node import. Turbopack (next build) doesn't need this;
    // this config only affects the vitest run.
    server: {
      deps: {
        external: [/^node:sqlite$/],
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
