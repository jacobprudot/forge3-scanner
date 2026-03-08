# Forge3 Scanner

Free, open-source **universal legacy system scanner** by [Leon Gael LLC](https://forge3.dev).

Auto-detects what legacy technology lives in any directory, then runs the appropriate analysis — deep for VFP9, basic inventory for others. Every scan generates a **migration profile** with target stack suggestions, cost estimates, and timeline.

## Supported Technologies

| Technology | Detection | Analysis | Status |
|---|---|---|---|
| **VFP9** (Visual FoxPro 9) | File extensions + content patterns | Deep (complexity, security, risk) | ✅ Available |
| **Oracle Forms** | .fmb, .fmx, .pll + PL/SQL patterns | Basic (inventory) | ✅ Detection + basic |
| **VB6** | .vbp, .frm, .bas, .cls + VB6 headers | Basic (inventory) | ✅ Detection + basic |
| **Delphi** | .pas, .dfm, .dpr, .dpk | Basic (inventory) | ✅ Detection + basic |
| **COBOL** | .cbl, .cob, .cpy, .jcl | Basic (inventory) | ✅ Detection + basic |
| **PowerBuilder** | .pbl, .pbt, .pbw, .srd | Basic (inventory) | ✅ Detection + basic |
| **Access** | .mdb, .accdb, .mde, .accde | Basic (inventory) | ✅ Detection + basic |
| **Clipper/Harbour** | .ch, .hbp + content disambiguation | Basic (inventory) | ✅ Detection + basic |

## Quick Start

```bash
# Run directly with npx (no install needed)
npx @forge3/scanner-vfp ./path/to/legacy/project

# Or install globally
npm install -g @forge3/scanner-vfp
forge3-scan ./path/to/legacy/project
```

## Commands

```bash
# Auto-detect technology and run full analysis + migration profile
forge3-scan ./project

# Just detect what technology is present (fast)
forge3-scan ./project --detect-only

# Machine-readable JSON
forge3-scan ./project --format json

# Standalone HTML report
forge3-scan ./project --format html --output report.html
```

## What You Get

### 🔍 Technology Detection
Point it at any directory. The scanner identifies VFP9, Oracle Forms, VB6, Delphi, COBOL, PowerBuilder, Access, and Clipper/Harbour — with confidence scores and evidence.

### 📋 Inventory
Files, lines of code, tables, records, indexes, dependencies — a complete picture of what exists.

### ⚡ Complexity Score (1-10) — VFP9 only
Detects patterns that make migration harder: macro substitution, SCATTER/GATHER, deep THISFORM nesting, ActiveX controls, DLL dependencies, and more.

### 🔒 Security Analysis (Grade A-F) — VFP9 only
Platform CVEs, hardcoded credentials, SQL injection patterns, unencrypted data, missing audit trails. Includes CVSS scores for known vulnerabilities.

### ⚠️ Migration Risk Flags — VFP9 only
Color-coded risk assessment:
- 🔴 **Red** — High risk, requires manual intervention
- 🟡 **Yellow** — Moderate risk, needs refactoring
- 🟢 **Green** — Low risk, straightforward migration

### 📊 Migration Profile — All technologies
- **Suggested target stack** (e.g., .NET 8 / Blazor + PostgreSQL)
- **Cost estimates** — assessment and migration ranges
- **Timeline** — estimated weeks
- **Skills needed** and **knowledge gaps**

## Sample Output

```
╔══════════════════════════════════════════════════╗
║  FORGE3 SCANNER — Legacy System Report           ║
╚══════════════════════════════════════════════════╝

🔍 DETECTION
   Technology: VFP9 (95% confidence)
   Files:      142 detected
   Analysis:   Deep (VFP9)

📋 INVENTORY
   Source code:    34 .PRG files, 22,140 lines
   Forms:          18 .SCX forms, 12 .VCX class libraries
   Database:       45 .DBF tables, 38 indexes
   Data:           2.4 GB, 1,200,000 total records

⚡ COMPLEXITY SCORE: 6.8 / 10 [████████░░] DIFFICULT

🔒 SECURITY SCORE: D

⚠️  MIGRATION RISK FLAGS
   🔴 4 ActiveX controls
   🔴 5 programs use macro substitution
   🟡 15 programs use SCATTER/GATHER MEMVAR
   🟢 Standard DBF data types

📊 MIGRATION PROFILE
   Suggested target:  .NET 8 / Blazor + PostgreSQL
   Assessment:  $5K — $7.5K
   Migration:   $40K — $60K (high confidence)
   Timeline:    8 — 12 weeks
```

## Development

```bash
# Clone the repo
git clone https://github.com/LeonGael/forge3-scanner.git
cd forge3-scanner/packages/vfp

# Install dependencies
npm install

# Run in development
npx tsx src/index.ts ./path/to/project

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
