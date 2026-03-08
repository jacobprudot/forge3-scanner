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

/* ── Full Report (VFP9 Deep Analysis) ── */

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

/* ── Technology Detection ── */

export interface TechnologyDetection {
  technology: string        // "vfp9" | "oracle-forms" | "vb6" | "delphi" | "cobol" | "powerbuilder" | "access" | "clipper" | "unknown"
  confidence: number        // 0-1
  evidence: string[]        // what files/patterns led to this detection
  fileCount: number         // how many files of this tech were found
}

export interface DetectionResult {
  rootPath: string
  scannedAt: string
  primary: TechnologyDetection          // the dominant technology
  secondary: TechnologyDetection[]      // other technologies also detected
  analysisAvailable: boolean           // true if deep analysis exists for primary
}

/* ── Basic Analysis (non-VFP technologies) ── */

export interface BasicAnalysis {
  technology: string
  inventory: {
    fileCounts: { extension: string; count: number; totalLines: number; totalSizeBytes: number }[]
    totalFiles: number
    totalLines: number
    totalSizeBytes: number
  }
  deepAnalysisAvailable: false
  message: string  // "Deep analysis for Oracle Forms coming soon. Contact forge3.dev for manual assessment."
}

/* ── Migration Profile ── */

export interface MigrationProfile {
  version: string
  generatedAt: string
  source: {
    technology: string
    complexity: number | null     // only for deep-analyzed tech
    securityGrade: string | null  // only for deep-analyzed tech
    riskSummary: { red: number; yellow: number; green: number } | null
    inventory: {
      totalFiles: number
      totalLines: number
      totalSizeBytes: number
      tables: number
      records: number
    }
  }
  suggestedTarget: {
    primary: string              // e.g. ".NET 8 / Blazor"
    database: string             // e.g. "PostgreSQL"
    reasoning: string            // why this target
  }
  estimate: {
    assessmentRange: string      // "$2,000 — $5,000"
    migrationRange: string       // "$15K — $80K"
    timelineWeeks: string        // "6 — 12"
    confidence: string           // "high" | "medium" | "low"
  }
  skillsNeeded: string[]          // what the agent team needs to know
  knowledgeGaps: string[]         // what we don't know yet and need to research
}

/* ── Universal Scan Report ── */

export interface UniversalScanReport {
  version: string
  scannedAt: string
  rootPath: string
  detection: DetectionResult
  analysis: ScanReport | BasicAnalysis  // deep or basic depending on tech
  profile: MigrationProfile
}

/* ── CLI Options ── */

export type OutputFormat = "terminal" | "json" | "html"

export interface ScanOptions {
  path: string
  format: OutputFormat
  output?: string           // file path for saving report
  detectOnly?: boolean      // just run detection without analysis
}
