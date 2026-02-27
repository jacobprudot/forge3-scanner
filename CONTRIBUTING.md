# Contributing to Forge3 Scanner

Thank you for your interest in contributing! This project is an open-source legacy system scanner maintained by [Leon Gael LLC](https://forge3.dev).

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/forge3-scanner.git`
3. Install dependencies: `cd packages/vfp && npm install`
4. Create a branch: `git checkout -b feature/your-feature`

## Development

```bash
# Run the scanner in development
npx tsx packages/vfp/src/index.ts ./path/to/vfp/project

# Run tests
cd packages/vfp && npm test

# Build
cd packages/vfp && npm run build
```

## Adding a New Technology

See [docs/adding-a-technology.md](docs/adding-a-technology.md) for a guide on adding scanners for Oracle, COBOL, VB6, and other legacy technologies.

## Pull Request Process

1. Ensure your code passes all tests
2. Update documentation if needed
3. Write clear commit messages
4. Open a PR against `main` with a description of your changes

## Reporting Issues

Use the [GitHub issue templates](.github/ISSUE_TEMPLATE/) for bug reports and feature requests.

## Code of Conduct

Be respectful. We're all here to help businesses escape legacy systems.
