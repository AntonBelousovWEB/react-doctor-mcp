import * as path from "node:path";
import { resultToDiagnosticsDto, type DiagnosticsFilter } from "../presentation/dto.js";
import { InvalidArgumentsError } from "../errors.js";
import type { AppContext } from "./contracts.js";
import { readOptionalInteger, readOptionalString, readRequiredString } from "./args.js";

const readSeverity = (args: Record<string, unknown>): "error" | "warning" | undefined => {
  const severity = readOptionalString(args, "severity");
  if (severity === undefined) return undefined;
  if (severity !== "error" && severity !== "warning") {
    throw new InvalidArgumentsError('severity must be "error" or "warning"');
  }
  return severity;
};

export const runDiagnostics = async (
  ctx: AppContext,
  args: Record<string, unknown>,
): Promise<unknown> => {
  const directory = path.resolve(readRequiredString(args, "directory"));
  const cached = ctx.cache.get(directory);
  const servedFromCache = cached !== undefined;
  const result = cached?.result ?? (await ctx.diagnose(directory));
  if (cached === undefined) {
    ctx.cache.set(directory, { result });
    ctx.cache.set(result.project.rootDirectory, { result });
  }
  const requestedLimit = readOptionalInteger(args, "limit") ?? ctx.config.defaultDiagnosticsLimit;
  const limit = Math.max(1, Math.min(requestedLimit, ctx.config.maxDiagnosticsLimit));
  const severity = readSeverity(args);
  const category = readOptionalString(args, "category");
  const rule = readOptionalString(args, "rule");
  const file = readOptionalString(args, "file");
  const filter: DiagnosticsFilter = {
    ...(severity !== undefined ? { severity } : {}),
    ...(category !== undefined ? { category } : {}),
    ...(rule !== undefined ? { rule } : {}),
    ...(file !== undefined ? { file } : {}),
  };
  return resultToDiagnosticsDto(result, filter, limit, servedFromCache);
};
