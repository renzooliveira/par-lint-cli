import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const COMPUTED_RE = /computed\s*\(\s*\(\s*\)\s*=>/;
const SIDE_EFFECT_RE = /\.(set|update)\s*\(|console\.\w+\s*\(|\.subscribe\s*\(/;

export const computedSideEffectRule: RuleDefinition = {
  id: 'signals/computed-side-effect',
  version: '1.0.0',
  category: 'signals',
  severity: 'error',
  description: 'Detects side effects (.set(), .update(), console.*, subscribe) inside computed()',
  principle: 'computed() must be pure — no side effects allowed',
  applicable_to: ['is_typescript'],

  async run(file, _config, cwd) {
    if (!file.path.endsWith('.ts')) return [];

    const source = await readSource(file.path, cwd);
    if (!source.includes('computed(')) return [];

    const lines = source.split('\n');
    const findings = [];

    let inComputed = false;
    let braceDepth = 0;
    let computedBraceDepth = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;

      if (!inComputed && COMPUTED_RE.test(line)) {
        inComputed = true;
        computedBraceDepth = braceDepth;
      }

      for (const ch of line) {
        if (ch === '{') braceDepth++;
        else if (ch === '}') {
          braceDepth--;
          if (inComputed && braceDepth <= computedBraceDepth) {
            inComputed = false;
          }
        }
      }

      if (inComputed && SIDE_EFFECT_RE.test(line)) {
        findings.push(createFinding({
          rule_id: 'signals/computed-side-effect',
          file: file.path,
          line: i + 1,
          severity: 'error',
          message: 'Side effect inside computed(). computed() must be pure.',
          source_principle: 'Computed signals must be pure functions',
          category: 'signals',
          fix_complexity: 'M',
          evidence_trail: [{
            tool: 'regex',
            query: { pattern: 'side effect in computed', file: file.path },
            result: { line: i + 1 },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
        break;
      }
    }

    return findings;
  },
};
