import * as path from "node:path";
import { resultToSummary } from "../presentation/dto.js";
import type { AppContext } from "./contracts.js";
import { readOptionalBoolean, readOptionalStringArray, readRequiredString } from "./args.js";

export const runScan = async (ctx: AppContext, args: Record<string, unknown>): Promise<unknown> => {
  const directory = path.resolve(readRequiredString(args, "directory"));
  const warnings = readOptionalBoolean(args, "warnings");
  const includePaths = readOptionalStringArray(args, "includePaths");
  const result = await ctx.diagnose(directory, {
    ...(warnings !== undefined ? { warnings } : {}),
    ...(includePaths !== undefined ? { includePaths } : {}),
  });
  ctx.cache.set(directory, { result });
  ctx.cache.set(result.project.rootDirectory, { result });
  return resultToSummary(result, ctx.config.maxTopRules);
};
