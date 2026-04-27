import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const ALWAYS_TRUE_PATTERNS = [
  /expect\s*\(\s*true\s*\)\s*\.\s*toBe\s*\(\s*true\s*\)/,
  /expect\s*\(\s*true\s*\)\s*\.\s*toEqual\s*\(\s*true\s*\)/,
  /expect\s*\(\s*false\s*\)\s*\.\s*toBe\s*\(\s*false\s*\)/,
  /expect\s*\(\s*false\s*\)\s*\.\s*toEqual\s*\(\s*false\s*\)/,
  /expect\s*\(\s*1\s*\)\s*\.\s*toBeTruthy\s*\(\s*\)/,
  /expect\s*\(\s*0\s*\)\s*\.\s*toBeFalsy\s*\(\s*\)/,
];

export const alwaysTrueAssertionRule: RuleDefinition = {
  id: 'test/always-true-assertion',
  version: '1.0.0',
  category: 'test',
  severity: 'error',
  description: 'Detects tautological assertions like expect(true).toBe(true)',
  principle: 'Tests must verify actual behavior, not hardcoded truths',
  applicable_to: ['is_test', 'is_spec'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.spec.ts') && !file.path.endsWith('.test.ts')) return [];

    const source = await readSource(file.path, cwd);
    const findings = [];
    const lines = source.split('\n');

    for (let i = 0; i < lines.length; i++) {
      for (const pattern of ALWAYS_TRUE_PATTERNS) {
        if (pattern.test(lines[i]!)) {
          findings.push(createFinding({
            rule_id: 'test/always-true-assertion',
            file: file.path,
            line: i + 1,
            severity: 'error',
            message: 'Tautological assertion. This test will always pass without verifying behavior.',
            source_principle: 'Every assertion should test actual application logic',
            category: 'test',
            fix_complexity: 'L',
            evidence_trail: [{
              tool: 'regex.alwaysTrue',
              query: { file: file.path },
              result: { line: i + 1, match: lines[i]!.trim() },
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
