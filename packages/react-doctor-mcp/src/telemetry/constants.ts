export const TELEMETRY_SERVICE_NAME = "react-doctor-mcp";
export const AXIOM_DEFAULT_DOMAIN = "https://api.axiom.co";
export const AXIOM_METRICS_PATH = "/v1/metrics";
export const AXIOM_METRICS_DATASET_HEADER = "x-axiom-metrics-dataset";
export const AXIOM_METRICS_DATASET = "react-doctor-metrics";
// Shared with the CLI (packages/react-doctor/src/cli/utils/constants.ts)
export const AXIOM_INGEST_TOKEN = "xaat-31b59107-855d-4917-8fab-6dc29fb459ce";
export const TELEMETRY_EXPORT_INTERVAL_MS = 600_000;
export const TELEMETRY_SHUTDOWN_TIMEOUT_MS = 1_000;

export const MCP_METRIC = {
  scan: "mcp.scan",
  diagnosticsCacheHit: "mcp.diagnostics.cacheHit",
  diagnosticsCacheMiss: "mcp.diagnostics.cacheMiss",
} as const;
