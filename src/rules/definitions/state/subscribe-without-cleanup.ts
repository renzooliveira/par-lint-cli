import type { RuleDefinition } from '../../../engine/runner.js';
import { findPattern, readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const CLEANUP_PATTERNS = [
  'takeUntilDestroyed',
  'takeUntil',
  'take(1)',
  'first()',
  'unsubscribe',
];

export const subscribeWithoutCleanupRule: RuleDefinition = {
  id: 'state/subscribe-without-cleanup',
  version: '1.0.0',
  category: 'state',
  severity: 'error',
  applicable_to: ['is_component', 'is_page'],

  async run(file, _config, cwd) {
    const matches = await findPattern(file.path, '$OBS.subscribe($$$ARGS)', cwd);
    if (matches.length === 0) return [];

    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');
    const findings = [];

    for (const match of matches) {
      const matchContext = match.text;
      const contextStart = Math.max(0, match.line - 10);
      const contextEnd = Math.min(lines.length, match.line);
      const surroundingContext = lines.slice(contextStart, contextEnd).join('\n');
      const fullContext = matchContext + '\n' + surroundingContext;

      const hasCleanup = CLEANUP_PATTERNS.some((p) => fullContext.includes(p));

      if (!hasCleanup) {
        findings.push(createFinding({
          rule_id: 'state/subscribe-without-cleanup',
          file: file.path,
          line: match.line,
          column: match.column,
          severity: 'error',
          message: 'Subscription without cleanup operator. Use takeUntilDestroyed() or takeUntil() to prevent memory leaks.',
          source_principle: 'Subscription has explicit cleanup',
          category: 'state',
          fix_complexity: 'S',
          evidence_trail: [{
            tool: 'T7.find_pattern',
            query: { pattern: '$OBS.subscribe($$$ARGS)', file: file.path },
            result: { line: match.line, text: match.text, has_cleanup: false },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
      }
    }

    return findings;
  },
};
