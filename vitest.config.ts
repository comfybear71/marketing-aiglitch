import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/**
 * Vitest config. Unit tests live next to source as `*.test.ts`. We test
 * pure modules (nav config, auth cookie helpers) so the default `node`
 * environment is enough — no jsdom needed yet. The `@/` alias mirrors
 * tsconfig so imports resolve the same way in tests and in the app.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
