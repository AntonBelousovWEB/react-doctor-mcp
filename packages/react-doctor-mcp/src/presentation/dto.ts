import { summarizeDiagnostics } from "react-doctor/api";
import type { DiagnoseResult, Diagnostic } from "react-doctor/api";
import { toRelativePath } from "../utils/relative-path.js";

export interface TopRuleDto {
  rule: string;
  count: number;
  severity: "error" | "warning";
  title?: string;
  tier?: string;
}

export interface ScanSummaryDto {
  ok: true;
  directory: string;
  score: number | null;
  scoreLabel: string | null;
  errors: number;
  warnings: number;
  affectedFiles: number;
  scannedFiles: number | null;
  reactDetected: boolean;
  framework: string;
  skippedChecks: string[];
  topRules: TopRuleDto[];
  categories: Record<string, number>;
  elapsedMs: number;
  hint: string;
}

export interface DiagnosticDto {
  file: string;
  line: number;
  col: number;
  sev: "error" | "warning";
  rule: string;
  title?: string;
  msg: string;
  help: string;
  cat: string;
}

export interface DiagnosticsDto {
  ok: true;
  directory: string;
  total: number;
  returned: number;
  truncated: boolean;
  servedFromCache: boolean;
  diagnostics: DiagnosticDto[];
}

export interface DiagnosticsFilter {
  severity?: "error" | "warning";
  category?: string;
  rule?: string;
  file?: string;
}

const SUMMARY_HINT = "Call react_doctor_diagnostics to inspect individual findings.";

const buildTopRules = (result: DiagnoseResult, maxTopRules: number): TopRuleDto[] => {
  const ruleCounts = new Map<string, TopRuleDto>();
  for (const diagnostic of result.diagnostics) {
    const ruleKey = `${diagnostic.plugin}/${diagnostic.rule}`;
    const existing = ruleCounts.get(ruleKey);
    if (existing === undefined) {
      ruleCounts.set(ruleKey, {
        rule: ruleKey,
        count: 1,
        severity: diagnostic.severity,
        ...(diagnostic.title !== undefined ? { title: diagnostic.title } : {}),
      });
      continue;
    }
    existing.count += 1;
    if (diagnostic.severity === "error") existing.severity = "error";
    if (existing.title === undefined && diagnostic.title !== undefined) {
      existing.title = diagnostic.title;
    }
  }
  const topRules = [...ruleCounts.values()]
    .sort((left, right) => right.count - left.count)
    .slice(0, maxTopRules);
  const priorities = result.score?.rules;
  if (priorities !== undefined) {
    for (const topRule of topRules) {
      if (Object.hasOwn(priorities, topRule.rule)) {
        topRule.tier = priorities[topRule.rule].tier;
      }
    }
  }
  return topRules;
};

const buildCategories = (diagnostics: Diagnostic[]): Record<string, number> => {
  const categoryCounts = new Map<string, number>();
  for (const diagnostic of diagnostics) {
    categoryCounts.set(diagnostic.category, (categoryCounts.get(diagnostic.category) ?? 0) + 1);
  }
  return Object.fromEntries(
    [...categoryCounts.entries()].sort((left, right) => right[1] - left[1]),
  );
};

export const resultToSummary = (result: DiagnoseResult, maxTopRules: number): ScanSummaryDto => {
  const summary = summarizeDiagnostics(
    result.diagnostics,
    result.score?.score ?? null,
    result.score?.label ?? null,
  );
  return {
    ok: true,
    directory: result.project.rootDirectory,
    score: summary.score,
    scoreLabel: summary.scoreLabel,
    errors: summary.errorCount,
    warnings: summary.warningCount,
    affectedFiles: summary.affectedFileCount,
    scannedFiles: result.scannedFileCount ?? null,
    reactDetected: result.reactDetected ?? false,
    framework: result.project.framework,
    skippedChecks: result.skippedChecks,
    topRules: buildTopRules(result, maxTopRules),
    categories: buildCategories(result.diagnostics),
    elapsedMs: result.elapsedMilliseconds,
    hint: SUMMARY_HINT,
  };
};

export const diagnosticToDto = (diagnostic: Diagnostic, rootDirectory: string): DiagnosticDto => ({
  file: toRelativePath(diagnostic.filePath, rootDirectory),
  line: diagnostic.line,
  col: diagnostic.column,
  sev: diagnostic.severity,
  rule: `${diagnostic.plugin}/${diagnostic.rule}`,
  ...(diagnostic.title !== undefined ? { title: diagnostic.title } : {}),
  msg: diagnostic.message,
  help: diagnostic.help,
  cat: diagnostic.category,
});

const matchesFilter = (
  diagnostic: Diagnostic,
  filter: DiagnosticsFilter,
  rootDirectory: string,
): boolean => {
  if (filter.severity !== undefined && diagnostic.severity !== filter.severity) return false;
  if (filter.category !== undefined && diagnostic.category !== filter.category) return false;
  if (filter.rule !== undefined) {
    const ruleKey = `${diagnostic.plugin}/${diagnostic.rule}`;
    if (ruleKey !== filter.rule && !ruleKey.includes(filter.rule)) return false;
  }
  if (filter.file !== undefined) {
    const relativePath = toRelativePath(diagnostic.filePath, rootDirectory);
    if (relativePath !== filter.file && !relativePath.includes(filter.file)) return false;
  }
  return true;
};

export const resultToDiagnosticsDto = (
  result: DiagnoseResult,
  filter: DiagnosticsFilter,
  limit: number,
  servedFromCache: boolean,
): DiagnosticsDto => {
  const rootDirectory = result.project.rootDirectory;
  const matching = result.diagnostics.filter((diagnostic) =>
    matchesFilter(diagnostic, filter, rootDirectory),
  );
  const returned = matching.slice(0, limit);
  return {
    ok: true,
    directory: rootDirectory,
    total: matching.length,
    returned: returned.length,
    truncated: matching.length > returned.length,
    servedFromCache,
    diagnostics: returned.map((diagnostic) => diagnosticToDto(diagnostic, rootDirectory)),
  };
};
