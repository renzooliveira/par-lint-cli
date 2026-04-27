import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const IT_RE = /\b(it|test)\s*\(/;
const EXPECT_RE = /\bexpect\s*\(/g;
const MAX_ASSERTIONS = 5;

export const tooManyAssertionsRule: RuleDefinition = {
  id: 'test/too-many-assertions',
  version: '1.0.0',
  category: 'test',
  severity: 'info',
  description: 'Detects test cases with too many assertions (default >5)',
  principle: 'Each test should verify one behavior; many assertions indicate multiple concerns',
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
    let expectCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;

      if (!inTest && IT_RE.test(line)) {
        inTest = true;
        testBraceDepth = braceDepth;
        testStartLine = i + 1;
        expectCount = 0;
      }

      for (const ch of line) {
        if (ch === '{') braceDepth++;
        else if (ch === '}') {
          braceDepth--;
          if (inTest && braceDepth === testBraceDepth) {
            if (expectCount > MAX_ASSERTIONS) {
              findings.push(createFinding({
                rule_id: 'test/too-many-assertions',
                file: file.path,
                line: testStartLine,
                severity: 'info',
                message: `Test has ${expectCount} assertions (max ${MAX_ASSERTIONS}). Split into focused tests.`,
                source_principle: 'One test, one behavior',
                category: 'test',
                fix_complexity: 'M',
                evidence_trail: [{
                  tool: 'regex',
                  query: { pattern: 'assertion count', file: file.path },
                  result: { line: testStartLine, count: expectCount },
                  timestamp: new Date().toISOString(),
                  cache_hit: false,
                }],
              }));
            }
            inTest = false;
          }
        }
      }

      if (inTest) {
        expectCount += (line.match(EXPECT_RE) || []).length;
      }
    }

    return findings;
  },
};
