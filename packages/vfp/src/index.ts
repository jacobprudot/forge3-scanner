#!/usr/bin/env node

import { Command } from "commander"
import { writeFile } from "node:fs/promises"
import chalk from "chalk"
import { scan } from "./scanner.js"
import { reportTerminal } from "./reporters/terminal.js"
import { reportJson } from "./reporters/json.js"
import { reportHtml } from "./reporters/html.js"
import type { OutputFormat } from "./types.js"

const program = new Command()

program
  .name("forge3-scan")
  .description("Forge3 Scanner — Free VFP9 legacy system analysis")
  .version("0.1.0")
  .argument("<path>", "Path to VFP9 project directory")
  .option("-f, --format <format>", "Output format: terminal, json, html", "terminal")
  .option("-o, --output <file>", "Save report to file")
  .action(async (path: string, options: { format: string; output?: string }) => {
    const format = options.format as OutputFormat

    if (!["terminal", "json", "html"].includes(format)) {
      console.error(chalk.red(`Invalid format: ${format}. Use terminal, json, or html.`))
      process.exit(1)
    }

    console.log(chalk.cyan("\n🔥 Forge3 Scanner — VFP9 Analysis\n"))
    console.log(chalk.gray(`Scanning: ${path}`))
    console.log(chalk.gray(`Format:   ${format}\n`))

    try {
      const startTime = Date.now()
      const report = await scan({ path, format })
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
