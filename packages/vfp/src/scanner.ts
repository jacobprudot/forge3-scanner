import { resolve } from "node:path"
import { access } from "node:fs/promises"
import { analyzeInventory } from "./analyzers/inventory.js"
import { analyzeComplexity } from "./analyzers/complexity.js"
import { analyzeSecurity } from "./analyzers/security.js"
import { analyzeRisk } from "./analyzers/risk.js"
import type { ScanReport, ScanOptions } from "./types.js"

const VERSION = "0.1.0"

export async function scan(options: ScanOptions): Promise<ScanReport> {
  const rootPath = resolve(options.path)

  // Verify path exists
  try {
    await access(rootPath)
  } catch {
    throw new Error(`Path not found: ${rootPath}`)
  }

  // Run all analyzers
  const [inventory, complexity, security, risk] = await Promise.all([
    analyzeInventory(rootPath),
    analyzeComplexity(rootPath),
    analyzeSecurity(rootPath),
    analyzeRisk(rootPath),
  ])

  return {
    version: VERSION,
    scannedAt: new Date().toISOString(),
    rootPath,
    technology: "vfp9",
    inventory,
    complexity,
    security,
    risk,
  }
}

export type { ScanReport, ScanOptions }
