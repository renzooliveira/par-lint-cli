import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const PATTERNS: { pattern: RegExp; framework: string; suggestion: string }[] = [
  { pattern: /\bfetch\s*\(/, framework: 'Angular HttpClient', suggestion: 'Use HttpClient instead of fetch()' },
  { pattern: /document\.getElementById\s*\(/, framework: 'Angular ViewChild', suggestion: 'Use @ViewChild instead of getElementById' },
  { pattern: /document\.querySelector\s*\(/, framework: 'Angular ViewChild', suggestion: 'Use @ViewChild instead of querySelector' },
  { pattern: /addEventListener\s*\((?!.*removeEventListener)/, framework: 'Angular (event)', suggestion: 'Use template event binding or @HostListener' },
  { pattern: /new\s+XMLHttpRequest/, framework: 'Angular HttpClient', suggestion: 'Use HttpClient instead of XMLHttpRequest' },
  { pattern: /window\.location\.(href|assign|replace)\s*=/, framework: 'Angular Router', suggestion: 'Use Router.navigate() instead of window.location' },
  { pattern: /localStorage\.(setItem|getItem|removeItem)\s*\(/, framework: 'Capacitor Preferences', suggestion: 'Use Capacitor Preferences API for mobile compatibility' },
];

export const preferFrameworkSolutionRule: RuleDefinition = {
  id: 'duplication/prefer-framework-solution',
  version: '1.0.0',
  category: 'duplication',
  severity: 'warning',
  description: 'Detects manual implementations when the framework provides a solution',
  principle: 'Use framework APIs instead of reinventing — they handle edge cases and testing',
  applicable_to: ['is_typescript'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.ts') || file.path.endsWith('.spec.ts') || file.path.endsWith('.test.ts')) return [];

    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');
    const findings: ReturnType<typeof createFinding>[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (line.trimStart().startsWith('//') || line.trimStart().startsWith('*')) continue;

      for (const { pattern, framework, suggestion } of PATTERNS) {
        if (pattern.test(line)) {
          findings.push(createFinding({
            rule_id: 'duplication/prefer-framework-solution',
            file: file.path,
            line: i + 1,
            severity: 'warning',
            message: `${suggestion}. ${framework} handles this natively.`,
            source_principle: 'Use framework APIs instead of manual implementations',
            category: 'duplication',
            fix_complexity: 'M',
            evidence_trail: [{
              tool: 'regex.preferFramework',
              query: { file: file.path },
              result: { line: i + 1, framework },
              timestamp: new Date().toISOString(),
              cache_hit: false,
            }],
          }));
          break;
        }
      }
    }

    return findings;
  },
};
