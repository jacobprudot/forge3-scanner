import { readFile, stat } from "node:fs/promises"
import { resolve, extname } from "node:path"
import { glob } from "glob"
import type { TechnologyDetection, DetectionResult } from "./types.js"

/**
 * Technology signature definitions.
 * Each technology has a set of file extensions and optional content patterns.
 */
interface TechnologySignature {
  id: string
  name: string
  extensions: string[]
  /** Extensions that are shared with other technologies and need disambiguation */
  ambiguousExtensions?: string[]
  /** Content patterns that confirm this technology (checked in ambiguous files) */
  confirmPatterns?: RegExp[]
  /** Content patterns that rule OUT this technology */
  excludePatterns?: RegExp[]
}

const TECHNOLOGY_SIGNATURES: TechnologySignature[] = [
  {
    id: "vfp9",
    name: "Visual FoxPro 9",
    extensions: ["scx", "vcx", "frx", "mnx", "dbc", "pjx", "cdx", "idx", "fpt", "dbf"],
    ambiguousExtensions: ["prg"],
    confirmPatterns: [
      /\bTHISFORM\b/i,
      /\bSCATTER\b/i,
      /\bGATHER\b/i,
      /\bCREATEOBJECT\s*\(/i,
      /\bDODEFAULT\s*\(/i,
      /\bDEFINE\s+CLASS\b/i,
      /\bNEWOBJECT\s*\(/i,
      /\bSET\s+CLASSLIB\b/i,
      /\bEXECSCRIPT\s*\(/i,
      /\bSQLCONNECT\s*\(/i,
      /\bSQLEXEC\s*\(/i,
      /\bDECLARE\s+\w+\s+IN\s+\w+\.dll\b/i,
    ],
  },
  {
    id: "oracle-forms",
    name: "Oracle Forms",
    extensions: ["fmb", "fmx", "mmb", "mmx", "pll", "pld", "olb", "rdf"],
    ambiguousExtensions: ["sql"],
    confirmPatterns: [
      /\bCREATE\s+OR\s+REPLACE\b/i,
      /\bPACKAGE\s+BODY\b/i,
      /\bPL\/SQL\b/i,
      /\bBEGIN\b[\s\S]*?\bEND\s*;/i,
      /\bDBMS_\w+\./i,
    ],
  },
  {
    id: "vb6",
    name: "Visual Basic 6",
    extensions: ["vbp", "bas", "cls", "vbw"],
    ambiguousExtensions: ["frm", "ocx"],
    confirmPatterns: [
      /^VERSION\s+\d+\.\d+/m,
      /\bAttribute\s+VB_Name\b/i,
      /\bBegin\s+VB\./i,
      /\bPrivate\s+Sub\s+\w+_/i,
      /\bDim\s+\w+\s+As\b/i,
    ],
  },
  {
    id: "delphi",
    name: "Delphi / Object Pascal",
    extensions: ["pas", "dfm", "dpr", "dpk", "dproj", "bpl"],
  },
  {
    id: "cobol",
    name: "COBOL",
    extensions: ["cbl", "cob", "cpy", "jcl", "pco"],
  },
  {
    id: "powerbuilder",
    name: "PowerBuilder",
    extensions: ["pbl", "pbt", "pbw", "srd", "sra", "srw"],
  },
  {
    id: "access",
    name: "Microsoft Access",
    extensions: ["mdb", "accdb", "mde", "accde", "ldb"],
  },
  {
    id: "clipper",
    name: "Clipper / Harbour",
    extensions: ["ch", "hbp"],
    ambiguousExtensions: ["prg"],
    confirmPatterns: [
      /\b@\s*\d+\s*,\s*\d+\s*SAY\b/i,
      /\bSET\s+PRINT\s+(ON|OFF)\b/i,
    ],
    excludePatterns: [
      /\bTHISFORM\b/i,
      /\bSCATTER\b/i,
      /\bGATHER\b/i,
      /\bCREATEOBJECT\s*\(/i,
      /\bDODEFAULT\s*\(/i,
      /\bEXECSCRIPT\s*\(/i,
      /\bSQLCONNECT\s*\(/i,
      /\bDECLARE\s+\w+\s+IN\s+\w+\.dll\b/i,
    ],
  },
]

/**
 * Scan a directory and detect what legacy technologies are present.
 * Fast: primarily uses file extension scanning with quick header checks
 * only for disambiguation.
 */
export async function detectTechnology(rootPath: string): Promise<DetectionResult> {
  const absoluteRoot = resolve(rootPath)

  // Step 1: Catalog all files by extension
  const allFiles = await glob("**/*.*", {
    cwd: absoluteRoot,
    nocase: true,
    absolute: true,
    ignore: ["**/node_modules/**", "**/.git/**"],
  })

  const filesByExtension = new Map<string, string[]>()
  for (const file of allFiles) {
    const ext = extname(file).slice(1).toLowerCase()
    if (!ext) continue
    if (!filesByExtension.has(ext)) {
      filesByExtension.set(ext, [])
    }
    filesByExtension.get(ext)!.push(file)
  }

  // Step 2: Score each technology
  const detections: TechnologyDetection[] = []

  for (const sig of TECHNOLOGY_SIGNATURES) {
    const evidence: string[] = []
    let fileCount = 0
    let uniqueExtensions = 0

    // Check primary (non-ambiguous) extensions
    for (const ext of sig.extensions) {
      const files = filesByExtension.get(ext)
      if (files && files.length > 0) {
        fileCount += files.length
        uniqueExtensions++
        evidence.push(`${files.length} .${ext} file${files.length > 1 ? "s" : ""}`)
      }
    }

    // Check ambiguous extensions with content patterns
    if (sig.ambiguousExtensions) {
      for (const ext of sig.ambiguousExtensions) {
        const files = filesByExtension.get(ext)
        if (!files || files.length === 0) continue

        // Sample up to 10 files for content check
        const sampled = files.slice(0, 10)
        let confirmedCount = 0

        for (const file of sampled) {
          try {
            const fileStat = await stat(file)
            // Skip files > 2MB for speed
            if (fileStat.size > 2 * 1024 * 1024) continue

            const buffer = await readFile(file)
            let content: string
            try {
              content = new TextDecoder("utf-8", { fatal: true }).decode(buffer)
            } catch {
              content = new TextDecoder("latin1").decode(buffer)
            }

            // Check exclude patterns first (for disambiguation)
            if (sig.excludePatterns) {
              const excluded = sig.excludePatterns.some((p) => p.test(content))
              if (excluded) continue
            }

            // Check confirm patterns
            if (sig.confirmPatterns) {
              const confirmed = sig.confirmPatterns.some((p) => p.test(content))
              if (confirmed) confirmedCount++
            } else {
              // No confirm patterns needed — just having the extension counts
              confirmedCount++
            }
          } catch {
            // Skip unreadable files
          }
        }

        if (confirmedCount > 0) {
          // Extrapolate from sample to full count
          const ratio = confirmedCount / sampled.length
          const estimatedCount = Math.round(files.length * ratio)
          fileCount += estimatedCount
          if (estimatedCount > 0) {
            uniqueExtensions++
            evidence.push(`~${estimatedCount} .${ext} file${estimatedCount > 1 ? "s" : ""} (${sig.name} patterns confirmed)`)
          }
        }
      }
    }

    if (fileCount === 0) continue

    // Calculate confidence based on file count and extension variety
    let confidence = 0

    // Extension variety contributes heavily (more variety = more confident)
    const totalPossibleExts = sig.extensions.length + (sig.ambiguousExtensions?.length ?? 0)
    const varietyScore = uniqueExtensions / totalPossibleExts

    // File count contributes with diminishing returns
    const countScore = Math.min(1, Math.log10(fileCount + 1) / 2)

    confidence = varietyScore * 0.6 + countScore * 0.4
    confidence = Math.round(confidence * 100) / 100

    detections.push({
      technology: sig.id,
      confidence,
      evidence,
      fileCount,
    })
  }

  // Sort by confidence descending
  detections.sort((a, b) => b.confidence - a.confidence)

  const primary: TechnologyDetection = detections[0] ?? {
    technology: "unknown",
    confidence: 0,
    evidence: ["No recognized legacy technology files found"],
    fileCount: 0,
  }

  const secondary = detections.slice(1).filter((d) => d.confidence > 0.1)

  // Deep analysis is only available for VFP9 (for now)
  const analysisAvailable = primary.technology === "vfp9"

  return {
    rootPath: absoluteRoot,
    scannedAt: new Date().toISOString(),
    primary,
    secondary,
    analysisAvailable,
  }
}
