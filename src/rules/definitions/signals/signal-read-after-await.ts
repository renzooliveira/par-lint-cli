import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const EFFECT_RE = /effect\s*\(\s*async/;
const AWAIT_RE = /\bawait\b/;
const SIGNAL_READ_RE = /\bthis\.\w+\(\)/;

export const signalReadAfterAwaitRule: RuleDefinition = {
  id: 'signals/signal-read-after-await',
  version: '1.0.0',
  category: 'signals',
  severity: 'error',
  description: 'Detects signal reads after await in effect() — not tracked by Angular',
  principle: 'Angular only tracks synchronous signal reads in effect(); async reads are invisible',
  applicable_to: ['is_typescript'],

  async run(file, _config, cwd) {
    if (!file.path.endsWith('.ts')) return [];

    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');
    const findings = [];

    let inAsyncEffect = false;
    let sawAwait = false;
    let braceDepth = 0;
    let effectBraceDepth = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;

      if (!inAsyncEffect && EFFECT_RE.test(line)) {
        inAsyncEffect = true;
        effectBraceDepth = braceDepth;
      }

      for (const ch of line) {
        if (ch === '{') braceDepth++;
        else if (ch === '}') {
          braceDepth--;
          if (inAsyncEffect && braceDepth === effectBraceDepth) {
            inAsyncEffect = false;
            sawAwait = false;
          }
        }
      }

      if (inAsyncEffect) {
        if (AWAIT_RE.test(line)) sawAwait = true;
        if (sawAwait && SIGNAL_READ_RE.test(line)) {
          findings.push(createFinding({
            rule_id: 'signals/signal-read-after-await',
            file: file.path,
            line: i + 1,
            severity: 'error',
            message: 'Signal read after await in effect() is not tracked. Move reads before await.',
            source_principle: 'Only synchronous reads are tracked in effect()',
            category: 'signals',
            fix_complexity: 'M',
            evidence_trail: [{
              tool: 'regex',
              query: { pattern: 'signal read after await', file: file.path },
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
