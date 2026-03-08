import type { UniversalScanReport } from "../types.js"

export function reportJson(report: UniversalScanReport): string {
  return JSON.stringify(report, null, 2)
}
