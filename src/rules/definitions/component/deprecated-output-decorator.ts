import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

export const deprecatedOutputDecoratorRule: RuleDefinition = {
  id: 'component/deprecated-output-decorator',
  version: '1.0.0',
  category: 'component',
  severity: 'info',
  description: 'Detects @Output() decorator usage instead of output() function',
  principle: 'Angular output() function provides better type safety and consistency with signals',
  applicable_to: ['is_component', 'is_typescript'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.ts')) return [];

    const source = await readSource(file.path, cwd);
    const findings = [];
    const lines = source.split('\n');

    for (let i = 0; i < lines.length; i++) {
      if (/@Output\s*\(/.test(lines[i]!)) {
        findings.push(createFinding({
          rule_id: 'component/deprecated-output-decorator',
          file: file.path,
          line: i + 1,
          severity: 'info',
          message: 'Use output() function instead of @Output() decorator.',
          source_principle: 'output() function provides better type safety and consistency with signals',
          category: 'component',
          fix_complexity: 'L',
          evidence_trail: [{
            tool: 'regex.deprecatedOutput',
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
