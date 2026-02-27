import { stat } from "node:fs/promises"
import { glob } from "glob"
import { parsePrg } from "../parsers/prg.js"
import { parseDbfHeader } from "../parsers/dbf.js"
import type { FileCount, InventoryResult } from "../types.js"

const VFP_EXTENSIONS = [
  { ext: "prg", label: "Program files" },
  { ext: "scx", label: "Form files" },
  { ext: "vcx", label: "Class libraries" },
  { ext: "frx", label: "Report files" },
  { ext: "mnx", label: "Menu files" },
  { ext: "dbc", label: "Database containers" },
  { ext: "dbf", label: "Data tables" },
  { ext: "cdx", label: "Compound indexes" },
  { ext: "idx", label: "Single indexes" },
  { ext: "fpt", label: "Memo files" },
]

export async function analyzeInventory(rootPath: string): Promise<InventoryResult> {
  const fileCounts: FileCount[] = []
  let totalFiles = 0
  let totalLines = 0
  let totalSizeBytes = 0
  let totalRecords = 0
  let indexFiles = 0

  for (const { ext } of VFP_EXTENSIONS) {
    const pattern = `**/*.${ext}`
    const files = await glob(pattern, {
      cwd: rootPath,
      nocase: true,
      absolute: true,
    })

    if (files.length === 0) continue

    let extLines = 0
    let extSize = 0

    for (const file of files) {
      try {
        const fileStat = await stat(file)
        extSize += fileStat.size

        // Count lines for PRG files
        if (ext === "prg") {
          const parsed = await parsePrg(file)
          extLines += parsed.lineCount
        }
      } catch {
        // Skip unreadable files
      }
    }

    if (ext === "cdx" || ext === "idx") {
      indexFiles += files.length
    }

    fileCounts.push({
      extension: ext,
      count: files.length,
      totalLines: extLines,
      totalSizeBytes: extSize,
    })

    totalFiles += files.length
    totalLines += extLines
    totalSizeBytes += extSize
  }

  // Parse DBF tables for record counts and field info
  const dbfFiles = await glob("**/*.dbf", {
    cwd: rootPath,
    nocase: true,
    absolute: true,
  })

  const tables = []
  for (const dbfFile of dbfFiles) {
    try {
      const info = await parseDbfHeader(dbfFile)
      tables.push(info)
      totalRecords += info.recordCount
    } catch {
      // Skip unreadable DBF files
    }
  }

  return {
    scannedAt: new Date().toISOString(),
    rootPath,
    fileCounts,
    totalFiles,
    totalLines,
    totalSizeBytes,
    tables,
    totalRecords,
    indexFiles,
  }
}
