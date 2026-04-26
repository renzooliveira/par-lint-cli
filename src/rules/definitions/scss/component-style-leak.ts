import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const NG_DEEP_RE = /::ng-deep/g;

export const componentStyleLeakRule: RuleDefinition = {
  id: 'scss/component-style-leak',
  version: '1.0.0',
  category: 'scss',
  severity: 'warning',
  description: 'Detects ::ng-deep usage that leaks component styles globally',
  principle: 'Component styles must not leak to other components',
  applicable_to: ['is_scss', 'is_style'],

  async run(file, _config, cwd) {
    if (!file.path.endsWith('.component.scss')) return [];

    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');
    const findings = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      NG_DEEP_RE.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = NG_DEEP_RE.exec(line)) !== null) {
        findings.push(createFinding({
          rule_id: 'scss/component-style-leak',
          file: file.path,
          line: i + 1,
          column: match.index + 1,
          severity: 'warning',
          message: '::ng-deep breaks style encapsulation. Use component-scoped selectors or CSS custom properties.',
          source_principle: 'Component styles should not leak to children',
          category: 'scss',
          fix_complexity: 'M',
          evidence_trail: [{
            tool: 'regex',
            query: { file: file.path },
            result: { line: i + 1 },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
      }
    }

    return findings;
  },
};
