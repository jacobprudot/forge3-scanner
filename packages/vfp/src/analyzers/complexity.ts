import { glob } from "glob"
import { parsePrg, extractCode } from "../parsers/prg.js"
import { parseScx } from "../parsers/scx.js"
import type { ComplexityResult, PatternMatch } from "../types.js"

interface PatternDef {
  id: string
  description: string
  regex: RegExp
  weight: number
}

/**
 * VFP9 complexity patterns — each has a weight that contributes to the score.
 * Higher weight = harder to migrate.
 */
const PATTERNS: PatternDef[] = [
  {
    id: "macro_substitution",
    description: "Macro substitution (&variable) — dynamic code generation",
    regex: /&[a-zA-Z_]\w*\.?/i,
    weight: 3,
  },
  {
    id: "scatter_gather",
    description: "SCATTER/GATHER MEMVAR — tight data-UI coupling",
    regex: /\b(SCATTER|GATHER)\s+(MEMVAR|FIELDS|NAME)\b/i,
    weight: 2,
  },
  {
    id: "thisform_deep",
    description: "Deep THISFORM nesting (>3 levels)",
    regex: /THISFORM(\.\w+){4,}/i,
    weight: 2,
  },
  {
    id: "scan_endscan",
    description: "SCAN/ENDSCAN loops — cursor-based iteration",
    regex: /\bSCAN\b(?!\s*\()/i,
    weight: 1,
  },
  {
    id: "do_case_complex",
    description: "DO CASE with many branches — complex conditional logic",
    regex: /\bDO\s+CASE\b/i,
    weight: 1,
  },
  {
    id: "activex_ole",
    description: "ActiveX/OLE controls — binary dependencies",
    regex: /\b(OLECONTROL|OLEBoundControl|CREATEOBJECT\s*\(\s*["'][^"']*\.)/i,
    weight: 3,
  },
  {
    id: "dll_declare",
    description: "DLL DECLARE calls — Windows API dependencies",
    regex: /\bDECLARE\s+\w+\s+IN\s+/i,
    weight: 3,
  },
  {
    id: "execscript",
    description: "EXECSCRIPT/EVALUATE — dynamic code execution",
    regex: /\b(EXECSCRIPT|EVALUATE)\s*\(/i,
    weight: 3,
  },
  {
    id: "set_commands",
    description: "SET commands — environment-dependent behavior",
    regex: /\bSET\s+(EXACT|DELETED|TALK|SAFETY|EXCLUSIVE|MULTILOCKS)\s+(ON|OFF)\b/i,
    weight: 1,
  },
  {
    id: "sql_passthrough",
    description: "SQL Pass-Through — direct ODBC calls",
    regex: /\bSQLEXEC\s*\(|SQLCONNECT\s*\(|SQLDISCONNECT\s*\(/i,
    weight: 2,
  },
]

export async function analyzeComplexity(rootPath: string): Promise<ComplexityResult> {
  const patternResults = new Map<string, PatternMatch>()

  // Initialize pattern results
  for (const p of PATTERNS) {
    patternResults.set(p.id, {
      pattern: p.id,
      description: p.description,
      files: [],
      count: 0,
      weight: p.weight,
    })
  }

  // Scan .PRG files
  const prgFiles = await glob("**/*.prg", {
    cwd: rootPath,
    nocase: true,
    absolute: true,
  })

  for (const file of prgFiles) {
    try {
      const parsed = await parsePrg(file)
      const codeLines = extractCode(parsed.lines)
      const relativePath = file.replace(rootPath, "").replace(/^[\\/]/, "")

      for (const pattern of PATTERNS) {
        let fileHits = 0
        for (const line of codeLines) {
          if (pattern.regex.test(line)) {
            fileHits++
          }
        }
        if (fileHits > 0) {
          const result = patternResults.get(pattern.id)!
          result.files.push(relativePath)
          result.count += fileHits
        }
      }
    } catch {
      // Skip unreadable files
    }
  }

  // Scan .SCX/.VCX memo content for patterns
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

      for (const pattern of PATTERNS) {
        let fileHits = 0
        for (const line of lines) {
          if (pattern.regex.test(line)) {
            fileHits++
          }
        }
        if (fileHits > 0) {
          const result = patternResults.get(pattern.id)!
          if (!result.files.includes(relativePath)) {
            result.files.push(relativePath)
          }
          result.count += fileHits
        }
      }
    } catch {
      // Skip unreadable files
    }
  }

  // Calculate weighted score (1-10)
  const patterns = Array.from(patternResults.values()).filter((p) => p.count > 0)
  let totalPatternHits = 0
  let weightedSum = 0

  for (const p of patterns) {
    totalPatternHits += p.count
    // Diminishing returns: log scale per pattern to avoid one pattern dominating
    weightedSum += p.weight * Math.log2(p.count + 1)
  }

  // Volume factor: more files = more complexity
  const volumeFactor = Math.log2(prgFiles.length + formFiles.length + 1) * 0.5

  // Normalize to 1-10 scale
  const rawScore = weightedSum + volumeFactor
  const score = Math.min(10, Math.max(1, Math.round(rawScore * 10) / 10))

  const label = getComplexityLabel(score)

  return { score, label, patterns, totalPatternHits }
}

function getComplexityLabel(score: number): string {
  if (score <= 2) return "SIMPLE"
  if (score <= 4) return "MODERATE"
  if (score <= 6) return "DIFFICULT"
  if (score <= 8) return "VERY DIFFICULT"
  return "EXTREME"
}
