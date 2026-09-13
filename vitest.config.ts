import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { tsconfigPaths: true } as object,
  test: {
    environment: "node",
  },
});
