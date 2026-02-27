import { readFile } from "node:fs/promises"

export interface PrgParseResult {
  path: string
  lines: string[]
  lineCount: number
  /** Non-empty, non-comment lines */
  codeLineCount: number
}

/**
 * Parse a .PRG file (plain text FoxPro source code).
 * Handles common encodings: UTF-8, Latin-1, CP1252.
 */
export async function parsePrg(filePath: string): Promise<PrgParseResult> {
  const buffer = await readFile(filePath)

  // Try UTF-8 first, fallback to Latin-1 for old VFP files
  let content: string
  try {
    content = new TextDecoder("utf-8", { fatal: true }).decode(buffer)
  } catch {
    content = new TextDecoder("latin1").decode(buffer)
  }

  // Normalize line endings
  const lines = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n")

  let codeLineCount = 0
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.length > 0 && !trimmed.startsWith("*") && !trimmed.startsWith("&&") && !trimmed.startsWith("NOTE ")) {
      codeLineCount++
    }
  }

  return {
    path: filePath,
    lines,
    lineCount: lines.length,
    codeLineCount,
  }
}

/**
 * Extract all text content from a PRG for pattern matching.
 * Strips comments but preserves code structure.
 */
export function extractCode(lines: string[]): string[] {
  return lines
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("*") && !line.startsWith("&&") && !line.startsWith("NOTE "))
}
