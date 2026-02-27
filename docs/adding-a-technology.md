# Adding a New Technology

This guide explains how to add scanner support for a new legacy technology (Oracle, COBOL, VB6, etc.).

## Structure

Each technology lives in its own package under `packages/`:

```
packages/
├── vfp/          # Visual FoxPro 9 (existing)
├── oracle/       # Oracle PL/SQL (example)
└── cobol/        # COBOL (example)
```

## Steps

### 1. Create the package directory

```
packages/your-tech/
├── package.json          # @forge3/scanner-your-tech
├── tsconfig.json
├── src/
│   ├── index.ts          # CLI entry point
│   ├── scanner.ts        # Orchestrator
│   ├── types.ts          # Interfaces (extend from shared types)
│   ├── parsers/          # File format parsers
│   ├── analyzers/        # Analysis modules
│   └── reporters/        # Output formatters
└── tests/
    ├── fixtures/         # Sample files for testing
    └── scanner.test.ts
```

### 2. Define your parsers

Each file format your technology uses needs a parser:

- **Text-based** (like .PRG, .sql, .cbl): Read as text, split into lines
- **Binary** (like .DBF, .fmb): Read headers and extract metadata

### 3. Define complexity patterns

What makes this technology hard to migrate? Examples:

- **Oracle**: DBMS_LOB, autonomous transactions, materialized views, PL/SQL objects
- **COBOL**: GOTO, PERFORM THRU, REDEFINES, COMP-3 fields, COPY books
- **VB6**: ActiveX, Windows API, COM references, On Error Resume Next

### 4. Define security checks

- Platform CVEs and EOL status
- Code-level vulnerabilities specific to the technology
- Data storage risks

### 5. Define risk flags

What patterns make migration specifically harder?

- **Red**: Things that require manual intervention
- **Yellow**: Things that need refactoring but have clear patterns
- **Green**: Things that translate directly

### 6. Write tests

Create fixture files that contain representative patterns and verify your analyzers detect them correctly.

## Shared Interfaces

The core types in each `types.ts` should follow the same structure as the VFP scanner:

- `InventoryResult` — What exists
- `ComplexityResult` — How hard it is (score 1-10)
- `SecurityResult` — What's vulnerable (grade A-F)
- `RiskResult` — What's risky for migration (red/yellow/green)
- `ScanReport` — Combined report

This ensures all reporters (terminal, JSON, HTML) work consistently across technologies.
