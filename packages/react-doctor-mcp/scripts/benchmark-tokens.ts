import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { diagnose } from "react-doctor/api";
import { DEFAULT_DIAGNOSTICS_LIMIT, MAX_TOP_RULES } from "../src/constants.js";
import { resultToDiagnosticsDto, resultToSummary } from "../src/presentation/dto.js";
import { TOOL_SCHEMAS } from "../src/presentation/schemas.js";

const TOKEN_DIVISOR = 3.5;

interface FixtureRow {
  name: string;
  diagnostics: number;
  summaryChars: number;
  detailChars: number;
}

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const fixtureRoot = path.resolve(scriptDirectory, "../../core/tests/fixtures");

const fixtures = [
  { name: "basic-react", path: path.join(fixtureRoot, "basic-react") },
  { name: "nextjs-app", path: path.join(fixtureRoot, "nextjs-app") },
  { name: "component-library", path: path.join(fixtureRoot, "component-library") },
  { name: "tanstack-start-app", path: path.join(fixtureRoot, "tanstack-start-app") },
  { name: "monorepo-with-root-react", path: path.join(fixtureRoot, "monorepo-with-root-react") },
  { name: "mixed-rn-web-monorepo", path: path.join(fixtureRoot, "mixed-rn-web-monorepo") },
  { name: "nested-workspaces", path: path.join(fixtureRoot, "nested-workspaces") },
];

const toTokens = (chars: number): number => Math.round(chars / TOKEN_DIVISOR);

const buildToolList = () =>
  Object.entries(TOOL_SCHEMAS).map(([name, schema]) => ({
    name,
    description: schema.description,
    inputSchema: schema.inputSchema,
  }));

const rows: FixtureRow[] = await Promise.all(
  fixtures.map(async (fixture) => {
    const result = await diagnose(fixture.path);
    const summaryChars = JSON.stringify(resultToSummary(result, MAX_TOP_RULES)).length;
    const detailChars = JSON.stringify(
      resultToDiagnosticsDto(result, {}, DEFAULT_DIAGNOSTICS_LIMIT),
    ).length;
    return {
      name: fixture.name,
      diagnostics: result.diagnostics.length,
      summaryChars,
      detailChars,
    };
  }),
);

const toolListChars = JSON.stringify(buildToolList()).length;

const sortedByTotal = [...rows].sort(
  (left, right) => left.summaryChars + left.detailChars - (right.summaryChars + right.detailChars),
);
const totalTokens = (row: FixtureRow): number =>
  toTokens(row.summaryChars) + toTokens(row.detailChars);

console.log("# React Doctor MCP Server — Token Efficiency Benchmark\n");
console.log(
  `Methodology: real \`diagnose()\` run per fixture; chars = \`JSON.stringify(toolOutput).length\` ` +
    `(the exact stdio payload); tokens = chars / ${TOKEN_DIVISOR}. Optimal path = 2 MCP calls ` +
    `(\`react_doctor_scan\` + \`react_doctor_diagnostics\`, default limit ${DEFAULT_DIAGNOSTICS_LIMIT}).\n`,
);
console.log(
  `Fixed overhead: the tools/list payload (2 tool descriptions + schemas) is **${toolListChars}** chars ≈ **${toTokens(toolListChars)}** tokens per turn.\n`,
);
console.log(
  "| Fixture | Findings | scan (chars) | diagnostics (chars) | Optimal (chars) | Tokens |",
);
console.log("|---|---|---:|---:|---:|---:|");
for (const row of sortedByTotal) {
  const optimalChars = row.summaryChars + row.detailChars;
  console.log(
    `| ${row.name} | ${row.diagnostics} | ${row.summaryChars} | ${row.detailChars} | ${optimalChars} | ~${totalTokens(row)} |`,
  );
}

const totals = rows.map(totalTokens);
const average = Math.round(totals.reduce((sum, value) => sum + value, 0) / totals.length);
const sortedTotals = [...totals].sort((left, right) => left - right);
const median = sortedTotals[Math.floor(sortedTotals.length / 2)];
const min = sortedTotals[0];
const max = sortedTotals[sortedTotals.length - 1];

console.log("\n## Summary\n");
console.log("| Metric | Value |");
console.log("|---|---|");
console.log(`| Fixtures tested | ${rows.length} |`);
console.log(`| Avg tokens per project | **~${average}** |`);
console.log(`| Median tokens | **~${median}** |`);
console.log(`| Min tokens | ~${min} |`);
console.log(`| Max tokens | ~${max} |`);
console.log(`| Fixed tools/list overhead | ~${toTokens(toolListChars)} tokens/turn |`);
