import type { ScanReport } from "../types.js"

export function reportJson(report: ScanReport): string {
  return JSON.stringify(report, null, 2)
}
