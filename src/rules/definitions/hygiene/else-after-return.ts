import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

export const elseAfterReturnRule: RuleDefinition = {
  id: 'hygiene/else-after-return',
  version: '1.0.0',
  category: 'hygiene',
  severity: 'info',
  description: 'Detects unnecessary else after return/throw/continue/break',
  principle: 'Early returns eliminate nesting and improve readability',
  applicable_to: ['is_typescript'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.ts') || file.path.endsWith('.spec.ts') || file.path.endsWith('.test.ts')) return [];

    const source = await readSource(file.path, cwd);
    const findings = [];
    const lines = source.split('\n');

    for (let i = 1; i < lines.length; i++) {
      if (/^\s*}\s*else\s*\{/.test(lines[i]!)) {
        const prevLines = lines.slice(Math.max(0, i - 3), i).join('\n');
        if (/\b(return|throw|continue|break)\b/.test(prevLines)) {
          findings.push(createFinding({
            rule_id: 'hygiene/else-after-return',
            file: file.path,
            line: i + 1,
            severity: 'info',
            message: 'Unnecessary else after return. Remove else and dedent the block.',
            source_principle: 'Early returns reduce nesting depth',
            category: 'hygiene',
            fix_complexity: 'L',
            evidence_trail: [{
              tool: 'regex.elseAfterReturn',
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
