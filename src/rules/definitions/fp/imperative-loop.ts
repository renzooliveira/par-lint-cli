import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

export const imperativeLoopRule: RuleDefinition = {
  id: 'fp/imperative-loop',
  version: '1.0.0',
  category: 'fp',
  severity: 'info',
  description: 'Detects for/while loops that could use map/filter/reduce',
  principle: 'Declarative array methods express intent more clearly than imperative loops',
  applicable_to: ['is_typescript'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.ts') || file.path.endsWith('.spec.ts') || file.path.endsWith('.test.ts')) return [];

    const source = await readSource(file.path, cwd);
    const findings = [];
    const lines = source.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (/^\s*for\s*\(/.test(line)) {
        const body = lines.slice(i + 1, Math.min(i + 8, lines.length)).join('\n');
        if (/\.push\s*\(/.test(body) || /\+=\s/.test(body)) {
          findings.push(createFinding({
            rule_id: 'fp/imperative-loop',
            file: file.path,
            line: i + 1,
            severity: 'info',
            message: 'Imperative loop with push/accumulate. Consider map(), filter(), or reduce().',
            source_principle: 'Declarative methods are more readable and composable',
            category: 'fp',
            fix_complexity: 'M',
            evidence_trail: [{
              tool: 'regex.imperativeLoop',
              query: { file: file.path },
              result: { line: i + 1 },
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
