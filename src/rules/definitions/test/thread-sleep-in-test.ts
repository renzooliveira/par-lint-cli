import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

export const threadSleepInTestRule: RuleDefinition = {
  id: 'test/thread-sleep-in-test',
  version: '1.0.0',
  category: 'test',
  severity: 'warning',
  description: 'Detects fixed setTimeout/sleep delays in tests',
  principle: 'Fixed delays make tests slow and flaky; use fakeAsync or waitFor',
  applicable_to: ['is_test', 'is_spec'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.spec.ts') && !file.path.endsWith('.test.ts')) return [];

    const source = await readSource(file.path, cwd);
    const findings = [];
    const lines = source.split('\n');

    for (let i = 0; i < lines.length; i++) {
      if (/setTimeout\s*\(.*\d{3,}/.test(lines[i]!) || /new\s+Promise.*setTimeout/.test(lines[i]!)) {
        findings.push(createFinding({
          rule_id: 'test/thread-sleep-in-test',
          file: file.path,
          line: i + 1,
          severity: 'warning',
          message: 'Fixed delay in test. Use fakeAsync/tick, vi.advanceTimersByTime, or waitFor instead.',
          source_principle: 'Fixed delays cause slow and flaky tests',
          category: 'test',
          fix_complexity: 'M',
          evidence_trail: [{
            tool: 'regex.sleepInTest',
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
