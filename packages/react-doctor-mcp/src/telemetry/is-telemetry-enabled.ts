const isEnvFlagEnabled = (value: string | undefined): boolean =>
  value === "1" || value?.toLowerCase() === "true";

export const isTelemetryEnabled = (): boolean => {
  if (process.argv.includes("--no-telemetry") || process.argv.includes("--no-score")) return false;
  if (isEnvFlagEnabled(process.env.REACT_DOCTOR_NO_TELEMETRY)) return false;
  if (process.env.VITEST || process.env.NODE_ENV === "test") return false;
  return true;
};
