import type { ScanReport, BasicAnalysis, MigrationProfile } from "./types.js"

const VERSION = "0.1.0"

interface TargetSuggestion {
  primary: string
  database: string
  reasoning: string
}

const TARGET_MAP: Record<string, TargetSuggestion> = {
  "vfp9": {
    primary: ".NET 8 / Blazor",
    database: "PostgreSQL",
    reasoning: "VFP9 is a desktop-first data-centric language. .NET 8 with Blazor provides the closest developer experience with Entity Framework Core for data access, while PostgreSQL replaces DBF tables with a modern relational database.",
  },
  "oracle-forms": {
    primary: "Next.js / React",
    database: "PostgreSQL",
    reasoning: "Oracle Forms is a server-side rendering framework. Next.js provides SSR with modern React components. PostgreSQL is the natural open-source replacement for Oracle Database, with full PL/pgSQL support for migrating PL/SQL logic.",
  },
  "vb6": {
    primary: ".NET 8 / Blazor or WPF",
    database: "SQL Server or PostgreSQL",
    reasoning: "VB6 maps naturally to .NET. WPF for desktop-heavy applications, Blazor for web modernization. SQL Server for organizations already in the Microsoft ecosystem, PostgreSQL for those seeking vendor independence.",
  },
  "delphi": {
    primary: ".NET 8 / Blazor",
    database: "PostgreSQL",
    reasoning: "Delphi's Object Pascal maps well to C#. Blazor provides modern component-based UI. PostgreSQL replaces any legacy database layer with strong typing and performance.",
  },
  "cobol": {
    primary: "Java Spring Boot or .NET 8",
    database: "PostgreSQL",
    reasoning: "COBOL's batch processing and transaction patterns align with Java Spring Boot. For organizations preferring Microsoft stack, .NET 8 is equally viable. PostgreSQL handles the data migration from VSAM/IMS/DB2.",
  },
  "powerbuilder": {
    primary: ".NET 8 / Blazor",
    database: "PostgreSQL",
    reasoning: "PowerBuilder's DataWindow and event-driven model maps to Blazor's component architecture. PostgreSQL replaces Sybase/SQL Anywhere as the database layer.",
  },
  "access": {
    primary: "Next.js / React",
    database: "PostgreSQL",
    reasoning: "Access applications are typically data-entry focused. Next.js with React provides a modern web-based replacement. PostgreSQL replaces the Jet/ACE database engine with proper multi-user support and scalability.",
  },
  "clipper": {
    primary: ".NET 8 / Blazor",
    database: "PostgreSQL",
    reasoning: "Clipper's procedural data-centric code maps to C# with Entity Framework. Blazor provides modern UI. PostgreSQL replaces DBF tables with full ACID compliance.",
  },
}

const DEFAULT_TARGET: TargetSuggestion = {
  primary: ".NET 8 / Blazor or Next.js / React",
  database: "PostgreSQL",
  reasoning: "Generic recommendation based on file analysis. A manual assessment is needed to determine the optimal target stack.",
}

/** Security grade multipliers for cost estimation */
const SECURITY_MULTIPLIERS: Record<string, number> = {
  "F": 1.5,
  "D": 1.3,
  "C": 1.15,
  "B": 1.05,
  "A": 1.0,
}

/**
 * Generate a migration profile from a deep VFP scan report.
 */
