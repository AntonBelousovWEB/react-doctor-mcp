import * as Context from "effect/Context";
import * as Metric from "effect/Metric";
import { isTelemetryEnabled } from "./is-telemetry-enabled.js";

export interface MetricAttributes {
  [attributeName: string]: string | number | boolean | null | undefined;
}

const toAttributeSet = (attributes: MetricAttributes | undefined): Record<string, string> => {
  const stringified: Record<string, string> = {};
  if (attributes === undefined) return stringified;
  for (const [key, value] of Object.entries(attributes)) {
    if (value === null || value === undefined) continue;
    stringified[key] = String(value);
  }
  return stringified;
};

/**
 * Emits a counter into Effect's process-global metric registry, where the OTLP
 * metrics exporter (see `runtime.ts`) picks it up at flush time. A guarded,
 * swallow-on-throw no-op unless telemetry is enabled, so it is inert in tests
 * and for unconfigured processes.
 */
export const recordCount = (name: string, value = 1, attributes?: MetricAttributes): void => {
  if (!isTelemetryEnabled()) return;
  try {
    Metric.counter(name)
      .pipe(Metric.withAttributes(toAttributeSet(attributes)))
      .updateUnsafe(value, Context.empty());
  } catch {}
};
