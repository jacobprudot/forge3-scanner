/* ── Inventory ── */

export interface FileCount {
  extension: string
  count: number
  totalLines: number
  totalSizeBytes: number
}

export interface DbfTableInfo {
  path: string
  name: string
  recordCount: number
  fieldCount: number
  sizeBytes: number
  lastModified: Date
  fields: DbfField[]
  hasMemo: boolean
  hasGeneral: boolean
}

export interface DbfField {
  name: string
  type: string       // C, N, D, L, M, G, etc.
  length: number
  decimals: number
}

export interface InventoryResult {
  scannedAt: string
  rootPath: string
  fileCounts: FileCount[]
  totalFiles: number
  totalLines: number
  totalSizeBytes: number
  tables: DbfTableInfo[]
  totalRecords: number
  indexFiles: number
}

/* ── Complexity ── */

export interface PatternMatch {
  pattern: string
  description: string
  files: string[]
  count: number
  weight: number
}

export interface ComplexityResult {
  score: number             // 1-10
  label: string             // SIMPLE, MODERATE, DIFFICULT, VERY DIFFICULT, EXTREME
  patterns: PatternMatch[]
  totalPatternHits: number
}

/* ── Security ── */

export type Severity = "critical" | "high" | "medium" | "low" | "info"

export interface SecurityFinding {
  id: string
  title: string
  description: string
  severity: Severity
  category: "platform" | "code" | "data" | "audit"
  files: string[]
  count: number
}

export interface CveEntry {
  id: string
  severity: Severity
  cvss: number
  description: string
}

export interface SecurityResult {
  grade: string             // A, B, C, D, F
  findings: SecurityFinding[]
  cves: CveEntry[]
  totalFindings: number
}

/* ── Risk ── */

export type RiskLevel = "red" | "yellow" | "green"

export interface RiskFlag {
  level: RiskLevel
  category: string
  description: string
  count: number
  files: string[]
}

export interface RiskResult {
  flags: RiskFlag[]
  redCount: number
  yellowCount: number
  greenCount: number
}

/* ── Full Report ── */

export interface ScanReport {
  version: string
  scannedAt: string
  rootPath: string
  technology: "vfp9"
  inventory: InventoryResult
  complexity: ComplexityResult
  security: SecurityResult
  risk: RiskResult
}

/* ── CLI Options ── */

export type OutputFormat = "terminal" | "json" | "html"

export interface ScanOptions {
  path: string
  format: OutputFormat
  output?: string           // file path for saving report
}
