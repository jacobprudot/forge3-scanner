import { glob } from "glob"
import { parsePrg, extractCode } from "../parsers/prg.js"
import { parseScx } from "../parsers/scx.js"
import { parseDbfHeader } from "../parsers/dbf.js"
import type { RiskResult, RiskFlag, RiskLevel } from "../types.js"

interface RiskPattern {
  level: RiskLevel
  category: string
  description: string
  check: "prg" | "scx" | "dbf"
  regex?: RegExp
  dbfCheck?: (info: { hasMemo: boolean; hasGeneral: boolean }) => boolean
}

const RISK_PATTERNS: RiskPattern[] = [
  // RED — high migration risk
  {
    level: "red",
    category: "ActiveX/OLE controls",
    description: "No modern equivalent guaranteed — requires manual replacement",
    check: "scx",
    regex: /\bOLECONTROL\b|OLEBoundControl|\.OCX\b/i,
  },
  {
    level: "red",
    category: "DLL dependencies",
    description: "Windows API calls must be replaced with .NET equivalents",
    check: "prg",
    regex: /\bDECLARE\s+\w+\s+IN\s+/i,
  },
  {
    level: "red",
    category: "Macro substitution",
    description: "Dynamic code generation — requires case-by-case analysis",
    check: "prg",
    regex: /&[a-zA-Z_]\w*\.?/i,
  },
  {
    level: "red",
    category: "General fields (OLE)",
    description: "Binary OLE data embedded in DBF — extraction is unreliable",
    check: "dbf",
    dbfCheck: (info) => info.hasGeneral,
  },
  {
    level: "red",
    category: "EXECSCRIPT/EVALUATE",
    description: "Dynamic code execution — unpredictable behavior at runtime",
    check: "prg",
    regex: /\b(EXECSCRIPT|EVALUATE)\s*\(/i,
  },

  // YELLOW — moderate migration risk
  {
    level: "yellow",
    category: "SCATTER/GATHER MEMVAR",
    description: "Tight data-UI coupling — needs refactoring to ORM/DTO pattern",
    check: "prg",
    regex: /\b(SCATTER|GATHER)\s+(MEMVAR|FIELDS|NAME)\b/i,
  },
  {
    level: "yellow",
    category: "Deep THISFORM nesting",
    description: "Complex form hierarchies — UI restructuring needed",
    check: "prg",
    regex: /THISFORM(\.\w+){4,}/i,
  },
  {
    level: "yellow",
    category: "SCAN/ENDSCAN loops",
    description: "Cursor-based iteration — replace with LINQ or SQL queries",
    check: "prg",
    regex: /\bSCAN\b(?!\s*\()/i,
  },
  {
    level: "yellow",
    category: "Memo fields (FPT)",
    description: "Variable-length text in companion files — needs VARCHAR/TEXT mapping",
    check: "dbf",
    dbfCheck: (info) => info.hasMemo,
  },
  {
    level: "yellow",
    category: "SQL Pass-Through",
    description: "Direct ODBC calls — must migrate to ADO.NET/EF Core",
    check: "prg",
    regex: /\bSQLEXEC\s*\(|SQLCONNECT\s*\(/i,
  },

  // GREEN — low migration risk
  {
    level: "green",
    category: "Standard data types",
    description: "Clean DBF tables with C/N/D/L fields — straightforward schema mapping",
    check: "dbf",
    dbfCheck: (info) => !info.hasGeneral && !info.hasMemo,
  },
  {
    level: "green",
    category: "Clean PRG code",
    description: "Procedural code without macros or DLL calls — direct translation possible",
    check: "prg",
    // This is detected as absence of red/yellow patterns — handled in logic
  },
]

export async function analyzeRisk(rootPath: string): Promise<RiskResult> {
  const flagsMap = new Map<string, RiskFlag>()

  // Initialize all risk flags
  for (const pattern of RISK_PATTERNS) {
    flagsMap.set(pattern.category, {
      level: pattern.level,
      category: pattern.category,
      description: pattern.description,
      count: 0,
      files: [],
    })
  }

  // Check PRG files
  const prgFiles = await glob("**/*.prg", {
    cwd: rootPath,
    nocase: true,
    absolute: true,
  })

  let cleanPrgCount = 0

  for (const file of prgFiles) {
    try {
      const parsed = await parsePrg(file)
      const codeLines = extractCode(parsed.lines)
      const relativePath = file.replace(rootPath, "").replace(/^[\\/]/, "")

      let hasIssue = false
      for (const pattern of RISK_PATTERNS) {
        if (pattern.check !== "prg" || !pattern.regex) continue
        for (const line of codeLines) {
          if (pattern.regex.test(line)) {
            const flag = flagsMap.get(pattern.category)!
            if (!flag.files.includes(relativePath)) {
              flag.files.push(relativePath)
              flag.count++
            }
            hasIssue = true
            break
          }
        }
      }
      if (!hasIssue) cleanPrgCount++
    } catch {
      // Skip
    }
  }

  // Update clean PRG count
  const cleanPrgFlag = flagsMap.get("Clean PRG code")
  if (cleanPrgFlag) {
    cleanPrgFlag.count = cleanPrgCount
  }

  // Check SCX/VCX files
  const formFiles = await glob("**/*.{scx,vcx}", {
    cwd: rootPath,
    nocase: true,
    absolute: true,
  })

  for (const file of formFiles) {
    try {
      const scxInfo = await parseScx(file)
      if (!scxInfo.textContent) continue
      const relativePath = file.replace(rootPath, "").replace(/^[\\/]/, "")
      const lines = scxInfo.textContent.split("\n")

      for (const pattern of RISK_PATTERNS) {
        if (pattern.check !== "scx" || !pattern.regex) continue
        for (const line of lines) {
          if (pattern.regex.test(line)) {
            const flag = flagsMap.get(pattern.category)!
            if (!flag.files.includes(relativePath)) {
              flag.files.push(relativePath)
              flag.count++
            }
            break
          }
        }
      }
    } catch {
      // Skip
    }
  }

  // Check DBF files
  const dbfFiles = await glob("**/*.dbf", {
    cwd: rootPath,
    nocase: true,
    absolute: true,
  })

  let cleanDbfCount = 0

  for (const file of dbfFiles) {
    try {
      const info = await parseDbfHeader(file)
      const relativePath = file.replace(rootPath, "").replace(/^[\\/]/, "")

      for (const pattern of RISK_PATTERNS) {
        if (pattern.check !== "dbf" || !pattern.dbfCheck) continue
        if (pattern.dbfCheck(info)) {
          const flag = flagsMap.get(pattern.category)!
          flag.files.push(relativePath)
          flag.count++
        }
      }

      if (!info.hasGeneral && !info.hasMemo) cleanDbfCount++
    } catch {
      // Skip
    }
  }

  // Update standard data types count
  const standardFlag = flagsMap.get("Standard data types")
  if (standardFlag) {
    standardFlag.count = cleanDbfCount
  }

  // Collect results
  const flags = Array.from(flagsMap.values()).filter((f) => f.count > 0)

  // Sort: red first, then yellow, then green
  const order: Record<RiskLevel, number> = { red: 0, yellow: 1, green: 2 }
  flags.sort((a, b) => order[a.level] - order[b.level])

  return {
    flags,
    redCount: flags.filter((f) => f.level === "red").reduce((s, f) => s + f.count, 0),
    yellowCount: flags.filter((f) => f.level === "yellow").reduce((s, f) => s + f.count, 0),
    greenCount: flags.filter((f) => f.level === "green").reduce((s, f) => s + f.count, 0),
  }
}
