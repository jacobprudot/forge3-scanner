# @forge3/scanner-vfp

VFP9 (Visual FoxPro 9) legacy system scanner. Analyzes your VFP codebase and generates a report covering inventory, complexity, security, and migration risk.

Part of the [Forge3 Scanner](../../README.md) suite.

## Install

```bash
npm install -g @forge3/scanner-vfp
```

## Usage

```bash
# Scan a VFP project directory
forge3-scan ./path/to/vfp/project

# Output as JSON
forge3-scan ./project --format json

# Save HTML report
forge3-scan ./project --format html --output report.html
```

## What It Detects

### File Types
`.PRG` (programs), `.SCX` (forms), `.VCX` (class libraries), `.FRX` (reports), `.MNX` (menus), `.DBC` (database containers), `.DBF` (tables), `.CDX/.IDX` (indexes), `.FPT` (memo files)

### Complexity Patterns
| Pattern | Weight | Why It Matters |
|---|---|---|
| Macro substitution (`&var`) | High | Dynamic code generation — unpredictable at compile time |
| SCATTER/GATHER MEMVAR | Medium | Tight coupling between data and UI |
| Deep THISFORM nesting | Medium | Complex form hierarchies |
| SCAN/ENDSCAN loops | Low | Cursor-based iteration, replace with queries |
| ActiveX/OLE controls | High | Binary dependencies with no modern equivalent |
| DLL DECLARE calls | High | Windows API dependencies |
| EXECSCRIPT/EVALUATE | High | Runtime code execution |
| SQL Pass-Through | Medium | Direct ODBC calls |

### Security Checks
- Platform CVEs (VFP9 EOL since 2015)
- Hardcoded credentials and connection strings
- SQL injection patterns (string concat + macro substitution in SQL)
- Shell command execution
- Unencrypted DBF data on disk
- Missing audit trails

### Migration Risk Flags
- **Red**: ActiveX, DLLs, macros, General fields, EXECSCRIPT
- **Yellow**: SCATTER/GATHER, THISFORM nesting, SCAN loops, Memo fields, SQL Pass-Through
- **Green**: Clean PRG code, standard data types

## Programmatic API

```typescript
import { scan } from "@forge3/scanner-vfp"

const report = await scan({
  path: "./my-vfp-project",
  format: "json",
})

console.log(report.complexity.score)    // 6.8
console.log(report.security.grade)      // "D"
console.log(report.risk.redCount)       // 4
```

## License

MIT
