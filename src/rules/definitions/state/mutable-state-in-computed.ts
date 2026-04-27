import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const MUTATION_RE = /\.(set|update|push|splice|pop|shift|unshift|sort|reverse|fill)\s*\(/;

export const mutableStateInComputedRule: RuleDefinition = {
  id: 'state/mutable-state-in-computed',
  version: '1.0.0',
  category: 'state',
  severity: 'error',
  description: 'Detects state mutation inside computed()',
  principle: 'Computed signals must be pure — no side effects or state mutation',
  applicable_to: ['is_typescript'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.ts') || file.path.endsWith('.spec.ts') || file.path.endsWith('.test.ts')) return [];

    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');
    const findings: ReturnType<typeof createFinding>[] = [];

    let inComputed = false;
    let braceDepth = 0;
    let computedStartDepth = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;

      if (/\bcomputed\s*\(/.test(line) && !inComputed) {
        inComputed = true;
        computedStartDepth = braceDepth;
      }

      for (const ch of line) {
        if (ch === '(') braceDepth++;
        if (ch === ')') {
          braceDepth--;
          if (inComputed && braceDepth <= computedStartDepth) {
            inComputed = false;
          }
        }
      }

      if (inComputed) {
        const mutMatch = line.match(MUTATION_RE);
        if (mutMatch) {
          findings.push(createFinding({
            rule_id: 'state/mutable-state-in-computed',
            file: file.path,
            line: i + 1,
            severity: 'error',
            message: `State mutation '${mutMatch[0].trim()}' inside computed(). Computed must be pure.`,
            source_principle: 'Computed signals must be pure',
            category: 'state',
            fix_complexity: 'M',
            evidence_trail: [{
              tool: 'regex.mutableComputed',
              query: { file: file.path },
              result: { line: i + 1, mutation: mutMatch[0].trim() },
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
