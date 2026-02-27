# Scanner Architecture

## Overview

The Forge3 Scanner is a static analysis tool that reads legacy source code and binary files without executing them. It produces a structured report with four sections: Inventory, Complexity, Security, and Risk.

```
CLI (index.ts)
  └── Scanner (scanner.ts)
        ├── Parsers
        │     ├── prg.ts   — Plain text .PRG files
        │     ├── dbf.ts   — Binary .DBF header parsing
        │     └── scx.ts   — Binary .SCX/.VCX memo extraction
        │
        ├── Analyzers
        │     ├── inventory.ts    — File counts, sizes, records
        │     ├── complexity.ts   — Pattern detection, scoring
        │     ├── security.ts     — CVEs, credentials, injection
        │     └── risk.ts         — Red/yellow/green flags
        │
        └── Reporters
              ├── terminal.ts  — Colored CLI output
              ├── json.ts      — Machine-readable JSON
              └── html.ts      — Standalone HTML report
```

## Data Flow

1. **CLI** parses arguments and calls `scan()`
2. **Scanner** resolves the path and runs all 4 analyzers in parallel
3. **Parsers** are called by analyzers as needed (PRG, DBF, SCX)
4. **Analyzers** return structured results
5. **Reporter** formats the combined report for output

## Design Decisions

- **No AI required**: Pure regex/pattern matching. Runs offline, no API keys.
- **Parallel analysis**: All 4 analyzers run simultaneously via `Promise.all`.
- **Binary parsing**: DBF headers are read directly (no external library). Only the header + field descriptors are read — not the actual data.
- **Best-effort SCX parsing**: VFP binary forms are DBF+memo. We extract ASCII text from memo blocks for pattern matching.
- **Weighted scoring**: Complexity uses log-scaled weights to prevent one pattern from dominating the score.
- **Security grade**: Starts at 100, deducted by severity. Platform EOL alone drops to D minimum.

## Adding New Patterns

To add a new complexity pattern, edit `analyzers/complexity.ts`:

```typescript
{
  id: "your_pattern_id",
  description: "What this pattern means",
  regex: /YOUR_REGEX/i,
  weight: 2,  // 1=low, 2=medium, 3=high
}
```

To add a new security check, edit `analyzers/security.ts` and add to `CODE_PATTERNS`.
