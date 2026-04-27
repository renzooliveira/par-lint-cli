import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

export const giantTestRule: RuleDefinition = {
  id: 'test/giant-test',
  version: '1.0.0',
  category: 'test',
  severity: 'info',
  description: 'Detects individual test cases longer than 30 lines',
  principle: 'Long tests are hard to understand and maintain; split into focused tests',
  applicable_to: ['is_test', 'is_spec'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.spec.ts') && !file.path.endsWith('.test.ts')) return [];

    const source = await readSource(file.path, cwd);
    const findings = [];
    const lines = source.split('\n');
    const maxLines = 30;

    for (let i = 0; i < lines.length; i++) {
      if (/^\s*(it|test)\s*\(/.test(lines[i]!)) {
        let depth = 0;
        let start = i;
        let end = i;
        for (let j = i; j < lines.length; j++) {
          depth += (lines[j]!.match(/\{/g) ?? []).length;
          depth -= (lines[j]!.match(/\}/g) ?? []).length;
          if (depth <= 0 && j > i) { end = j; break; }
        }
        const testLength = end - start + 1;
        if (testLength > maxLines) {
          findings.push(createFinding({
            rule_id: 'test/giant-test',
            file: file.path,
            line: i + 1,
            severity: 'info',
            message: `Test case is ${testLength} lines (max ${maxLines}). Split into smaller, focused tests.`,
            source_principle: 'Small tests are easier to understand and debug',
            category: 'test',
            fix_complexity: 'M',
            evidence_trail: [{
              tool: 'regex.giantTest',
              query: { file: file.path },
              result: { line: i + 1, length: testLength },
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
