import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const ADD_LISTENER_RE = /\baddEventListener\s*\(/g;
const CLEANUP_RE = /removeEventListener|takeUntilDestroyed|ngOnDestroy/;

export const listenerLeakRule: RuleDefinition = {
  id: 'perf/listener-leak',
  version: '1.0.0',
  category: 'perf',
  severity: 'error',
  description: 'Detects addEventListener/subscribe without matching cleanup',
  principle: 'Every registered listener must be removed to prevent memory leaks',
  applicable_to: ['is_typescript'],

  async run(file, _config, cwd) {
    const source = await readSource(file.path, cwd);

    if (!source.includes('addEventListener')) return [];
    if (CLEANUP_RE.test(source)) return [];

    const lines = source.split('\n');
    const findings = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      ADD_LISTENER_RE.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = ADD_LISTENER_RE.exec(line)) !== null) {
        findings.push(createFinding({
          rule_id: 'perf/listener-leak',
          file: file.path,
          line: i + 1,
          column: match.index + 1,
          severity: 'error',
          message: 'addEventListener without matching cleanup. Add removeEventListener in ngOnDestroy or use takeUntilDestroyed.',
          source_principle: 'Event listeners without cleanup cause memory leaks',
          category: 'perf',
          fix_complexity: 'M',
          evidence_trail: [{
            tool: 'regex',
            query: { file: file.path },
            result: { line: i + 1, hasCleanup: false },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
      }
    }

    return findings;
  },
};
