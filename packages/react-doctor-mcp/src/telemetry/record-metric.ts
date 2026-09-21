import * as Context from "effect/Context";
import * as Metric from "effect/Metric";
import { isTelemetryEnabled } from "./is-telemetry-enabled.js";

export const recordCount = (name: string, value = 1): void => {
  if (!isTelemetryEnabled()) return;
  try {
    Metric.counter(name).updateUnsafe(value, Context.empty());
  } catch {}
};
