import type { ScanReport } from "../types.js"

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

function n(num: number): string {
  return num.toLocaleString("en-US")
}

function severityBadge(severity: string): string {
  const colors: Record<string, string> = {
    critical: "#dc2626",
    high: "#ea580c",
    medium: "#ca8a04",
    low: "#2563eb",
    info: "#6b7280",
  }
  const color = colors[severity] ?? "#6b7280"
  return `<span style="background:${color};color:white;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:600">${severity.toUpperCase()}</span>`
}

export function reportHtml(report: ScanReport): string {
  const { inventory: inv, complexity: cx, security: sec, risk } = report
  const yearsEol = new Date().getFullYear() - 2015

  const prgCount = inv.fileCounts.find((f) => f.extension === "prg")
  const scxCount = inv.fileCounts.find((f) => f.extension === "scx")
  const vcxCount = inv.fileCounts.find((f) => f.extension === "vcx")
  const dbfCount = inv.fileCounts.find((f) => f.extension === "dbf")

  const scoreColor = cx.score <= 3 ? "#22c55e" : cx.score <= 6 ? "#eab308" : "#ef4444"
  const gradeColor = sec.grade <= "B" ? "#22c55e" : sec.grade <= "C" ? "#eab308" : "#ef4444"

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Forge3 Scanner — VFP9 Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0a; color: #e5e5e5; line-height: 1.6; padding: 2rem; max-width: 900px; margin: 0 auto; }
    h1 { font-size: 1.5rem; margin-bottom: 0.25rem; }
    h2 { font-size: 1.2rem; margin-bottom: 1rem; border-bottom: 1px solid #333; padding-bottom: 0.5rem; }
    .header { text-align: center; padding: 2rem; border: 1px solid #333; border-radius: 12px; margin-bottom: 2rem; }
    .header .brand { color: #dc2626; font-size: 0.9rem; font-weight: 700; letter-spacing: 2px; }
    .section { background: #141414; border: 1px solid #262626; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; }
    .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; }
    .stat { padding: 0.75rem; background: #1a1a1a; border-radius: 8px; }
    .stat .label { font-size: 0.8rem; color: #888; }
    .stat .value { font-size: 1.4rem; font-weight: 700; }
    .score-big { font-size: 3rem; font-weight: 800; text-align: center; padding: 1rem; }
    .bar { height: 8px; background: #333; border-radius: 4px; overflow: hidden; margin: 0.5rem 0; }
    .bar-fill { height: 100%; border-radius: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 0.5rem; }
    td, th { padding: 0.5rem; text-align: left; border-bottom: 1px solid #262626; font-size: 0.9rem; }
    .flag { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0; }
    .dot { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }
    .dot-red { background: #ef4444; }
    .dot-yellow { background: #eab308; }
    .dot-green { background: #22c55e; }
    .footer { text-align: center; padding: 2rem; border-top: 1px solid #333; margin-top: 2rem; color: #888; }
    .footer a { color: #dc2626; text-decoration: none; font-weight: 600; }
    .footer a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">FORGE3 SCANNER</div>
    <h1>VFP9 Legacy System Report</h1>
    <p style="color:#888;font-size:0.85rem">Scanned: ${report.scannedAt} &nbsp;|&nbsp; Path: ${report.rootPath}</p>
  </div>

  <div class="section">
    <h2>📋 Inventory</h2>
    <div class="stat-grid">
      <div class="stat">
        <div class="label">Source Files</div>
        <div class="value">${prgCount ? n(prgCount.count) : 0} .PRG</div>
        <div class="label">${prgCount ? n(prgCount.totalLines) : 0} lines of code</div>
      </div>
      <div class="stat">
        <div class="label">Forms & Classes</div>
        <div class="value">${n((scxCount?.count ?? 0) + (vcxCount?.count ?? 0))}</div>
        <div class="label">${scxCount?.count ?? 0} .SCX + ${vcxCount?.count ?? 0} .VCX</div>
      </div>
      <div class="stat">
        <div class="label">Database Tables</div>
        <div class="value">${dbfCount ? n(dbfCount.count) : 0} .DBF</div>
        <div class="label">${n(inv.totalRecords)} total records</div>
      </div>
      <div class="stat">
        <div class="label">Total Size</div>
        <div class="value">${formatBytes(inv.totalSizeBytes)}</div>
        <div class="label">${n(inv.totalFiles)} files total</div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>⚡ Complexity</h2>
    <div class="score-big" style="color:${scoreColor}">${cx.score} / 10</div>
    <div style="text-align:center;font-weight:600;color:${scoreColor}">${cx.label}</div>
    <div class="bar"><div class="bar-fill" style="width:${cx.score * 10}%;background:${scoreColor}"></div></div>
    <table>
      <thead><tr><th>Pattern</th><th>Files</th></tr></thead>
      <tbody>
        ${cx.patterns.map((p) => `<tr><td>${p.description.split("—")[0].trim()}</td><td>${p.files.length}</td></tr>`).join("\n        ")}
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>🔒 Security</h2>
    <div class="score-big" style="color:${gradeColor}">Grade: ${sec.grade}</div>
    <p style="text-align:center;color:#888">VFP9 EOL since 2015 — 0 patches in ${yearsEol} years</p>
    <table>
      <thead><tr><th>Finding</th><th>Severity</th><th>Count</th></tr></thead>
      <tbody>
        ${sec.findings.map((f) => `<tr><td>${f.title}</td><td>${severityBadge(f.severity)}</td><td>${f.count}</td></tr>`).join("\n        ")}
      </tbody>
    </table>
    <h3 style="margin-top:1rem;font-size:0.95rem">Known CVEs</h3>
    <table>
      <thead><tr><th>CVE</th><th>Severity</th><th>CVSS</th><th>Description</th></tr></thead>
      <tbody>
        ${sec.cves.map((c) => `<tr><td>${c.id}</td><td>${severityBadge(c.severity)}</td><td>${c.cvss}</td><td>${c.description}</td></tr>`).join("\n        ")}
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>⚠️ Migration Risk Flags</h2>
    ${risk.flags.map((f) => {
    const dotClass = f.level === "red" ? "dot-red" : f.level === "yellow" ? "dot-yellow" : "dot-green"
    return `<div class="flag"><div class="dot ${dotClass}"></div><strong>${f.count}</strong> ${f.category} — ${f.description.split("—")[0].trim()}</div>`
  }).join("\n    ")}
  </div>

  <div class="footer">
    <p>This is an automated scan. For full business analysis,<br>risk remediation plan, and migration architecture:</p>
    <p style="margin-top:0.5rem"><a href="https://forge3.dev">→ Request Assessment at forge3.dev</a></p>
    <p style="margin-top:1rem;font-size:0.75rem">Generated by Forge3 Scanner v${report.version}</p>
  </div>
</body>
</html>`
}
