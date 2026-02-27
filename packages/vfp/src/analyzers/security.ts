import { glob } from "glob"
import { parsePrg, extractCode } from "../parsers/prg.js"
import { parseScx } from "../parsers/scx.js"
import type { SecurityResult, SecurityFinding, CveEntry, Severity } from "../types.js"

/**
 * Known VFP9 platform CVEs.
 * VFP9 reached EOL January 13, 2015. No security patches since.
 */
const PLATFORM_CVES: CveEntry[] = [
  {
    id: "CVE-2008-4250",
    severity: "critical",
    cvss: 10.0,
    description: "Windows Server Service vulnerability affecting FoxPro runtime (MS08-067)",
  },
  {
    id: "CVE-2010-1898",
    severity: "high",
    cvss: 9.3,
    description: "VFP OLE Automation memory corruption allows remote code execution",
  },
  {
    id: "CVE-2012-1856",
    severity: "high",
    cvss: 8.8,
    description: "MSCOMCTL.OCX (Common Controls) remote code execution — used by VFP forms",
  },
  {
    id: "CVE-2012-0158",
    severity: "critical",
    cvss: 9.3,
    description: "MSCOMCTL.OCX ListView/TreeView buffer overflow — actively exploited",
  },
  {
    id: "CVE-2014-6352",
    severity: "high",
    cvss: 9.3,
    description: "OLE object handling vulnerability affecting VFP General fields",
  },
  {
    id: "PLATFORM-EOL",
    severity: "critical",
    cvss: 10.0,
    description: "VFP9 End of Life since January 2015 — zero security patches in 11+ years",
  },
]

interface SecurityPattern {
  id: string
  title: string
  description: string
  severity: Severity
  category: "code" | "data" | "audit"
  regex: RegExp
}

