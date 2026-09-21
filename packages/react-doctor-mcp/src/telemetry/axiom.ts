import * as Layer from "effect/Layer";
import * as Redacted from "effect/Redacted";
import * as FetchHttpClient from "effect/unstable/http/FetchHttpClient";
import * as OtlpMetrics from "effect/unstable/observability/OtlpMetrics";
import * as OtlpSerialization from "effect/unstable/observability/OtlpSerialization";
import {
  AXIOM_DEFAULT_DOMAIN,
  AXIOM_INGEST_TOKEN,
  AXIOM_METRICS_DATASET,
  AXIOM_METRICS_DATASET_HEADER,
  AXIOM_METRICS_PATH,
  TELEMETRY_EXPORT_INTERVAL_MS,
  TELEMETRY_SERVICE_NAME,
  TELEMETRY_SHUTDOWN_TIMEOUT_MS,
} from "./constants.js";
import { isTelemetryEnabled } from "./is-telemetry-enabled.js";

export interface AxiomTelemetryOptions {
  readonly token: Redacted.Redacted<string>;
  readonly domain: string;
  readonly metricsDataset: string;
  readonly serviceVersion: string;
}

const normalizeDomain = (domain: string): string => {
  let end = domain.length;
  while (end > 0 && domain.charCodeAt(end - 1) === 47) end -= 1;
  return domain.slice(0, end);
};

export const resolveAxiomTelemetryOptions = (): AxiomTelemetryOptions | null => {
  if (!isTelemetryEnabled()) return null;
  const token = process.env.REACT_DOCTOR_AXIOM_TOKEN || AXIOM_INGEST_TOKEN;
  if (!token) return null;
  return {
    token: Redacted.make(token),
    domain: process.env.REACT_DOCTOR_AXIOM_DOMAIN || AXIOM_DEFAULT_DOMAIN,
    metricsDataset: process.env.REACT_DOCTOR_AXIOM_METRICS_DATASET || AXIOM_METRICS_DATASET,
    serviceVersion: process.env.VERSION ?? "0.0.0",
  };
};

export const layerAxiomMetrics = (options: AxiomTelemetryOptions): Layer.Layer<never> =>
  OtlpMetrics.layer({
    url: `${normalizeDomain(options.domain)}${AXIOM_METRICS_PATH}`,
    resource: { serviceName: TELEMETRY_SERVICE_NAME, serviceVersion: options.serviceVersion },
    headers: {
      Authorization: `Bearer ${Redacted.value(options.token)}`,
      [AXIOM_METRICS_DATASET_HEADER]: options.metricsDataset,
    },
    exportInterval: TELEMETRY_EXPORT_INTERVAL_MS,
    shutdownTimeout: TELEMETRY_SHUTDOWN_TIMEOUT_MS,
    temporality: "delta",
  }).pipe(Layer.provide(OtlpSerialization.layerProtobuf), Layer.provide(FetchHttpClient.layer));
