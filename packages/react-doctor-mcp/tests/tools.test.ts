import * as path from "node:path";
import { describe, expect, it, vi } from "vite-plus/test";
import { defaultAppConfig } from "../src/config.js";
import { runDiagnostics } from "../src/tools/diagnostics.js";
import { runScan } from "../src/tools/scan.js";
import type { AppContext } from "../src/tools/contracts.js";
import { createScanCache } from "../src/utils/scan-cache.js";
import { buildFakeDiagnostic, buildFakeResult, FAKE_ROOT_DIRECTORY } from "./helpers.js";

const buildContext = (diagnose: AppContext["diagnose"]): AppContext => ({
  config: defaultAppConfig,
  diagnose,
  cache: createScanCache(),
});

describe("runScan + runDiagnostics", () => {
  it("serves diagnostics from the cached scan instead of rescanning", async () => {
    const diagnose = vi.fn(async () =>
      buildFakeResult([
        buildFakeDiagnostic({
          filePath: path.join(FAKE_ROOT_DIRECTORY, "src", "App.tsx"),
          rule: "no-array-index-key",
          severity: "error",
          category: "accessibility",
        }),
      ]),
    );
    const ctx = buildContext(diagnose);

    const summary = await runScan(ctx, { directory: FAKE_ROOT_DIRECTORY });
    expect(summary).toMatchObject({ ok: true, errors: 1 });

    const detail = await runDiagnostics(ctx, { directory: FAKE_ROOT_DIRECTORY, severity: "error" });
    expect(detail).toMatchObject({ ok: true, total: 1, returned: 1 });

    expect(diagnose).toHaveBeenCalledTimes(1);
  });

  it("rescans when diagnostics is called before any scan", async () => {
    const diagnose = vi.fn(async () => buildFakeResult([]));
    const ctx = buildContext(diagnose);

    await runDiagnostics(ctx, { directory: FAKE_ROOT_DIRECTORY });

    expect(diagnose).toHaveBeenCalledTimes(1);
  });

  it("clamps the diagnostics limit into the configured range", async () => {
    const diagnose = vi.fn(async () =>
      buildFakeResult([
        buildFakeDiagnostic({ filePath: path.join(FAKE_ROOT_DIRECTORY, "a.tsx"), rule: "a" }),
        buildFakeDiagnostic({ filePath: path.join(FAKE_ROOT_DIRECTORY, "b.tsx"), rule: "b" }),
        buildFakeDiagnostic({ filePath: path.join(FAKE_ROOT_DIRECTORY, "c.tsx"), rule: "c" }),
      ]),
    );
    const ctx = buildContext(diagnose);

    const detail = await runDiagnostics(ctx, { directory: FAKE_ROOT_DIRECTORY, limit: 9999 });

    expect(detail).toMatchObject({ total: 3, returned: 3, truncated: false });
  });
});

describe("createScanCache", () => {
  it("evicts the least recently used entry beyond capacity", () => {
    const cache = createScanCache(2);
    const result = buildFakeResult([]);

    cache.set("/a", { result });
    cache.set("/b", { result });
    cache.get("/a");
    cache.set("/c", { result });

    expect(cache.get("/b")).toBeUndefined();
    expect(cache.get("/a")).toBeDefined();
    expect(cache.get("/c")).toBeDefined();
  });
});
