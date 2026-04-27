import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const SUBSCRIBE_RE = /\.subscribe\s*\(/g;

export const nestedSubscribeRule: RuleDefinition = {
  id: 'rxjs/nested-subscribe',
  version: '1.0.0',
  category: 'rxjs',
  severity: 'error',
  description: 'Detects .subscribe() inside another .subscribe() callback',
  principle: 'Nested subscribes create pyramid of doom; use switchMap/mergeMap/concatMap',
  applicable_to: ['is_typescript'],

  async run(file, _config, cwd) {
    if (!file.path.endsWith('.ts')) return [];

    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');
    const findings = [];

    let subscribeDepth = 0;
    let braceDepth = 0;
    const subscribeStack: number[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;

      for (const match of line.matchAll(SUBSCRIBE_RE)) {
        if (subscribeDepth > 0) {
          findings.push(createFinding({
            rule_id: 'rxjs/nested-subscribe',
            file: file.path,
            line: i + 1,
            severity: 'error',
            message: 'Nested .subscribe() detected. Use switchMap, mergeMap, or concatMap instead.',
            source_principle: 'Nested subscribes create callback hell',
            category: 'rxjs',
            fix_complexity: 'M',
            evidence_trail: [{
              tool: 'regex',
              query: { pattern: 'nested subscribe', file: file.path },
              result: { line: i + 1, depth: subscribeDepth + 1 },
              timestamp: new Date().toISOString(),
              cache_hit: false,
            }],
          }));
        }
      }

      for (const ch of line) {
        if (ch === '{') {
          braceDepth++;
          if (line.includes('.subscribe')) {
            subscribeDepth++;
            subscribeStack.push(braceDepth);
          }
        } else if (ch === '}') {
          if (subscribeStack.length > 0 && subscribeStack[subscribeStack.length - 1] === braceDepth) {
            subscribeStack.pop();
            subscribeDepth--;
          }
          braceDepth--;
        }
      }
    }

    return findings;
  },
};
