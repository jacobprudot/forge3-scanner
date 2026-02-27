# Forge3 Scanner

Free, open-source legacy system scanner by [Leon Gael LLC](https://forge3.dev).

Scans legacy codebases and generates detailed reports on **inventory**, **complexity**, **security vulnerabilities**, and **migration risk** — without requiring an API key or AI. Pure static analysis.

## Supported Technologies

| Technology | Package | Status |
|---|---|---|
| **VFP9** (Visual FoxPro 9) | [`@forge3/scanner-vfp`](packages/vfp) | ✅ Available |
| Oracle PL/SQL | — | 🔜 Coming soon |
| COBOL | — | 🔜 Coming soon |
| VB6 | — | 🔜 Coming soon |

## Quick Start

```bash
# Run directly with npx (no install needed)
npx @forge3/scanner-vfp ./path/to/vfp/project

# Or install globally
npm install -g @forge3/scanner-vfp
forge3-scan ./path/to/vfp/project
```

## Output Formats

```bash
# Colored terminal output (default)
forge3-scan ./project

# Machine-readable JSON
forge3-scan ./project --format json

# Standalone HTML report
forge3-scan ./project --format html --output report.html
```

## What It Scans

### 📋 Inventory
Files, lines of code, tables, records, indexes, dependencies — a complete picture of what exists.

### ⚡ Complexity Score (1-10)
Detects patterns that make migration harder: macro substitution, SCATTER/GATHER, deep THISFORM nesting, ActiveX controls, DLL dependencies, and more.

### 🔒 Security Analysis (Grade A-F)
Platform CVEs, hardcoded credentials, SQL injection patterns, unencrypted data, missing audit trails. Includes CVSS scores for known vulnerabilities.

### ⚠️ Migration Risk Flags
Color-coded risk assessment:
- 🔴 **Red** — High risk, requires manual intervention (ActiveX, DLLs, macros, General fields)
- 🟡 **Yellow** — Moderate risk, needs refactoring (SCATTER/GATHER, SCAN loops, Memo fields)
- 🟢 **Green** — Low risk, straightforward migration (clean code, standard data types)

## Sample Output

```
╔══════════════════════════════════════════════════╗
║  FORGE3 SCANNER — VFP9 Legacy System Report     ║
╚══════════════════════════════════════════════════╝

📋 INVENTORY
   Source code:    34 .PRG files, 22,140 lines
   Forms:          18 .SCX forms, 12 .VCX class libraries
   Database:       45 .DBF tables, 38 indexes
   Data:           2.4 GB, 1,200,000 total records

⚡ COMPLEXITY SCORE: 6.8 / 10 [████████░░] DIFFICULT

🔒 SECURITY SCORE: D
   Platform: VFP9 EOL since 2015 — 0 patches in 11 years

⚠️  MIGRATION RISK FLAGS
   🔴 4 ActiveX controls
   🔴 5 programs use macro substitution
   🟡 15 programs use SCATTER/GATHER MEMVAR
   🟢 Standard DBF data types
```

## Development

```bash
# Clone the repo
git clone https://github.com/LeonGael/forge3-scanner.git
cd forge3-scanner/packages/vfp

# Install dependencies
npm install

# Run in development
npx tsx src/index.ts ./path/to/vfp/project

# Run tests
npm test

# Build
npm run build
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Need More Than a Scan?

This scanner is a free automated tool. For a **full business analysis**, **risk remediation plan**, and **migration architecture** with zero data loss guarantee:

**→ [Request Assessment at forge3.dev](https://forge3.dev)**

## License

MIT — see [LICENSE](LICENSE).
