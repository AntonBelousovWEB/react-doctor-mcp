import { DEFAULT_DIAGNOSTICS_LIMIT, MAX_DIAGNOSTICS_LIMIT, MAX_TOP_RULES } from "./constants.js";

export interface AppConfig {
  readonly defaultDiagnosticsLimit: number;
  readonly maxDiagnosticsLimit: number;
  readonly maxTopRules: number;
}

export const defaultAppConfig: AppConfig = {
  defaultDiagnosticsLimit: DEFAULT_DIAGNOSTICS_LIMIT,
  maxDiagnosticsLimit: MAX_DIAGNOSTICS_LIMIT,
  maxTopRules: MAX_TOP_RULES,
};
