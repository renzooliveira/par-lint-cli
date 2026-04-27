import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

export const deprecatedStructuralDirectiveRule: RuleDefinition = {
  id: 'template/deprecated-structural-directive',
  version: '1.0.0',
  category: 'template',
  severity: 'warning',
  description: 'Detects *ngIf/*ngFor/*ngSwitch instead of @if/@for/@switch',
  principle: 'Built-in control flow is more performant and type-safe',
  applicable_to: ['is_template', 'is_html'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.html')) return [];

    const source = await readSource(file.path, cwd);
    const findings = [];
    const lines = source.split('\n');
    const directives = [
      { pattern: /\*ngIf\b/, replacement: '@if' },
      { pattern: /\*ngFor\b/, replacement: '@for' },
      { pattern: /\*ngSwitch\b/, replacement: '@switch' },
      { pattern: /\*ngSwitchCase\b/, replacement: '@case' },
    ];

    for (let i = 0; i < lines.length; i++) {
      for (const dir of directives) {
        if (dir.pattern.test(lines[i]!)) {
          findings.push(createFinding({
            rule_id: 'template/deprecated-structural-directive',
            file: file.path,
            line: i + 1,
            severity: 'warning',
            message: `Use ${dir.replacement} instead of ${dir.pattern.source.replace('\\b', '')}.`,
            source_principle: 'Built-in control flow is more performant and type-safe',
            category: 'template',
            fix_complexity: 'M',
            evidence_trail: [{
              tool: 'regex.structuralDirective',
              query: { file: file.path },
              result: { line: i + 1, match: lines[i]!.trim() },
              timestamp: new Date().toISOString(),
              cache_hit: false,
            }],
          }));
        }
      }
    }

    return findings;
  },
};
