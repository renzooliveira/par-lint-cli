import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

export const assertInCatchOnlyRule: RuleDefinition = {
  id: 'test/assert-in-catch-only',
  version: '1.0.0',
  category: 'test',
  severity: 'error',
  description: 'Detects assertions only inside catch blocks (test passes if no error thrown)',
  principle: 'If no exception occurs, the test silently passes without verifying anything',
  applicable_to: ['is_test', 'is_spec'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.spec.ts') && !file.path.endsWith('.test.ts')) return [];

    const source = await readSource(file.path, cwd);
    const findings = [];
    const lines = source.split('\n');

    for (let i = 0; i < lines.length; i++) {
      if (/^\s*(it|test)\s*\(/.test(lines[i]!)) {
        let depth = 0;
        let inCatch = false;
        let hasExpectOutsideCatch = false;
        let hasExpectInsideCatch = false;
        let testEnd = i;

        for (let j = i; j < lines.length; j++) {
          const line = lines[j]!;
          depth += (line.match(/\{/g) ?? []).length;
          depth -= (line.match(/\}/g) ?? []).length;

          if (/\bcatch\s*\(/.test(line)) inCatch = true;
          if (inCatch && /\bexpect\s*\(/.test(line)) hasExpectInsideCatch = true;
          if (!inCatch && /\bexpect\s*\(/.test(line) && j > i) hasExpectOutsideCatch = true;
          if (inCatch && /^\s*\}/.test(line) && !/catch/.test(line)) inCatch = false;

          if (depth <= 0 && j > i) { testEnd = j; break; }
        }

        if (hasExpectInsideCatch && !hasExpectOutsideCatch) {
          findings.push(createFinding({
            rule_id: 'test/assert-in-catch-only',
            file: file.path,
            line: i + 1,
            severity: 'error',
            message: 'Assertions only in catch block. Test passes silently if no error thrown. Use expect().toThrow().',
            source_principle: 'Tests must fail when the expected behavior does not occur',
            category: 'test',
            fix_complexity: 'L',
            evidence_trail: [{
              tool: 'regex.catchOnlyAssert',
              query: { file: file.path },
              result: { line: i + 1, testEnd },
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
