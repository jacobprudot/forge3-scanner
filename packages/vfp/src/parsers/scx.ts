import { readFile } from "node:fs/promises"

export interface ScxInfo {
  path: string
  name: string
  sizeBytes: number
  /** Whether we detected form-related content */
  isForm: boolean
  /** Extracted text content (from memo fields, best-effort) */
  textContent: string
}

/**
 * .SCX/.VCX/.FRX files are essentially DBF files with memo (.SCT/.VCT/.FRT) companions.
 * The memo files contain the actual form/class/report code.
 *
 * For scanning purposes, we read the memo file (.SCT for forms, .VCT for classes)
 * as raw text to extract code patterns. VFP memo files use a block-based format,
 * but the text content is still readable with basic extraction.
 */
export async function parseScx(filePath: string): Promise<ScxInfo> {
  const name = filePath.split(/[\\/]/).pop()?.replace(/\.(scx|vcx|frx)$/i, "") ?? filePath

  // Find the companion memo file
  const memoPath = filePath
    .replace(/\.scx$/i, ".sct")
    .replace(/\.vcx$/i, ".vct")
    .replace(/\.frx$/i, ".frt")

  let textContent = ""
  let sizeBytes = 0

  try {
    const buffer = await readFile(memoPath)
    sizeBytes = buffer.length

    // Extract readable ASCII text from memo blocks
    // Memo files have binary headers but text content is readable
    textContent = extractTextFromMemo(buffer)
  } catch {
    // Memo file might not exist or be unreadable
    try {
      const buffer = await readFile(filePath)
      sizeBytes = buffer.length
      textContent = extractTextFromMemo(buffer)
    } catch {
      // File unreadable
    }
  }

  const isForm = /\.scx$/i.test(filePath)

  return { path: filePath, name, sizeBytes, isForm, textContent }
}

/**
 * Extract readable text from a VFP memo/binary file.
 * This is a best-effort extraction — we pull out ASCII strings
 * that look like code (long enough, printable characters).
 */
function extractTextFromMemo(buffer: Buffer): string {
  const chunks: string[] = []
  let current = ""

  for (let i = 0; i < buffer.length; i++) {
    const byte = buffer[i]
    // Printable ASCII range + common whitespace
    if ((byte >= 32 && byte <= 126) || byte === 9 || byte === 10 || byte === 13) {
      current += String.fromCharCode(byte)
    } else {
      if (current.length >= 4) {
        chunks.push(current)
      }
      current = ""
    }
  }
  if (current.length >= 4) {
    chunks.push(current)
  }

  return chunks.join("\n")
}
