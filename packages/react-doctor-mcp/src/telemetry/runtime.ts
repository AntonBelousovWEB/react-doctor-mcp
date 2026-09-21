import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Layer from "effect/Layer";
import * as Scope from "effect/Scope";
import { layerAxiomMetrics, resolveAxiomTelemetryOptions } from "./axiom.js";

let telemetryScope: Scope.Closeable | null = null;
let isBuilt = false;
let pendingShutdown: Promise<void> | null = null;

export const startTelemetry = (): void => {
  if (isBuilt) return;
  isBuilt = true;
  const options = resolveAxiomTelemetryOptions();
  if (options === null) return;
  try {
    const scope = Scope.makeUnsafe();
    Effect.runSync(
      Layer.buildWithScope(layerAxiomMetrics(options), scope) as Effect.Effect<
        Context.Context<never>
      >,
    );
    telemetryScope = scope;
  } catch {
    telemetryScope = null;
  }
};

export const shutdownTelemetry = async (): Promise<void> => {
  if (pendingShutdown !== null) return pendingShutdown;
  const scope = telemetryScope;
  if (scope === null) return;
  telemetryScope = null;
  pendingShutdown = Effect.runPromise(Scope.close(scope, Exit.void)).catch(() => {});
  return pendingShutdown;
};
