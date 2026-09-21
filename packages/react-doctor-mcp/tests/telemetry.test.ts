import * as path from "node:path";
import { describe, expect, it, vi } from "vite-plus/test";

vi.mock("../src/telemetry/record-metric.js", () => ({
  recordCount: vi.fn(),
}));

import { defaultAppConfig } from "../src/config.js";
import { MCP_METRIC } from "../src/telemetry/constants.js";
import { isTelemetryEnabled } from "../src/telemetry/is-telemetry-enabled.js";
import { recordCount } from "../src/telemetry/record-metric.js";
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

describe("telemetry", () => {
  it("is disabled under test", () => {
    expect(isTelemetryEnabled()).toBe(false);
  });

  it("emits scan, cache-hit, and cache-miss counters", async () => {
    const diagnose = vi.fn(async () =>
      buildFakeResult([
        buildFakeDiagnostic({ filePath: path.join(FAKE_ROOT_DIRECTORY, "a.tsx"), rule: "a" }),
      ]),
    );
    const ctx = buildContext(diagnose);
    const recordCountMock = vi.mocked(recordCount);

    await runScan(ctx, { directory: FAKE_ROOT_DIRECTORY });
    await runDiagnostics(ctx, { directory: FAKE_ROOT_DIRECTORY });
    await runDiagnostics(ctx, { directory: path.join(path.sep, "other") });

    expect(recordCountMock).toHaveBeenCalledWith(MCP_METRIC.scan);
    expect(recordCountMock).toHaveBeenCalledWith(MCP_METRIC.diagnosticsCacheHit);
    expect(recordCountMock).toHaveBeenCalledWith(MCP_METRIC.diagnosticsCacheMiss);
  });
});
