# React Doctor MCP Server — Token Efficiency Benchmark

**Methodology**: one real `diagnose()` run per fixture; `chars = JSON.stringify(toolOutput).length` (the exact stdio payload, no pretty-printing); `tokens = chars / 3.5`. Optimal path = 2 MCP calls (`react_doctor_scan` + `react_doctor_diagnostics`, default limit 50). Reproduce with `pnpm --filter react-doctor-mcp exec tsx scripts/benchmark-tokens.ts`.

Fixed overhead: the `tools/list` payload (2 tool descriptions + input schemas) is **1 603** chars ≈ **458** tokens, sent once per turn.

## Results (7 fixtures)

| Fixture                  | Findings | scan (chars) | diagnostics (chars) | Optimal (chars) | Tokens |
| ------------------------ | -------- | -----------: | ------------------: | --------------: | -----: |
| component-library        | 0        |          393 |                 165 |             558 |   ~159 |
| nested-workspaces        | 0        |          393 |                 165 |             558 |   ~159 |
| monorepo-with-root-react | 0        |          399 |                 172 |             571 |   ~163 |
| mixed-rn-web-monorepo    | 10       |          853 |               3 604 |           4 457 | ~1 274 |
| tanstack-start-app       | 22       |        1 890 |              10 278 |          12 168 | ~3 477 |
| nextjs-app               | 42       |        1 855 |              18 691 |          20 546 | ~5 870 |
| basic-react              | 152      |        1 775 |              24 401 |          26 176 | ~7 479 |

## Summary

| Metric                      | Value                 |
| --------------------------- | --------------------- |
| Fixtures tested             | 7                     |
| Findings range              | 0 → 152               |
| Avg tokens per project      | **~2 654**            |
| Median tokens               | **~1 274**            |
| Min tokens                  | ~159 (clean project)  |
| Max tokens                  | ~7 479 (152 findings) |
| Fixed `tools/list` overhead | ~458 tokens/turn      |

## Optimal agent pattern (2 MCP calls)

```
1. react_doctor_scan        → summary + score          (~400–1 900 chars)
2. react_doctor_diagnostics → first 50 findings        (~165–24 400 chars)
3. [agent fixes findings]
4. react_doctor_scan        → confirm clean            (cheap)
```

Token cost is dominated by the `help` + `msg` text of findings, not the envelope: a clean project costs ~160 tokens, while a 152-finding project costs ~7 500. The summary stays flat (~500 tokens) regardless of finding count because it aggregates to top rules + category counts instead of listing findings. If a project has more than 50 findings, call `react_doctor_diagnostics` repeatedly with `file`/`rule`/`severity` filters rather than raising `limit`.
