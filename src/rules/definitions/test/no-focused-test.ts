import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const FOCUSED_RE = /\b(fdescribe|fit|describe\.only|it\.only|test\.only|xdescribe|xit|describe\.skip|it\.skip|test\.skip)\s*\(/g;

export const noFocusedTestRule: RuleDefinition = {
  id: 'test/no-focused-test',
  version: '1.0.0',
  category: 'test',
  severity: 'error',
  description: 'Detects focused or skipped tests (fdescribe, fit, .only, .skip)',
  principle: 'Focused tests make CI run only a subset; skipped tests get forgotten',
  applicable_to: ['is_typescript'],

  async run(file, _config, cwd) {
    if (!file.path.endsWith('.spec.ts') && !file.path.endsWith('.test.ts')) return [];

    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');
    const findings = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      for (const match of line.matchAll(FOCUSED_RE)) {
        findings.push(createFinding({
          rule_id: 'test/no-focused-test',
          file: file.path,
          line: i + 1,
          severity: 'error',
          message: `"${match[1]}" detected. Remove focused/skipped test before committing.`,
          source_principle: 'All tests must run in CI',
          category: 'test',
          fix_complexity: 'S',
          evidence_trail: [{
            tool: 'regex',
            query: { pattern: 'focused test', file: file.path },
            result: { line: i + 1, keyword: match[1] },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
      }
    }

    return findings;
  },
};
