import path from "node:path";
import { defineConfig } from "vitest/config";

// Deterministic fixture/unit tests only — kept separate from any future
// live Orion integration tests per BUILD_CONTRACT.md section 19.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/server/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
