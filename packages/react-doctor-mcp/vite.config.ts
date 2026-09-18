import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite-plus";
import { requireTypescriptPlugin } from "../../scripts/require-typescript-plugin.js";

const packageRoot = path.dirname(fileURLToPath(import.meta.url));
const packageJson = JSON.parse(fs.readFileSync(path.join(packageRoot, "package.json"), "utf8")) as {
  version: string;
};

export default defineConfig({
  pack: [
    {
      entry: { index: "./src/index.ts" },
      deps: {
        neverBundle: ["@modelcontextprotocol/sdk", "react-doctor"],
      },
      plugins: [requireTypescriptPlugin()],
      dts: true,
      target: "node20",
      platform: "node",
      fixedExtension: false,
      env: {
        VERSION: packageJson.version,
      },
    },
  ],
  test: {
    testTimeout: 30_000,
  },
});