const CODE_PATTERNS: SecurityPattern[] = [
  {
    id: "hardcoded_password",
    title: "Hardcoded credentials",
    description: "Passwords, API keys, or connection strings embedded in source code",
    severity: "high",
    category: "code",
    regex: /(?:password|passwd|pwd|secret|api_?key|token)\s*=\s*["'][^"']{3,}/i,
  },
  {
    id: "connection_string",
    title: "Hardcoded connection string",
    description: "Database connection strings with embedded credentials",
    severity: "high",
    category: "code",
    regex: /(?:DSN|SERVER|DATABASE|UID|PWD|DRIVER)\s*=\s*[^;"\s]+/i,
  },
  {
    id: "sql_injection",
    title: "SQL injection risk",
    description: "String concatenation in SQL commands — vulnerable to injection",
    severity: "high",
    category: "code",
    regex: /(?:SELECT|INSERT|UPDATE|DELETE|DROP)\s+.*["']\s*\+\s*\w+|["']\s*\+\s*\w+.*(?:SELECT|INSERT|UPDATE|DELETE|DROP)/i,
  },
  {
    id: "sql_concat_ampersand",
    title: "SQL injection via macro substitution",
    description: "SQL commands using &variable substitution — equivalent to SQL injection",
    severity: "critical",
    category: "code",
    regex: /(?:SELECT|INSERT|UPDATE|DELETE)\b[^&]*&[a-zA-Z_]\w*/i,
  },
  {
    id: "file_io_unsanitized",
    title: "File I/O without path sanitization",
    description: "Direct file operations that may allow path traversal",
    severity: "medium",
    category: "code",
    regex: /\b(?:COPY\s+FILE|RENAME|ERASE|DELETE\s+FILE|FCREATE|FOPEN)\b.*&/i,
  },
  {
    id: "shellexec",
    title: "Shell command execution",
    description: "Executing system commands from VFP code",
    severity: "high",
    category: "code",
    regex: /\b(?:RUN\s+\/N|RUN\s|!\s*\w|ShellExecute)/i,
  },
]

export async function analyzeSecurity(rootPath: string): Promise<SecurityResult> {
  const findingsMap = new Map<string, SecurityFinding>()

  // Platform findings (always present for VFP9)
  findingsMap.set("platform_eol", {
    id: "platform_eol",
    title: "Platform End of Life",
    description: `VFP9 reached End of Life on January 13, 2015. No security patches have been released in ${new Date().getFullYear() - 2015}+ years.`,
    severity: "critical",
    category: "platform",
    files: [],
    count: 1,
  })

  // Scan PRG files for security patterns
  const prgFiles = await glob("**/*.prg", {
    cwd: rootPath,
    nocase: true,
    absolute: true,
  })

  for (const file of prgFiles) {
    try {
      const parsed = await parsePrg(file)
      const codeLines = extractCode(parsed.lines)
      const relativePath = file.replace(rootPath, "").replace(/^[\\/]/, "")

      for (const pattern of CODE_PATTERNS) {
        let hits = 0
        for (const line of codeLines) {
          if (pattern.regex.test(line)) {
            hits++
          }
        }
        if (hits > 0) {
          if (!findingsMap.has(pattern.id)) {
            findingsMap.set(pattern.id, {
              id: pattern.id,
              title: pattern.title,
              description: pattern.description,
              severity: pattern.severity,
              category: pattern.category,
              files: [],
              count: 0,
            })
          }
          const finding = findingsMap.get(pattern.id)!
          finding.files.push(relativePath)
          finding.count += hits
        }
      }
    } catch {
      // Skip unreadable files
    }
  }

  // Scan SCX/VCX memo content
  const formFiles = await glob("**/*.{scx,vcx}", {
    cwd: rootPath,
    nocase: true,
    absolute: true,
  })

  for (const file of formFiles) {
    try {
      const scxInfo = await parseScx(file)
      if (!scxInfo.textContent) continue
      const relativePath = file.replace(rootPath, "").replace(/^[\\/]/, "")
      const lines = scxInfo.textContent.split("\n")

      for (const pattern of CODE_PATTERNS) {
        let hits = 0
        for (const line of lines) {
          if (pattern.regex.test(line)) hits++
        }
        if (hits > 0) {
          if (!findingsMap.has(pattern.id)) {
            findingsMap.set(pattern.id, {
              id: pattern.id,
              title: pattern.title,
              description: pattern.description,
              severity: pattern.severity,
              category: pattern.category,
              files: [],
              count: 0,
            })
          }
          const finding = findingsMap.get(pattern.id)!
          if (!finding.files.includes(relativePath)) {
            finding.files.push(relativePath)
          }
          finding.count += hits
        }
      }
    } catch {
      // Skip unreadable
    }
  }

  // Check DBF files (unencrypted data)
  const dbfFiles = await glob("**/*.dbf", {
    cwd: rootPath,
    nocase: true,
    absolute: true,
  })

  if (dbfFiles.length > 0) {
    findingsMap.set("unencrypted_data", {
      id: "unencrypted_data",
      title: "Unencrypted data on disk",
      description: "DBF files store data as plaintext with no encryption. Any file access = full data exposure.",
      severity: "high",
      category: "data",
      files: dbfFiles.map((f) => f.replace(rootPath, "").replace(/^[\\/]/, "")),
      count: dbfFiles.length,
    })
  }

  // No audit trail finding (VFP has no built-in auditing)
  findingsMap.set("no_audit", {
    id: "no_audit",
    title: "No built-in audit trail",
    description: "VFP9 has no native audit logging. Data modifications are untraceable without custom implementation.",
    severity: "medium",
    category: "audit",
    files: [],
    count: 1,
  })

  const findings = Array.from(findingsMap.values())
  const totalFindings = findings.reduce((sum, f) => sum + f.count, 0)

  // Calculate grade
  const grade = calculateGrade(findings)

  return { grade, findings, cves: PLATFORM_CVES, totalFindings }
}

function calculateGrade(findings: SecurityFinding[]): string {
  let score = 100
  for (const f of findings) {
    switch (f.severity) {
      case "critical": score -= 25 * Math.min(f.count, 3); break
      case "high":     score -= 15 * Math.min(f.count, 3); break
      case "medium":   score -= 5 * Math.min(f.count, 5); break
      case "low":      score -= 2 * Math.min(f.count, 5); break
    }
  }

  if (score >= 90) return "A"
  if (score >= 75) return "B"
  if (score >= 55) return "C"
  if (score >= 35) return "D"
  return "F"
}
