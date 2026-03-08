import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { resolve } from "node:path"
import { parsePrg, extractCode } from "../src/parsers/prg.js"
import { parseDbfHeader } from "../src/parsers/dbf.js"
import { analyzeInventory } from "../src/analyzers/inventory.js"
import { analyzeComplexity } from "../src/analyzers/complexity.js"
import { analyzeSecurity } from "../src/analyzers/security.js"
import { analyzeRisk } from "../src/analyzers/risk.js"
import { scan, universalScan, detectOnly } from "../src/scanner.js"
import { detectTechnology } from "../src/detector.js"
import { analyzeBasic } from "../src/basic-analyzer.js"
import { generateProfileFromDeep, generateProfileFromBasic } from "../src/migration-profile.js"

const FIXTURES = resolve(import.meta.dirname, "fixtures")

describe("PRG Parser", () => {
  it("parses a PRG file and counts lines", async () => {
    const result = await parsePrg(resolve(FIXTURES, "sample.prg"))
    assert.ok(result.lineCount > 0, "should have lines")
    assert.ok(result.codeLineCount > 0, "should have code lines")
    assert.ok(result.codeLineCount <= result.lineCount, "code lines <= total lines")
  })

  it("extracts code lines excluding comments", async () => {
    const result = await parsePrg(resolve(FIXTURES, "sample.prg"))
    const code = extractCode(result.lines)
    assert.ok(code.length > 0, "should have code lines")
    assert.ok(!code.some((l) => l.startsWith("*")), "should not include * comments")
  })
})

describe("DBF Parser", () => {
  it("reads DBF header correctly", async () => {
    const result = await parseDbfHeader(resolve(FIXTURES, "sample.dbf"))
    assert.equal(result.recordCount, 5, "should have 5 records")
    assert.equal(result.fieldCount, 5, "should have 5 fields")
    assert.equal(result.fields[0].name, "CUST_ID")
    assert.equal(result.fields[0].type, "N")
    assert.equal(result.fields[1].name, "CUST_NAME")
    assert.equal(result.fields[1].type, "C")
    assert.equal(result.hasMemo, false, "no memo fields")
    assert.equal(result.hasGeneral, false, "no general fields")
  })
})

describe("Inventory Analyzer", () => {
  it("counts files in fixtures directory", async () => {
    const result = await analyzeInventory(FIXTURES)
    assert.ok(result.totalFiles > 0, "should find files")

    const prgCount = result.fileCounts.find((f) => f.extension === "prg")
    assert.ok(prgCount, "should find PRG files")
    assert.ok(prgCount!.count >= 2, "should find at least 2 PRG files")

    const dbfCount = result.fileCounts.find((f) => f.extension === "dbf")
    assert.ok(dbfCount, "should find DBF files")
  })
})

describe("Complexity Analyzer", () => {
  it("detects VFP complexity patterns", async () => {
    const result = await analyzeComplexity(FIXTURES)
    assert.ok(result.score > 1, "score should be above 1 for sample with patterns")

    const macroPattern = result.patterns.find((p) => p.pattern === "macro_substitution")
    assert.ok(macroPattern, "should detect macro substitution")
    assert.ok(macroPattern!.count > 0, "should find macro hits")

    const scatterPattern = result.patterns.find((p) => p.pattern === "scatter_gather")
    assert.ok(scatterPattern, "should detect SCATTER/GATHER")
  })
})

describe("Security Analyzer", () => {
  it("finds security issues", async () => {
    const result = await analyzeSecurity(FIXTURES)
    assert.ok(result.findings.length > 0, "should have findings")
    assert.ok(result.cves.length > 0, "should list CVEs")

    // Platform EOL is always present
    const eol = result.findings.find((f) => f.id === "platform_eol")
    assert.ok(eol, "should flag platform EOL")

    // Hardcoded credentials in sample.prg
    const creds = result.findings.find((f) => f.id === "hardcoded_password" || f.id === "connection_string")
    assert.ok(creds, "should detect hardcoded credentials")

    // Grade should be bad for the sample
    assert.ok(["D", "F"].includes(result.grade), `grade should be D or F, got ${result.grade}`)
  })
})

