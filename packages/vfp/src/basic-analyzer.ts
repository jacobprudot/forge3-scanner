import { readFile, stat } from "node:fs/promises"
import { extname } from "node:path"
import { glob } from "glob"
import type { BasicAnalysis } from "./types.js"

/** Extensions considered "code" for line counting purposes */
const CODE_EXTENSIONS = new Set([
  // VFP / Clipper
  "prg", "ch",
  // Oracle
  "sql", "pll", "pld",
  // VB6
  "bas", "cls", "frm", "vbp",
  // Delphi
  "pas", "dpr", "dpk",
  // COBOL
  "cbl", "cob", "cpy", "jcl", "pco",
  // PowerBuilder
  "srd", "sra", "srw",
])

const TECHNOLOGY_NAMES: Record<string, string> = {
  "vfp9": "Visual FoxPro 9",
  "oracle-forms": "Oracle Forms",
  "vb6": "Visual Basic 6",
  "delphi": "Delphi / Object Pascal",
  "cobol": "COBOL",
  "powerbuilder": "PowerBuilder",
  "access": "Microsoft Access",
  "clipper": "Clipper / Harbour",
  "unknown": "Unknown",
}

/**
 * Lightweight analyzer for technologies without deep analysis support.
 * Provides file inventory, line counts, and size information.
 */
export async function analyzeBasic(rootPath: string, technology: string): Promise<BasicAnalysis> {
  const allFiles = await glob("**/*.*", {
    cwd: rootPath,
    nocase: true,
    absolute: true,
    ignore: ["**/node_modules/**", "**/.git/**"],
  })

  const extensionMap = new Map<string, { count: number; totalLines: number; totalSizeBytes: number }>()
  let totalFiles = 0
  let totalLines = 0
  let totalSizeBytes = 0

  for (const file of allFiles) {
    const ext = extname(file).slice(1).toLowerCase()
    if (!ext) continue

    try {
      const fileStat = await stat(file)
      const size = fileStat.size

      let lineCount = 0
      if (CODE_EXTENSIONS.has(ext)) {
        try {
          const buffer = await readFile(file)
          let content: string
          try {
            content = new TextDecoder("utf-8", { fatal: true }).decode(buffer)
          } catch {
            content = new TextDecoder("latin1").decode(buffer)
          }
          lineCount = content.split("\n").length
        } catch {
          // Skip unreadable files for line counting
        }
      }

      if (!extensionMap.has(ext)) {
        extensionMap.set(ext, { count: 0, totalLines: 0, totalSizeBytes: 0 })
      }

      const entry = extensionMap.get(ext)!
      entry.count++
      entry.totalLines += lineCount
      entry.totalSizeBytes += size

      totalFiles++
      totalLines += lineCount
      totalSizeBytes += size
    } catch {
      // Skip files we can't stat
    }
  }

  // Convert to sorted array
  const fileCounts = Array.from(extensionMap.entries())
    .map(([extension, data]) => ({
      extension,
      count: data.count,
      totalLines: data.totalLines,
      totalSizeBytes: data.totalSizeBytes,
    }))
    .sort((a, b) => b.count - a.count)

  const techName = TECHNOLOGY_NAMES[technology] ?? technology

  return {
    technology,
    inventory: {
      fileCounts,
      totalFiles,
      totalLines,
      totalSizeBytes,
    },
    deepAnalysisAvailable: false as const,
    message: `Deep analysis for ${techName} coming soon. Contact forge3.dev for manual assessment.`,
  }
}
