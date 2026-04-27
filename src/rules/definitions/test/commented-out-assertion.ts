import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

export const commentedOutAssertionRule: RuleDefinition = {
  id: 'test/commented-out-assertion',
  version: '1.0.0',
  category: 'test',
  severity: 'warning',
  description: 'Detects commented-out assertions in test files',
  principle: 'Commented assertions hide failing tests and reduce coverage',
  applicable_to: ['is_test', 'is_spec'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.spec.ts') && !file.path.endsWith('.test.ts')) return [];

    const source = await readSource(file.path, cwd);
    const findings = [];
    const lines = source.split('\n');

    for (let i = 0; i < lines.length; i++) {
      if (/^\s*\/\/\s*expect\s*\(/.test(lines[i]!)) {
        findings.push(createFinding({
          rule_id: 'test/commented-out-assertion',
          file: file.path,
          line: i + 1,
          severity: 'warning',
          message: 'Commented-out assertion. Either fix and uncomment or remove it.',
          source_principle: 'Commented assertions hide test gaps',
          category: 'test',
          fix_complexity: 'L',
          evidence_trail: [{
            tool: 'regex.commentedAssertion',
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
