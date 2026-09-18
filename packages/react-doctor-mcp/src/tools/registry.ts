import { DIAGNOSTICS_TOOL_NAME, SCAN_TOOL_NAME } from "../constants.js";
import type { AppContext } from "./contracts.js";
import { runDiagnostics } from "./diagnostics.js";
import { runScan } from "./scan.js";

export interface ToolHandler {
  (ctx: AppContext, args: Record<string, unknown>): Promise<unknown>;
}

export const TOOL_DISPATCH: Record<string, ToolHandler> = {
  [SCAN_TOOL_NAME]: runScan,
  [DIAGNOSTICS_TOOL_NAME]: runDiagnostics,
};
