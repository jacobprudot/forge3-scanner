#!/usr/bin/env node

import { Command } from "commander"
import { writeFile } from "node:fs/promises"
import chalk from "chalk"
import { universalScan, detectOnly } from "./scanner.js"
import { reportTerminal } from "./reporters/terminal.js"
import { reportJson } from "./reporters/json.js"
import { reportHtml } from "./reporters/html.js"
import type { OutputFormat } from "./types.js"

const program = new Command()

program
  .name("forge3-scan")
  .description("Forge3 Scanner — Universal Legacy System Analyzer")
  .version("0.1.0")
  .argument("<path>", "Path to legacy project directory")
  .option("-f, --format <format>", "Output format: terminal, json, html", "terminal")
  .option("-o, --output <file>", "Save report to file")
  .option("--detect-only", "Only detect technology, skip analysis")
  .action(async (path: string, options: { format: string; output?: string; detectOnly?: boolean }) => {
    const format = options.format as OutputFormat

    if (!["terminal", "json", "html"].includes(format)) {
      console.error(chalk.red(`Invalid format: ${format}. Use terminal, json, or html.`))
      process.exit(1)
    }

    console.log(chalk.cyan("\n🔥 Forge3 Scanner — Universal Legacy System Analyzer\n"))
    console.log(chalk.gray(`Scanning: ${path}`))

    if (options.detectOnly) {
      console.log(chalk.gray(`Mode:     detection only\n`))
    } else {
      console.log(chalk.gray(`Format:   ${format}\n`))
    }

    try {
      const startTime = Date.now()

      // Detection-only mode
      if (options.detectOnly) {
        const detection = await detectOnly(path)
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)

        const output = format === "json"
          ? JSON.stringify(detection, null, 2)
          : formatDetectionTerminal(detection)

        if (options.output) {
          await writeFile(options.output, output, "utf-8")
          console.log(chalk.green(`\n✓ Detection result saved to ${options.output}`))
        } else {
          console.log(output)
        }

        console.log(chalk.gray(`\nDetection completed in ${elapsed}s`))
        return
      }

      // Full universal scan
      const report = await universalScan({ path, format })
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)

      let output: string
      switch (format) {
        case "json":
          output = reportJson(report)
          break
        case "html":
          output = reportHtml(report)
          break
        default:
          output = reportTerminal(report)
      }

      if (options.output) {
        await writeFile(options.output, output, "utf-8")
        console.log(chalk.green(`\n✓ Report saved to ${options.output}`))
      } else {
        console.log(output)
      }

      console.log(chalk.gray(`\nScan completed in ${elapsed}s`))
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error(chalk.red(`\n✗ Scan failed: ${message}`))
      process.exit(1)
    }
  })

program.parse()

function formatDetectionTerminal(detection: import("./types.js").DetectionResult): string {
  const lines: string[] = []

  lines.push("")
  lines.push(chalk.bold.white("🔍 TECHNOLOGY DETECTION"))
  lines.push("")

  const { primary } = detection
  const confPct = Math.round(primary.confidence * 100)
  const confColor = confPct >= 70 ? chalk.green : confPct >= 40 ? chalk.yellow : chalk.red

  lines.push(`   Primary:    ${chalk.bold.white(primary.technology.toUpperCase())} ${confColor(`(${confPct}% confidence)`)}`)
  lines.push(`   Files:      ${chalk.white(String(primary.fileCount))}`)

  for (const ev of primary.evidence) {
    lines.push(`   Evidence:   ${chalk.gray(ev)}`)
  }

  if (detection.secondary.length > 0) {
    lines.push("")
    lines.push(chalk.gray("   Also detected:"))
    for (const sec of detection.secondary) {
      const secPct = Math.round(sec.confidence * 100)
      lines.push(`   ${chalk.gray("•")} ${sec.technology} — ${sec.fileCount} files (${secPct}% confidence)`)
    }
  }

  lines.push("")
  lines.push(`   Deep analysis: ${detection.analysisAvailable ? chalk.green("available") : chalk.yellow("not yet available")}`)
  lines.push("")

  return lines.join("\n")
}
