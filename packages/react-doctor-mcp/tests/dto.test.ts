import * as path from "node:path";
import { describe, expect, it } from "vite-plus/test";
import {
  diagnosticToDto,
  resultToDiagnosticsDto,
  resultToSummary,
} from "../src/presentation/dto.js";
import { buildFakeDiagnostic, buildFakeResult, FAKE_ROOT_DIRECTORY } from "./helpers.js";

const fileAt = (...segments: string[]): string => path.join(FAKE_ROOT_DIRECTORY, ...segments);

describe("resultToSummary", () => {
  it("counts errors, warnings, affected files, top rules, and categories", () => {
    const result = buildFakeResult([
      buildFakeDiagnostic({
        filePath: fileAt("src", "App.tsx"),
        rule: "no-array-index-key",
        severity: "error",
        category: "accessibility",
        title: "Array index used as a key",
      }),
      buildFakeDiagnostic({
        filePath: fileAt("src", "App.tsx"),
        rule: "no-array-index-key",
        severity: "warning",
        category: "accessibility",
      }),
      buildFakeDiagnostic({
        filePath: fileAt("src", "List.tsx"),
        rule: "no-unused-vars",
        severity: "warning",
        category: "maintainability",
      }),
    ]);

    const summary = resultToSummary(result, 10);

    expect(summary.errors).toBe(1);
    expect(summary.warnings).toBe(2);
    expect(summary.affectedFiles).toBe(2);
    expect(summary.topRules[0]).toMatchObject({
      rule: "react-doctor/no-array-index-key",
      count: 2,
      severity: "error",
      title: "Array index used as a key",
    });
    expect(summary.categories).toEqual({ accessibility: 2, maintainability: 1 });
    expect(summary.reactDetected).toBe(true);
    expect(summary.elapsedMs).toBe(42);
  });

  it("orders top rules by count descending", () => {
    const result = buildFakeResult([
      buildFakeDiagnostic({ filePath: fileAt("a.tsx"), rule: "rare-rule" }),
      buildFakeDiagnostic({ filePath: fileAt("b.tsx"), rule: "common-rule" }),
      buildFakeDiagnostic({ filePath: fileAt("c.tsx"), rule: "common-rule" }),
      buildFakeDiagnostic({ filePath: fileAt("d.tsx"), rule: "common-rule" }),
    ]);

    const summary = resultToSummary(result, 10);

    expect(summary.topRules.map((topRule) => topRule.rule)).toEqual([
      "react-doctor/common-rule",
      "react-doctor/rare-rule",
    ]);
  });
});

describe("diagnosticToDto", () => {
  it("relativizes the file path and uses the compact key set", () => {
    const dto = diagnosticToDto(
      buildFakeDiagnostic({
        filePath: fileAt("src", "App.tsx"),
        rule: "no-array-index-key",
        category: "accessibility",
        title: "Array index used as a key",
      }),
      FAKE_ROOT_DIRECTORY,
    );

    expect(dto).toEqual({
      file: path.join("src", "App.tsx").split(path.sep).join("/"),
      line: 1,
      col: 1,
      sev: "error",
      rule: "react-doctor/no-array-index-key",
      title: "Array index used as a key",
      msg: "message",
      help: "help",
      cat: "accessibility",
    });
  });
});

describe("resultToDiagnosticsDto", () => {
  const result = buildFakeResult([
    buildFakeDiagnostic({
      filePath: fileAt("src", "App.tsx"),
      rule: "no-array-index-key",
      severity: "error",
      category: "accessibility",
    }),
    buildFakeDiagnostic({
      filePath: fileAt("src", "App.tsx"),
      rule: "no-unused-vars",
      severity: "warning",
      category: "maintainability",
    }),
    buildFakeDiagnostic({
      filePath: fileAt("src", "List.tsx"),
      rule: "no-array-index-key",
      severity: "warning",
      category: "accessibility",
    }),
  ]);

  it("filters by severity and reports the match total", () => {
    const dto = resultToDiagnosticsDto(result, { severity: "warning" }, 50);

    expect(dto.total).toBe(2);
    expect(dto.returned).toBe(2);
    expect(dto.truncated).toBe(false);
    expect(dto.diagnostics.every((diagnostic) => diagnostic.sev === "warning")).toBe(true);
  });

  it("filters by rule substring", () => {
    const dto = resultToDiagnosticsDto(result, { rule: "no-array-index-key" }, 50);

    expect(dto.total).toBe(2);
    expect(
      dto.diagnostics.every((diagnostic) => diagnostic.rule === "react-doctor/no-array-index-key"),
    ).toBe(true);
  });

  it("filters by file substring", () => {
    const dto = resultToDiagnosticsDto(result, { file: "App.tsx" }, 50);

    expect(dto.total).toBe(2);
    expect(dto.diagnostics.every((diagnostic) => diagnostic.file === "src/App.tsx")).toBe(true);
  });

  it("relativizes file paths that are already relative to the project root", () => {
    const relativeResult = buildFakeResult([
      buildFakeDiagnostic({ filePath: "src/App.tsx", rule: "no-array-index-key" }),
    ]);

    const dto = resultToDiagnosticsDto(relativeResult, {}, 50);

    expect(dto.diagnostics[0].file).toBe("src/App.tsx");
  });

  it("caps results at the limit and reports truncation", () => {
    const dto = resultToDiagnosticsDto(result, {}, 2);

    expect(dto.total).toBe(3);
    expect(dto.returned).toBe(2);
    expect(dto.truncated).toBe(true);
  });
});
