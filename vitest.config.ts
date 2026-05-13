import { aliasTs } from "@bemedev/dev-utils/vitest-alias";
import { exclude } from "@bemedev/dev-utils/vitest-exclude";
import { defineConfig } from "vitest/config";
import tsconfig from "./tsconfig.json";

const IS_VSCODE_VITEST_EXTENSION = process.env.VITEST_VSCODE === "true";

export default defineConfig({
  server: {
    host: "0.0.0.0",
  },
  plugins: [
    aliasTs(tsconfig as any),
    exclude({
      ignoreCoverageFiles: ["**/*.test-d.ts", "**/*.built.test.ts"],
      ignoreTestFiles: IS_VSCODE_VITEST_EXTENSION
        ? ["**/*.built.test.ts"]
        : undefined,
    }),
  ],
  test: {
    bail: 100,
    maxConcurrency: 30,
    passWithNoTests: true,
    slowTestThreshold: 3000,
    globals: true,
    logHeapUsage: true,
    typecheck: {
      enabled: true,
      ignoreSourceErrors: false,
    },
    coverage: {
      enabled: true,
      reportsDirectory: ".coverage",
      provider: "v8",
    },
  },
});
