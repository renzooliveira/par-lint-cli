import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

export const varInLoopRule: RuleDefinition = {
  id: 'fp/var-in-loop',
  version: '1.0.0',
  category: 'fp',
  severity: 'error',
  description: 'Detects var declarations inside loops',
  principle: 'var in loops causes closure bugs due to function-scoped hoisting',
  applicable_to: ['is_typescript'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.ts') || file.path.endsWith('.spec.ts') || file.path.endsWith('.test.ts')) return [];

    const source = await readSource(file.path, cwd);
    if (!/\bvar\b/.test(source)) return [];

    const findings = [];
    const lines = source.split('\n');
    let inLoop = false;
    let loopDepth = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (/\b(for|while|do)\b/.test(line)) {
        inLoop = true;
        loopDepth = 0;
      }
      if (inLoop) {
        loopDepth += (line.match(/\{/g) ?? []).length;
        loopDepth -= (line.match(/\}/g) ?? []).length;
        if (/\bvar\s+\w+/.test(line)) {
          findings.push(createFinding({
            rule_id: 'fp/var-in-loop',
            file: file.path,
            line: i + 1,
            severity: 'error',
            message: 'var inside loop causes closure bugs. Use let or const instead.',
            source_principle: 'var is function-scoped; let/const are block-scoped',
            category: 'fp',
            fix_complexity: 'L',
            evidence_trail: [{
              tool: 'regex.varInLoop',
              query: { file: file.path },
              result: { line: i + 1 },
              timestamp: new Date().toISOString(),
              cache_hit: false,
            }],
          }));
        }
        if (loopDepth <= 0) inLoop = false;
      }
    }

    return findings;
  },
};
