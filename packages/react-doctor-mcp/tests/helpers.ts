import * as path from "node:path";
import type { DiagnoseResult, Diagnostic, ProjectInfo } from "react-doctor/api";

export const FAKE_ROOT_DIRECTORY = path.join(path.sep, "fake", "project");

export const buildFakeDiagnostic = (
  overrides: Partial<Diagnostic> & Pick<Diagnostic, "filePath" | "rule">,
): Diagnostic => ({
  plugin: "react-doctor",
  severity: "error",
  message: "message",
  help: "help",
  line: 1,
  column: 1,
  category: "performance",
  ...overrides,
});

export const buildFakeProject = (rootDirectory: string = FAKE_ROOT_DIRECTORY): ProjectInfo =>
  ({ rootDirectory, framework: "nextjs" }) as ProjectInfo;

export const buildFakeResult = (diagnostics: Diagnostic[]): DiagnoseResult => ({
  diagnostics,
  score: null,
  skippedChecks: [],
  project: buildFakeProject(),
  reactDetected: true,
  elapsedMilliseconds: 42,
});
