import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { DIAGNOSTICS_TOOL_NAME, SCAN_TOOL_NAME } from "../constants.js";

export interface ToolSchema {
  description: string;
  inputSchema: Tool["inputSchema"];
}

const DIRECTORY_PROPERTY = {
  directory: {
    type: "string",
    description: "Absolute path to the project root.",
  },
};

export const TOOL_SCHEMAS: Record<string, ToolSchema> = {
  [SCAN_TOOL_NAME]: {
    description:
      "Run a fresh React Doctor scan on a project directory. Returns a compact summary: " +
      "0-100 score, error/warning counts, affected files, top rules, category breakdown. " +
      "Call ONCE per directory, then use react_doctor_diagnostics to drill into findings.",
    inputSchema: {
      type: "object",
      properties: {
        ...DIRECTORY_PROPERTY,
        warnings: {
          type: "boolean",
          description: "Include warning-severity findings. Defaults to true.",
        },
        includePaths: {
          type: "array",
          items: { type: "string" },
          description: "Restrict linting to these paths, relative to the project root.",
        },
      },
      required: ["directory"],
    },
  },
  [DIAGNOSTICS_TOOL_NAME]: {
    description:
      "Inspect individual findings from the last react_doctor_scan of a directory (cached; " +
      "no rescan). Filter by severity, category, rule id, or file substring. servedFromCache " +
      "reports whether the result is a fresh scan or a cached one. Output keys: file, line, " +
      "col, sev, rule, title, msg, help, cat.",
    inputSchema: {
      type: "object",
      properties: {
        ...DIRECTORY_PROPERTY,
        severity: {
          type: "string",
          enum: ["error", "warning"],
          description: "Only findings of this severity.",
        },
        category: {
          type: "string",
          description: "Only findings in this category (e.g. accessibility, performance).",
        },
        rule: {
          type: "string",
          description: 'Exact "plugin/rule" id or a substring of it (e.g. no-array-index-key).',
        },
        file: {
          type: "string",
          description: "Exact project-relative path or a substring (e.g. App.tsx).",
        },
        limit: {
          type: "integer",
          description: "Max findings to return. Defaults to 50.",
        },
      },
      required: ["directory"],
    },
  },
};
