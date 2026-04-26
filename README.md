# par-lint

Deterministic code pattern validation CLI for Angular, Ionic, TypeScript and SCSS projects.

par-lint detects architectural violations, performance anti-patterns, accessibility issues, and UX gaps that ESLint and Stylelint miss — patterns that require cross-file analysis, domain knowledge, or multi-perspective reasoning.

## Install

```bash
npm install @par/lint
```

Requires Node.js >= 20.

## Quick Start

```bash
# Initialize config file
par-lint init

# Run analysis
par-lint review

# Watch mode
par-lint watch
```

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

### review

```bash
par-lint review [options]

Options:
  --target <path>        Target project directory
  --file <path>          Analyze a single file
  --severity <level>     Minimum severity: info, warning, error (default: info)
  --category <cats>      Filter by category (comma-separated)
  --rule <ids>           Filter by rule ID (comma-separated)
  --incremental [base]   Only analyze changed files since base ref (default: HEAD~1)
  --no-cache             Disable file hash caching
  --baseline             Filter out findings present in baseline
  --save-baseline        Save current findings as baseline
  --profile              Show rule execution time profiling
  --output <formats>     Output formats: json, sarif, markdown (default: console)
  --json                 Output JSON to stdout
  --dry-run              Run without writing state
```

### ci

```bash
par-lint ci [options]

Options:
  --target <path>        Target project directory
  --incremental [base]   Only analyze changed files
  --baseline             Filter by baseline
  --save-baseline        Save current findings as baseline
```

Generates SARIF output for GitHub Code Scanning integration.

## Configuration

Create `par-lint.config.yaml` in your project root:

```yaml
schema_version: "1.0"

project:
  name: my-app
  stack: angular  # angular | angular-ionic | react | dotnet | mixed

rules:
  perf/long-function:
    enabled: true
    severity: error
    options:
      maxLines: 40
  component/template-too-long:
    enabled: true
    options:
      maxLines: 80

layers:
  - name: domain
    pattern: "src/domain/**"
  - name: infra
    pattern: "src/infra/**"

layer_rules:
  - from: domain
    cannot_import_from: [infra]

performance:
  cache_enabled: true
  parallel_workers: 4
  incremental: auto  # auto | always | never

custom_rules:
  - ./rules/my-custom-rule.js
```

## Custom Rules (Plugin System)

Create a `.js` file exporting a `RuleDefinition`:

```js
// rules/no-console-log.js
export default {
  id: 'custom/no-console-log',
  version: '1.0.0',
  category: 'custom',
  severity: 'warning',
  description: 'Detects console.log calls',
  principle: 'Use structured logging instead of console.log',
  applicable_to: ['is_typescript'],
  async run(file, config, cwd) {
    // Return Finding[] — see src/types/finding.ts for shape
    return [];
  },
};
```

Register in config:

```yaml
custom_rules:
  - ./rules/no-console-log.js
```

## Rules (47)

### state (5 rules)

| Rule | Severity | Description |
|------|----------|-------------|
| `state/manual-change-detection` | warning | Detects manual ChangeDetectorRef calls indicating broken state model |
| `state/subscribe-without-cleanup` | error | Detects .subscribe() in components without cleanup |
| `state/external-signal-mutation` | error | Detects signal.set()/update() calls outside the declaring class |
| `state/two-way-binding-on-large-form` | warning | Detects templates with too many [(ngModel)] bindings |
| `state/derived-state-as-property` | warning | Detects derived state assigned in ngOnInit instead of computed() |

### perf (7 rules)

| Rule | Severity | Description |
|------|----------|-------------|
| `perf/sync-in-async-path` | error | Detects synchronous blocking calls in async context |
| `perf/long-function` | warning | Detects functions exceeding maximum line count |
| `perf/high-cyclomatic-complexity` | warning | Detects functions with cyclomatic complexity above threshold |
| `perf/listener-leak` | error | Detects addEventListener/subscribe without matching cleanup |
| `perf/heavy-computation-in-render` | warning | Detects function calls in template interpolations without pure pipe |
| `perf/n-plus-one` | error | Detects HTTP/repository calls inside loops (N+1 pattern) |
| `perf/missing-pagination` | warning | Detects collection endpoints without pagination parameters |

