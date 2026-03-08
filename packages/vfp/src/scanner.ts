import { resolve } from "node:path"
import { access } from "node:fs/promises"
import { analyzeInventory } from "./analyzers/inventory.js"
import { analyzeComplexity } from "./analyzers/complexity.js"
import { analyzeSecurity } from "./analyzers/security.js"
import { analyzeRisk } from "./analyzers/risk.js"
import { detectTechnology } from "./detector.js"
import { analyzeBasic } from "./basic-analyzer.js"
import { generateProfileFromDeep, generateProfileFromBasic } from "./migration-profile.js"
import type {
  ScanReport,
  ScanOptions,
  UniversalScanReport,
  DetectionResult,
  BasicAnalysis,
} from "./types.js"

const VERSION = "0.1.0"

/**
 * Run full deep VFP9 analysis (original behavior).
 * Preserved for backward compatibility.
 */
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

/**
 * Universal scan: detect technology, run appropriate analysis, generate migration profile.
 */
export async function universalScan(options: ScanOptions): Promise<UniversalScanReport> {
  const rootPath = resolve(options.path)

  // Verify path exists
  try {
    await access(rootPath)
  } catch {
    throw new Error(`Path not found: ${rootPath}`)
  }

  // Step 1: Detect technology
  const detection = await detectTechnology(rootPath)

  // Step 2: Run appropriate analysis
  let analysis: ScanReport | BasicAnalysis
  let profile

  if (detection.primary.technology === "vfp9") {
    // Deep analysis for VFP9
    const [inventory, complexity, security, risk] = await Promise.all([
      analyzeInventory(rootPath),
      analyzeComplexity(rootPath),
      analyzeSecurity(rootPath),
      analyzeRisk(rootPath),
    ])

    const deepReport: ScanReport = {
      version: VERSION,
      scannedAt: new Date().toISOString(),
      rootPath,
      technology: "vfp9",
      inventory,
      complexity,
      security,
      risk,
    }

    analysis = deepReport
    profile = generateProfileFromDeep(deepReport)
  } else {
    // Basic analysis for other technologies
    const basicAnalysis = await analyzeBasic(rootPath, detection.primary.technology)
    analysis = basicAnalysis
    profile = generateProfileFromBasic(basicAnalysis)
  }

  return {
    version: VERSION,
    scannedAt: new Date().toISOString(),
    rootPath,
    detection,
    analysis,
    profile,
  }
}

/**
 * Run detection only (no analysis).
 */
export async function detectOnly(path: string): Promise<DetectionResult> {
  const rootPath = resolve(path)

  try {
    await access(rootPath)
  } catch {
    throw new Error(`Path not found: ${rootPath}`)
  }

  return detectTechnology(rootPath)
}

export type { ScanReport, ScanOptions, UniversalScanReport, DetectionResult }
