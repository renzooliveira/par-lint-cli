import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

export const eventListenerWithoutDisposeRule: RuleDefinition = {
  id: 'perf/event-listener-without-dispose',
  version: '1.0.0',
  category: 'perf',
  severity: 'warning',
  description: 'Detects addEventListener without corresponding removeEventListener',
  principle: 'Unremoved event listeners cause memory leaks',
  applicable_to: ['is_typescript'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.ts') || file.path.endsWith('.spec.ts') || file.path.endsWith('.test.ts')) return [];

    const source = await readSource(file.path, cwd);
    if (!source.includes('addEventListener')) return [];

    const hasRemove = source.includes('removeEventListener');
    if (hasRemove) return [];

    const findings = [];
    const lines = source.split('\n');

    for (let i = 0; i < lines.length; i++) {
      if (/\.addEventListener\s*\(/.test(lines[i]!)) {
        findings.push(createFinding({
          rule_id: 'perf/event-listener-without-dispose',
          file: file.path,
          line: i + 1,
          severity: 'warning',
          message: 'addEventListener without removeEventListener. Add cleanup in ngOnDestroy.',
          source_principle: 'Event listeners must be removed to prevent memory leaks',
          category: 'perf',
          fix_complexity: 'L',
          evidence_trail: [{
            tool: 'regex.addEventListenerNoRemove',
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
