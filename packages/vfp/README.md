# @forge3/scanner-vfp

Universal legacy system scanner with deep VFP9 analysis. Auto-detects what legacy technology is present in any directory, then runs the appropriate analyzer — deep for VFP9, basic inventory for everything else.

Part of the [Forge3 Scanner](../../README.md) suite.

## Install

```bash
npm install -g @forge3/scanner-vfp
```

## Usage

```bash
# Scan any legacy project — technology is auto-detected
forge3-scan ./path/to/project

# Just detect the technology without full analysis
forge3-scan ./path/to/project --detect-only

# Output as JSON
forge3-scan ./project --format json

# Save HTML report
forge3-scan ./project --format html --output report.html
```

## What It Does

### 1. Technology Detection
Auto-detects the primary legacy technology by scanning file extensions and checking content patterns:

| Technology | Detection Method |
|---|---|
| **VFP9** | .prg, .scx, .vcx, .frx, .mnx, .dbc, .dbf, .pjx + VFP-specific keywords |
| **Oracle Forms** | .fmb, .fmx, .mmb, .pll, .rdf + PL/SQL patterns in .sql files |
| **VB6** | .vbp, .bas, .cls + VB6 form headers in .frm files |
| **Delphi** | .pas, .dfm, .dpr, .dpk, .dproj |
| **COBOL** | .cbl, .cob, .cpy, .jcl |
| **PowerBuilder** | .pbl, .pbt, .pbw, .srd, .srw |
| **Access** | .mdb, .accdb, .mde, .accde |
| **Clipper/Harbour** | .ch, .hbp + Clipper-specific patterns in .prg (disambiguated from VFP) |

### 2. Deep Analysis (VFP9)
For VFP9 projects, the scanner runs a full analysis:

- **Inventory** — files, lines of code, tables, records, indexes, dependencies
- **Complexity Score (1-10)** — macro substitution, SCATTER/GATHER, deep THISFORM nesting, ActiveX, DLLs, EXECSCRIPT
- **Security Grade (A-F)** — platform CVEs, hardcoded credentials, SQL injection, shell execution, unencrypted data
- **Risk Flags** — color-coded (red/yellow/green) migration risk assessment

### 3. Basic Analysis (Other Technologies)
For other technologies, the scanner provides:
- File inventory by extension (count, lines, size)
- Total lines of code and disk size
- Note that deep analysis is not yet available

### 4. Migration Profile
Every scan generates a migration profile with:
- **Suggested target stack** (e.g., .NET 8 / Blazor + PostgreSQL)
- **Cost estimates** (assessment range + migration range)
- **Timeline** (in weeks)
- **Skills needed** and **knowledge gaps**

## Example Output

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
   Platform: VFP9 EOL since 2015 — 0 patches in 11 years

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

## Programmatic API

```typescript
import { universalScan, scan, detectOnly } from "@forge3/scanner-vfp"

// Universal scan (auto-detect + analyze + profile)
const report = await universalScan({ path: "./my-project", format: "json" })
console.log(report.detection.primary.technology)  // "vfp9"
console.log(report.profile.estimate.migrationRange)  // "$40K — $60K"

// Legacy API: deep VFP9 scan only
const vfpReport = await scan({ path: "./my-vfp-project", format: "json" })
console.log(vfpReport.complexity.score)  // 6.8

// Detection only (fast)
const detection = await detectOnly("./some-project")
console.log(detection.primary.technology)  // "oracle-forms"
console.log(detection.analysisAvailable)   // false
```

## License

MIT
