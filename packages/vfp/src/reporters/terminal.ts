import chalk from "chalk"
import type { ScanReport } from "../types.js"

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

function formatNumber(n: number): string {
  return n.toLocaleString("en-US")
}

function progressBar(value: number, max: number, width: number = 10): string {
  const filled = Math.round((value / max) * width)
  const empty = width - filled
  return chalk.green("█".repeat(filled)) + chalk.gray("░".repeat(empty))
}

export function reportTerminal(report: ScanReport): string {
  const lines: string[] = []
  const { inventory: inv, complexity: cx, security: sec, risk } = report

  // Header
  lines.push("")
  lines.push(chalk.bold.cyan("╔══════════════════════════════════════════════════╗"))
  lines.push(chalk.bold.cyan("║") + chalk.bold.white("  FORGE3 SCANNER — VFP9 Legacy System Report     ") + chalk.bold.cyan("║"))
  lines.push(chalk.bold.cyan("╚══════════════════════════════════════════════════╝"))
  lines.push("")

  // Inventory
  lines.push(chalk.bold.white("📋 INVENTORY"))

  const prgCount = inv.fileCounts.find((f) => f.extension === "prg")
  const scxCount = inv.fileCounts.find((f) => f.extension === "scx")
  const vcxCount = inv.fileCounts.find((f) => f.extension === "vcx")
  const frxCount = inv.fileCounts.find((f) => f.extension === "frx")
  const dbfCount = inv.fileCounts.find((f) => f.extension === "dbf")

  if (prgCount) {
    lines.push(`   Source code:    ${chalk.white(formatNumber(prgCount.count))} .PRG files, ${chalk.white(formatNumber(prgCount.totalLines))} lines`)
  }
  if (scxCount || vcxCount) {
    const parts = []
    if (scxCount) parts.push(`${formatNumber(scxCount.count)} .SCX forms`)
    if (vcxCount) parts.push(`${formatNumber(vcxCount.count)} .VCX class libraries`)
    lines.push(`   Forms:          ${chalk.white(parts.join(", "))}`)
  }
  if (dbfCount) {
    lines.push(`   Database:       ${chalk.white(formatNumber(dbfCount.count))} .DBF tables, ${chalk.white(formatNumber(inv.indexFiles))} indexes`)
  }
  lines.push(`   Data:           ${chalk.white(formatBytes(inv.totalSizeBytes))}, ${chalk.white(formatNumber(inv.totalRecords))} total records`)
  if (frxCount) {
    lines.push(`   Reports:        ${chalk.white(formatNumber(frxCount.count))} .FRX report files`)
  }

  // Dependencies summary from complexity
  const activex = cx.patterns.find((p) => p.pattern === "activex_ole")
  const dll = cx.patterns.find((p) => p.pattern === "dll_declare")
  if (activex || dll) {
    const parts = []
    if (activex) parts.push(`${activex.files.length} ActiveX controls`)
    if (dll) parts.push(`${dll.files.length} DLL calls`)
    lines.push(`   Dependencies:   ${chalk.white(parts.join(", "))}`)
  }
  lines.push("")

  // Complexity
  const scoreColor = cx.score <= 3 ? chalk.green : cx.score <= 6 ? chalk.yellow : chalk.red
  lines.push(chalk.bold.white("⚡ COMPLEXITY SCORE: ") +
    scoreColor.bold(`${cx.score} / 10`) +
    ` ${progressBar(cx.score, 10)} ` +
    scoreColor.bold(cx.label))

  for (const p of cx.patterns) {
    const count = p.files.length
    lines.push(`   ${p.description.split("—")[0].trim()}: ${chalk.white(String(count))} files`)
  }
  lines.push("")

  // Security
  const gradeColor = sec.grade === "A" ? chalk.green :
    sec.grade === "B" ? chalk.green :
      sec.grade === "C" ? chalk.yellow :
        chalk.red
  lines.push(chalk.bold.white("🔒 SECURITY SCORE: ") + gradeColor.bold(sec.grade))

  const yearsEol = new Date().getFullYear() - 2015
  lines.push(`   Platform: VFP9 EOL since 2015 — ${chalk.red("0 patches")} in ${yearsEol} years`)

  const criticalCves = sec.cves.filter((c) => c.severity === "critical").length
  const highCves = sec.cves.filter((c) => c.severity === "high").length
  lines.push(`   CVEs:     ${chalk.red(`${criticalCves} Critical`)}, ${chalk.yellow(`${highCves} High`)}`)

  for (const f of sec.findings) {
    if (f.category === "platform" || f.id === "no_audit") continue
    const sevColor = f.severity === "critical" ? chalk.red :
      f.severity === "high" ? chalk.yellow : chalk.white
    lines.push(`   ${sevColor(f.title)}: ${chalk.white(String(f.count))} ${f.count === 1 ? "instance" : "instances"}`)
  }
  lines.push("")

  // Risk
  lines.push(chalk.bold.white("⚠️  MIGRATION RISK FLAGS"))
  for (const flag of risk.flags) {
    const icon = flag.level === "red" ? chalk.red("🔴") :
      flag.level === "yellow" ? chalk.yellow("🟡") :
        chalk.green("🟢")
    lines.push(`   ${icon} ${flag.count} ${flag.category}${flag.description ? ` (${flag.description.split("—")[0].trim()})` : ""}`)
  }
  lines.push("")

  // Footer
  lines.push(chalk.gray("━".repeat(50)))
  lines.push(chalk.gray("This is an automated scan. For full business analysis,"))
  lines.push(chalk.gray("risk remediation plan, and migration architecture:"))
  lines.push("")
  lines.push(chalk.bold.cyan("→ Request Assessment at https://forge3.dev"))
  lines.push(chalk.gray("━".repeat(50)))
  lines.push("")

  return lines.join("\n")
}
