import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const TEST_CALL_RE = /\b(it|test)\s*\(/;
const EXPECT_RE = /\bexpect\s*\(/;

export const emptySpecRule: RuleDefinition = {
  id: 'test/empty-spec',
  version: '1.0.0',
  category: 'test',
  severity: 'warning',
  description: 'Detects spec files without any it()/test()/expect()',
  principle: 'Empty spec files give false sense of test coverage',
  applicable_to: ['is_typescript'],

  async run(file, _config, cwd) {
    if (!file.path.endsWith('.spec.ts') && !file.path.endsWith('.test.ts')) return [];

    const source = await readSource(file.path, cwd);

    if (TEST_CALL_RE.test(source) || EXPECT_RE.test(source)) return [];

    return [createFinding({
      rule_id: 'test/empty-spec',
      file: file.path,
      line: 1,
      severity: 'warning',
      message: 'Spec file has no it()/test()/expect(). Add real tests or remove placeholder.',
      source_principle: 'Empty specs give false coverage confidence',
      category: 'test',
      fix_complexity: 'M',
      evidence_trail: [{
        tool: 'regex',
        query: { pattern: 'empty spec', file: file.path },
        result: { hasTests: false },
        timestamp: new Date().toISOString(),
        cache_hit: false,
      }],
    })];
  },
};
