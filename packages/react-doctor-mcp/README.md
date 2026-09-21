# React Doctor MCP Server

Model Context Protocol (MCP) server for [React Doctor](https://github.com/millionco/react-doctor) — structured React diagnostics (lint, accessibility, performance, architecture) surfaced to coding agents.

## Quickstart

```bash
pnpm --filter react-doctor-mcp build
node packages/react-doctor-mcp/bin/react-doctor-mcp.js
```

Register it with any MCP client:

```json
{
  "mcpServers": {
    "react-doctor": {
      "command": "react-doctor-mcp"
    }
  }
}
```

## MCP tools (2)

| Tool                       | When                | Input                                                             | Output                                                                                            |
| -------------------------- | ------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `react_doctor_scan`        | Once per directory  | `directory`, `warnings?`, `includePaths?`                         | Compact summary: 0-100 score, error/warning counts, affected files, top rules, category breakdown |
| `react_doctor_diagnostics` | Drill into findings | `directory`, `severity?`, `category?`, `rule?`, `file?`, `limit?` | Filtered findings, served from the cached scan (no rescan)                                        |

## Agent workflow

```
1. react_doctor_scan        → summary + score          (one scan)
2. react_doctor_diagnostics → filtered findings        (cached, free)
3. [agent fixes findings]
4. react_doctor_scan        → confirm clean
```

## Token efficiency

- Summary/detail split — the scan returns counts and top rules, never the full finding list.
- File paths are relativized to the project root, diagnostics carry only essential fields, and detail results are capped (default 50, max 200).
- Compact JSON with a stable, documented key set.

## Telemetry

The server emits three counters to first-party Axiom metrics: `mcp.scan`, `mcp.diagnostics.cacheHit`, and `mcp.diagnostics.cacheMiss` — the cache pair is how reconnect-heavy clients surface as misses instead of silently paying for a rescan. No paths, repo identity, or secrets are attached.

Opt out with `REACT_DOCTOR_NO_TELEMETRY=1` or the `--no-telemetry` flag; test runs are silent by construction.

## License

Modified MIT — [Million Software, Inc](https://million.dev)