describe("Risk Analyzer", () => {
  it("produces risk flags", async () => {
    const result = await analyzeRisk(FIXTURES)
    assert.ok(result.flags.length > 0, "should have risk flags")
    assert.ok(result.redCount > 0, "should have red flags from sample.prg")
  })
})

describe("Full Scanner (legacy API)", () => {
  it("produces a complete report", async () => {
    const report = await scan({ path: FIXTURES, format: "terminal" })
    assert.equal(report.technology, "vfp9")
    assert.ok(report.inventory.totalFiles > 0)
    assert.ok(report.complexity.score > 0)
    assert.ok(report.security.findings.length > 0)
    assert.ok(report.risk.flags.length > 0)
  })
})

describe("Technology Detector", () => {
  it("detects VFP9 from fixture files", async () => {
    const result = await detectTechnology(FIXTURES)
    assert.equal(result.primary.technology, "vfp9", "should detect VFP9 as primary")
    assert.ok(result.primary.confidence > 0, "should have non-zero confidence")
    assert.ok(result.primary.fileCount > 0, "should have files")
    assert.ok(result.primary.evidence.length > 0, "should have evidence")
    assert.equal(result.analysisAvailable, true, "deep analysis should be available for VFP9")
  })
})

describe("Basic Analyzer", () => {
  it("produces a basic inventory", async () => {
    const result = await analyzeBasic(FIXTURES, "unknown")
    assert.ok(result.inventory.totalFiles > 0, "should find files")
    assert.ok(result.inventory.fileCounts.length > 0, "should have file counts")
    assert.equal(result.deepAnalysisAvailable, false, "should indicate no deep analysis")
    assert.ok(result.message.length > 0, "should have a message")
  })
})

describe("Migration Profile", () => {
  it("generates profile from deep VFP scan", async () => {
    const report = await scan({ path: FIXTURES, format: "terminal" })
    const profile = generateProfileFromDeep(report)

    assert.equal(profile.source.technology, "vfp9")
    assert.ok(profile.source.complexity !== null, "should have complexity score")
    assert.ok(profile.source.securityGrade !== null, "should have security grade")
    assert.ok(profile.suggestedTarget.primary.includes(".NET"), "should suggest .NET for VFP9")
    assert.equal(profile.suggestedTarget.database, "PostgreSQL")
    assert.equal(profile.estimate.confidence, "high")
    assert.ok(profile.skillsNeeded.length > 0, "should list skills needed")
    assert.ok(profile.knowledgeGaps.length > 0, "should list knowledge gaps")
  })

  it("generates profile from basic analysis", async () => {
    const basic = await analyzeBasic(FIXTURES, "oracle-forms")
    const profile = generateProfileFromBasic(basic)

    assert.equal(profile.source.technology, "oracle-forms")
    assert.equal(profile.source.complexity, null, "no complexity for basic")
    assert.equal(profile.source.securityGrade, null, "no security grade for basic")
    assert.equal(profile.estimate.confidence, "low", "low confidence for basic")
    assert.ok(profile.suggestedTarget.primary.includes("Next.js"), "should suggest Next.js for Oracle Forms")
  })
})

describe("Universal Scanner", () => {
  it("produces a universal scan report for VFP fixtures", async () => {
    const report = await universalScan({ path: FIXTURES, format: "terminal" })

    assert.ok(report.version, "should have version")
    assert.ok(report.scannedAt, "should have timestamp")
    assert.ok(report.rootPath, "should have root path")

    // Detection
    assert.equal(report.detection.primary.technology, "vfp9", "should detect VFP9")
    assert.equal(report.detection.analysisAvailable, true)

    // Deep analysis
    assert.ok("complexity" in report.analysis, "should have deep analysis for VFP9")
    const analysis = report.analysis as import("../src/types.js").ScanReport
    assert.equal(analysis.technology, "vfp9")
    assert.ok(analysis.inventory.totalFiles > 0)

    // Profile
    assert.ok(report.profile.suggestedTarget.primary, "should have target suggestion")
    assert.ok(report.profile.estimate.migrationRange, "should have migration range")
  })
})

describe("Detect Only", () => {
  it("returns detection without analysis", async () => {
    const result = await detectOnly(FIXTURES)
    assert.equal(result.primary.technology, "vfp9")
    assert.ok(result.primary.confidence > 0)
    assert.ok(result.primary.evidence.length > 0)
  })
})