export function generateProfileFromDeep(report: ScanReport): MigrationProfile {
  const { inventory: inv, complexity: cx, security: sec, risk } = report

  const target = TARGET_MAP[report.technology] ?? DEFAULT_TARGET

  // Cost estimation for deep-analyzed VFP
  let baseCost = 5000
  baseCost += (inv.totalLines / 1000) * 200
  baseCost += inv.tables.length * 100
  baseCost += cx.score * 2000
  baseCost += risk.redCount * 3000
  baseCost += risk.yellowCount * 1000

  const secMultiplier = SECURITY_MULTIPLIERS[sec.grade] ?? 1.0
  const migrationEstimate = Math.round(baseCost * secMultiplier)

  const migrationLow = Math.round(migrationEstimate * 0.8)
  const migrationHigh = Math.round(migrationEstimate * 1.2)

  // Assessment range: ~10-15% of migration
  const assessmentLow = Math.max(2000, Math.round(migrationEstimate * 0.1))
  const assessmentHigh = Math.max(5000, Math.round(migrationEstimate * 0.15))

  // Timeline based on migration cost
  let timelineWeeks: string
  if (migrationEstimate < 25000) timelineWeeks = "4 — 6"
  else if (migrationEstimate < 60000) timelineWeeks = "6 — 10"
  else if (migrationEstimate < 120000) timelineWeeks = "10 — 14"
  else if (migrationEstimate < 250000) timelineWeeks = "14 — 20"
  else timelineWeeks = "20+"

  // Skills needed
  const skillsNeeded: string[] = ["VFP9 / xBase", "C# / .NET 8", "PostgreSQL", "Entity Framework Core"]
  if (cx.patterns.some((p) => p.pattern === "activex_ole")) skillsNeeded.push("ActiveX/COM migration")
  if (cx.patterns.some((p) => p.pattern === "dll_declare")) skillsNeeded.push("Windows API / P/Invoke")
  if (cx.patterns.some((p) => p.pattern === "sql_passthrough")) skillsNeeded.push("ODBC / ADO.NET migration")
  if (risk.redCount > 0) skillsNeeded.push("Legacy binary format extraction")

  // Knowledge gaps
  const knowledgeGaps: string[] = []
  if (cx.patterns.some((p) => p.pattern === "activex_ole")) {
    knowledgeGaps.push("Identify specific ActiveX controls and find modern replacements")
  }
  if (cx.patterns.some((p) => p.pattern === "dll_declare")) {
    knowledgeGaps.push("Catalog DLL dependencies and determine .NET equivalents")
  }
  if (cx.patterns.some((p) => p.pattern === "execscript")) {
    knowledgeGaps.push("Analyze dynamic code execution paths to determine full scope")
  }
  if (inv.tables.length > 20) {
    knowledgeGaps.push("Map table relationships and referential integrity (DBF has no FK constraints)")
  }
  if (knowledgeGaps.length === 0) {
    knowledgeGaps.push("None identified — system appears well-scoped for automated migration")
  }

  return {
    version: VERSION,
    generatedAt: new Date().toISOString(),
    source: {
      technology: report.technology,
      complexity: cx.score,
      securityGrade: sec.grade,
      riskSummary: {
        red: risk.redCount,
        yellow: risk.yellowCount,
        green: risk.greenCount,
      },
      inventory: {
        totalFiles: inv.totalFiles,
        totalLines: inv.totalLines,
        totalSizeBytes: inv.totalSizeBytes,
        tables: inv.tables.length,
        records: inv.totalRecords,
      },
    },
    suggestedTarget: target,
    estimate: {
      assessmentRange: formatCurrency(assessmentLow) + " — " + formatCurrency(assessmentHigh),
      migrationRange: formatCurrency(migrationLow) + " — " + formatCurrency(migrationHigh),
      timelineWeeks,
      confidence: "high",
    },
    skillsNeeded,
    knowledgeGaps,
  }
}

/**
 * Generate a migration profile from a basic analysis (no deep analysis).
 */
export function generateProfileFromBasic(analysis: BasicAnalysis): MigrationProfile {
  const target = TARGET_MAP[analysis.technology] ?? DEFAULT_TARGET

  // Rough estimate: $300 per 1000 LOC (higher because less certainty)
  const totalLines = analysis.inventory.totalLines
  let migrationEstimate = Math.max(5000, Math.round((totalLines / 1000) * 300))

  // Wider range for basic analysis
  const migrationLow = Math.round(migrationEstimate * 0.5)
  const migrationHigh = Math.round(migrationEstimate * 2.0)

  const assessmentLow = Math.max(2000, Math.round(migrationEstimate * 0.1))
  const assessmentHigh = Math.max(5000, Math.round(migrationEstimate * 0.2))

  // Timeline
  let timelineWeeks: string
  if (migrationEstimate < 25000) timelineWeeks = "4 — 8"
  else if (migrationEstimate < 60000) timelineWeeks = "8 — 14"
  else if (migrationEstimate < 120000) timelineWeeks = "12 — 20"
  else timelineWeeks = "20+"

  // Generic skills
  const techName = analysis.technology
  const skillsNeeded: string[] = [techName, target.primary, target.database]

  return {
    version: VERSION,
    generatedAt: new Date().toISOString(),
    source: {
      technology: analysis.technology,
      complexity: null,
      securityGrade: null,
      riskSummary: null,
      inventory: {
        totalFiles: analysis.inventory.totalFiles,
        totalLines: analysis.inventory.totalLines,
        totalSizeBytes: analysis.inventory.totalSizeBytes,
        tables: 0,
        records: 0,
      },
    },
    suggestedTarget: target,
    estimate: {
      assessmentRange: formatCurrency(assessmentLow) + " — " + formatCurrency(assessmentHigh),
      migrationRange: formatCurrency(migrationLow) + " — " + formatCurrency(migrationHigh),
      timelineWeeks,
      confidence: "low",
    },
    skillsNeeded,
    knowledgeGaps: [
      "Deep analysis not yet available for this technology — manual assessment required",
      "Complexity, security vulnerabilities, and migration risks have not been evaluated",
      "Cost estimates have wide range due to limited analysis depth",
    ],
  }
}

function formatCurrency(amount: number): string {
  if (amount >= 1000) {
    const k = amount / 1000
    // Use clean format: $5K, $15K, $80K, $250K
    if (k === Math.floor(k)) return `$${k}K`
    return `$${k.toFixed(1).replace(/\.0$/, "")}K`
  }
  return `$${amount.toLocaleString("en-US")}`
}
