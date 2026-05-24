# par-lint

Deterministic code pattern validation CLI for Angular, Ionic, TypeScript and SCSS projects.

par-lint detects architectural violations, performance anti-patterns, accessibility issues, and UX gaps that ESLint and Stylelint miss — patterns that require cross-file analysis, domain knowledge, or structural reasoning.

**Designed for AI agents.** The primary consumer is Claude Code, Cursor, or Copilot — not a human staring at terminal output. The `--format=claude-context` output delivers structured findings in minimal tokens so agents can fix issues efficiently.

Inspired by [Clean Code para Agentes de IA](https://akitaonrails.com/2026/04/20/clean-code-para-agentes-de-ia/) by Fabio Akita.

## Install

```bash
git clone https://github.com/renzooliveira/par-lint.git
cd par-lint
npm install
npm run build
```

Requires Node.js >= 20.

## Quick Start

```bash
# Initialize config file
node dist/index.js init

# Run analysis
node dist/index.js review --target /path/to/your/project

# AI-optimized output
node dist/index.js review --target . --output claude-context

# Watch mode
node dist/index.js watch --target .
```

## Why par-lint?

| Tool | What it checks | What it misses |
|------|---------------|----------------|
| ESLint | Syntax, formatting, simple patterns | Architecture, UX, domain, cross-file |
| Stylelint | CSS/SCSS syntax | Design tokens, responsive patterns |
| CodeRabbit | Everything (via LLM) | Determinism, reproducibility, token economy |
| **par-lint** | **Architecture + UX + Domain + Patterns** | Nothing it claims to check — deterministic |

par-lint produces the **same output for the same input**, every time. No LLM variance. Structured findings that agents can iterate on without hallucination.

## Commands

| Command | Description |
|---------|------------|
| `review` | Analyze codebase for pattern violations |
| `init` | Generate par-lint config file interactively |
| `rules` | List all available rules with severity and category |
| `docs` | Generate rule catalog documentation |
| `watch` | Watch for file changes and re-analyze incrementally |
| `summary` | Print aggregated findings summary from latest state |
| `hook` | Install/uninstall git pre-commit hook |
| `diff` | Compare two analysis reports and show delta |
| `ci` | All-in-one CI pipeline: review + baseline + SARIF output |
| `init-claude-md` | Generate CLAUDE.md section with active rules |

## Output Formats

| Format | Use case |
|--------|----------|
| **Console** | Human-readable colored terminal output |
| **JSON** | Full structured report for automation |
| **SARIF** | GitHub Code Scanning / VS Code integration |
| **Markdown** | PR comments, documentation |
| **Claude Context** | AI-optimized — minimal tokens, max signal |

### Claude Context Format

```json
{
  "scan": {
    "files": 42,
    "issues": 7,
    "rules_v": "0.1.0",
    "by_severity": { "error": 2, "warning": 4, "info": 1 }
  },
  "issues": [
    {
      "id": "F1",
      "rule": "arch/layer-violation",
      "loc": "src/domain/user.service.ts:14",
      "severity": "error",
      "snippet": "13| import { HttpClient } from '@angular/common/http';\n14> import { UserStore } from '../../infra/store';",
      "evidence": "Layer violation: domain → infra",
      "principle": "Domain must not depend on infrastructure",
      "fix": { "complexity": "M" },
      "confidence": 1
    }
  ]
}
```

## Rules (208 rules, 24 categories)

### Rule Engine

Rules are implemented in two formats:
- **TypeScript rules** (146) — complex logic: cross-file analysis, AST traversal, metrics, data flow
- **YAML rules** (62) — declarative: regex matching, file-presence checks, ast-grep patterns

### Categories

| Category | Rules | Focus |
|----------|-------|-------|
| arch | 13 | Layer violations, circular deps, god files, shotgun surgery |
| domain | 13 | Anemic entities, feature envy, data clumps, Tell-Don't-Ask |
| component | 21 | OnPush, encapsulation, trackBy, input/output count |
| naming | 20 | Hungarian notation, abbreviations, file/class mismatch |
| perf | 11 | N+1, listener leaks, long functions, complexity |
| fp | 11 | Mutations, imperative loops, readonly enforcement |
| duplication | 8 | Similar blocks, structural clones, duplicate shapes |
| responsive | 8 | Fixed dimensions, missing breakpoints, touch targets |
| ionic | 13 | Missing components, lifecycle, platform checks |
| template | 12 | Missing types, deprecated directives, accessibility |
| scss | 10 | Hardcoded values, deep nesting, style leaks |
| signals | 5 | Computed side effects, signal reads after await |
| rxjs | 7 | Nested subscribes, missing error handlers |
| state | 6 | Subscribe without cleanup, two-way binding |
| ux | 7 | Missing loading/error states, destructive actions |
| test | 10 | Focused tests, missing assertions, giant tests |
| a11y | 5 | Missing alt, labels, keyboard support |
| hygiene | 7 | Console.log, dead code, commented code |
| imports | 5 | Path aliases, circular types, barrel enforcement |
| security | 5 | Hardcoded secrets, eval, DOM manipulation |
| typescript | 4 | Exhaustive switch, ts-ignore without reason |
| routing | 2 | PathMatch, wildcard order |
| error | 4 | Empty catch, swallowed promises |
| i18n | 1 | Missing translate-no |

### YAML Rules Engine

Create declarative rules in YAML with 4 modes:

```yaml
# Mode: regex — pattern matching on source
rule:
  id: hygiene/console-log-in-production
  severity: warning
  applicable_to: [is_typescript]
  mode: regex
  regex:
    pattern: '\bconsole\.(log|debug|info)\s*\('
  message_template: "console.{match[1]}() in production code."
```

```yaml
# Mode: file-presence — file must/must not contain pattern
rule:
  id: component/missing-onpush
  severity: warning
  applicable_to: [is_component]
  mode: file-presence
  file_presence:
    must_contain: 'ChangeDetectionStrategy\.OnPush'
  message_template: "Component missing OnPush."
```

```yaml
# Mode: metric — threshold-based checks
rule:
  id: perf/long-function
  severity: warning
  mode: metric
  metric:
    measure: function_count
    threshold: 20
    operator: ">"
```

```yaml
# Mode: ast-grep — AST pattern matching
rule:
  id: test/no-focused-test
  severity: error
  mode: ast-grep
  ast_grep:
    pattern: "fdescribe($$$)"
    language: typescript
```

## Configuration

```yaml
# par-lint.config.yaml
schema_version: "1.0"

project:
  name: my-app
  stack: angular  # angular | angular-ionic | react | dotnet

rules:
  perf/long-function:
    enabled: true
    severity: error
    options:
      maxLines: 40

layers:
  - name: domain
    pattern: "src/domain/**"
  - name: infra
    pattern: "src/infra/**"

layer_rules:
  - from: domain
    cannot_import_from: [infra]
```

## CI Integration

```yaml
# .github/workflows/par-lint.yml
name: par-lint
on: [push, pull_request]
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npx par-lint ci --baseline
      - uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: .par-lint/findings.sarif
```

## Integration with Claude Code

Add to your `CLAUDE.md`:

```bash
# Generate par-lint section for CLAUDE.md
node dist/index.js init-claude-md --append CLAUDE.md
```

Or run directly in Claude Code sessions:

```bash
node /path/to/par-lint/dist/index.js review --target . --output claude-context --severity error --max-issues 0
```

## Architecture

```
src/
├── cli/           Commands (review, init, ci, watch, etc.)
├── engine/        Core: runner, cache, baseline, YAML loader
├── discovery/     File scanner + categorizer (is_component, is_service, etc.)
├── rules/         146 TypeScript rule definitions
├── adapters/      ast-grep, dependency analysis, git history, metrics
├── types/         Shared types (Finding, Config)
└── suppression/   Inline suppression (// par-lint-disable-next-line)

rules/yaml/        62 declarative YAML rules (auto-loaded)
```

## Custom Rules

```js
// rules/my-rule.js
export default {
  id: 'custom/my-rule',
  version: '1.0.0',
  category: 'custom',
  severity: 'warning',
  description: 'My custom rule',
  applicable_to: ['is_typescript'],
  async run(file, config, cwd) {
    return []; // Return Finding[]
  },
};
```

## License

MIT
