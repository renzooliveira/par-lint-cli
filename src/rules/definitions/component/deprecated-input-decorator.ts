import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

export const deprecatedInputDecoratorRule: RuleDefinition = {
  id: 'component/deprecated-input-decorator',
  version: '1.0.0',
  category: 'component',
  severity: 'info',
  description: 'Detects @Input() decorator usage instead of input() signal function',
  principle: 'Angular signal inputs provide better type safety and reactivity',
  applicable_to: ['is_component', 'is_typescript'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.ts')) return [];

    const source = await readSource(file.path, cwd);
    const findings = [];
    const lines = source.split('\n');

    for (let i = 0; i < lines.length; i++) {
      if (/@Input\s*\(/.test(lines[i]!)) {
        findings.push(createFinding({
          rule_id: 'component/deprecated-input-decorator',
          file: file.path,
          line: i + 1,
          severity: 'info',
          message: 'Use input() signal function instead of @Input() decorator.',
          source_principle: 'Signal inputs provide better type safety and reactivity',
          category: 'component',
          fix_complexity: 'L',
          evidence_trail: [{
            tool: 'regex.deprecatedInput',
            query: { file: file.path },
            result: { line: i + 1, match: lines[i]!.trim() },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
      }
    }

    return findings;
  },
};
