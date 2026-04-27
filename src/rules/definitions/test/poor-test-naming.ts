import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const GENERIC_NAMES = /^\s*(it|test)\s*\(\s*['"`](should work|test|works|it works|does something|todo|fix me|default|placeholder)['"`]/i;

export const poorTestNamingRule: RuleDefinition = {
  id: 'test/poor-test-naming',
  version: '1.0.0',
  category: 'test',
  severity: 'info',
  description: 'Detects generic test names like "should work" or "test"',
  principle: 'Descriptive test names serve as documentation and simplify debugging',
  applicable_to: ['is_test', 'is_spec'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.spec.ts') && !file.path.endsWith('.test.ts')) return [];

    const source = await readSource(file.path, cwd);
    const findings = [];
    const lines = source.split('\n');

    for (let i = 0; i < lines.length; i++) {
      if (GENERIC_NAMES.test(lines[i]!)) {
        findings.push(createFinding({
          rule_id: 'test/poor-test-naming',
          file: file.path,
          line: i + 1,
          severity: 'info',
          message: 'Generic test name. Use a descriptive name that explains what is being tested.',
          source_principle: 'Test names are executable documentation',
          category: 'test',
          fix_complexity: 'L',
          evidence_trail: [{
            tool: 'regex.genericTestName',
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
