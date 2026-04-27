import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const IT_RE = /\b(it|test)\s*\(/;
const EXPECT_RE = /\bexpect\s*\(/;

export const noAssertionRule: RuleDefinition = {
  id: 'test/no-assertion',
  version: '1.0.0',
  category: 'test',
  severity: 'warning',
  description: 'Detects it()/test() blocks without any expect()',
  principle: 'Tests without assertions never fail and give false confidence',
  applicable_to: ['is_typescript'],

  async run(file, _config, cwd) {
    if (!file.path.endsWith('.spec.ts') && !file.path.endsWith('.test.ts')) return [];

    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');
    const findings = [];

    let inTest = false;
    let testStartLine = 0;
    let braceDepth = 0;
    let testBraceDepth = 0;
    let hasExpect = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;

      if (!inTest && IT_RE.test(line)) {
        inTest = true;
        testBraceDepth = braceDepth;
        testStartLine = i + 1;
        hasExpect = false;
      }

      for (const ch of line) {
        if (ch === '{') braceDepth++;
        else if (ch === '}') {
          braceDepth--;
          if (inTest && braceDepth === testBraceDepth) {
            if (!hasExpect) {
              findings.push(createFinding({
                rule_id: 'test/no-assertion',
                file: file.path,
                line: testStartLine,
                severity: 'warning',
                message: 'Test has no expect() assertion. A test that never fails provides no value.',
                source_principle: 'Tests must assert something',
                category: 'test',
                fix_complexity: 'S',
                evidence_trail: [{
                  tool: 'regex',
                  query: { pattern: 'no assertion', file: file.path },
                  result: { line: testStartLine },
                  timestamp: new Date().toISOString(),
                  cache_hit: false,
                }],
              }));
            }
            inTest = false;
          }
        }
      }

      if (inTest && EXPECT_RE.test(line)) hasExpect = true;
    }

    return findings;
  },
};