### scss (5 rules)

| Rule | Severity | Description |
|------|----------|-------------|
| `scss/deep-nesting` | warning | Detects SCSS selectors nested deeper than threshold |
| `scss/hardcoded-color` | warning | Detects literal color values instead of design tokens |
| `scss/hardcoded-spacing` | warning | Detects literal spacing values instead of design tokens |
| `scss/file-too-long` | error | Detects SCSS files exceeding maximum line count |
| `scss/component-style-leak` | warning | Detects ::ng-deep usage that leaks component styles |

### arch (5 rules)

| Rule | Severity | Description |
|------|----------|-------------|
| `arch/circular-dependency` | error | Detects circular import cycles between modules |
| `arch/layer-violation` | error | Detects imports crossing configured layer boundaries |
| `arch/god-file` | warning | Detects files with excessive LOC, methods or exports |
| `arch/dead-abstraction` | info | Exported type/interface with no consumers outside its file |
| `arch/shotgun-surgery-candidate` | info | File co-changes frequently with many others in git history |

### a11y (5 rules)

| Rule | Severity | Description |
|------|----------|-------------|
| `a11y/missing-alt` | error | Detects \<img\> elements without alt attribute |
| `a11y/missing-label` | error | Detects \<input\> elements without associated label or aria-label |
| `a11y/non-button-as-button` | error | Detects div/span with click handler missing role and keyboard support |
| `a11y/redundant-aria` | warning | Detects ARIA roles that duplicate native element semantics |
| `a11y/landmark-structure` | warning | Detects pages missing landmark elements (main, nav, header) |

### component (7 rules)

| Rule | Severity | Description |
|------|----------|-------------|
| `component/template-too-long` | warning | Detects HTML templates exceeding maximum line count |
| `component/excessive-input-output` | info | Detects components with too many @Input/@Output declarations |
| `component/no-explicit-any` | warning | Detects explicit "any" type annotations |
| `component/no-business-logic` | warning | Detects business logic in presentational components |
| `component/missing-onpush` | warning | Detects components without OnPush change detection |
| `component/missing-trackby` | warning | Detects *ngFor without trackBy function |
| `component/inline-styles` | warning | Detects inline style attributes in HTML templates |

### ionic (2 rules)

| Rule | Severity | Description |
|------|----------|-------------|
| `ionic/missing-ion-content` | warning | Detects Ionic page templates missing \<ion-content\> wrapper |
| `ionic/hardcoded-platform-check` | warning | Detects hardcoded Platform.is() checks |

### ux (6 rules)

| Rule | Severity | Description |
|------|----------|-------------|
| `ux/missing-loading-state` | warning | Detects async operations in templates without loading indicator |
| `ux/missing-error-state` | error | Detects async pipe usage without error state handling |
| `ux/missing-success-feedback` | warning | Detects mutation handlers without success feedback |
| `ux/destructive-without-confirmation` | error | Detects delete/remove handlers without confirmation dialog |
| `ux/missing-motion-reduce` | warning | Detects animations without prefers-reduced-motion |
| `ux/form-not-disabled-during-submit` | warning | Detects forms not disabled during submission |

### domain (5 rules)

| Rule | Severity | Description |
|------|----------|-------------|
| `domain/external-mutation` | error | Detects direct property assignment from outside the class |
| `domain/anemic-entity` | warning | Detects entities with many properties but few methods |
| `domain/primitive-obsession` | info | Detects methods with too many primitive parameters |
| `domain/feature-envy` | warning | Method accesses too many properties of another object |
| `domain/inappropriate-intimacy` | warning | Two classes reference each other in excessive depth |

## Output Formats

- **Console** — colored terminal output (default)
- **JSON** — structured findings report
- **SARIF** — for GitHub Code Scanning / VS Code integration
- **Markdown** — human-readable report

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

## License

MIT
