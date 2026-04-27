import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const TERMINATOR_RE = /^\s*(return\b|throw\b|break\s*;|continue\s*;)/;
const BRACE_CLOSE_RE = /^\s*\}/;

export const deadCodeAfterReturnRule: RuleDefinition = {
  id: 'hygiene/dead-code-after-return',
  version: '1.0.0',
  category: 'hygiene',
  severity: 'warning',
  description: 'Detects unreachable code after return/throw/break/continue',
  principle: 'Dead code is confusing noise; remove it',
  applicable_to: ['is_typescript'],

  async run(file, _config, cwd) {
    if (!file.path.endsWith('.ts')) return [];

    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');
    const findings = [];

    let afterTerminator = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      const trimmed = line.trim();

      if (trimmed.length === 0) continue;

      if (afterTerminator) {
        if (BRACE_CLOSE_RE.test(line)) {
          afterTerminator = false;
          continue;
        }

        findings.push(createFinding({
          rule_id: 'hygiene/dead-code-after-return',
          file: file.path,
          line: i + 1,
          severity: 'warning',
          message: 'Unreachable code after return/throw/break/continue.',
          source_principle: 'Dead code should be removed',
          category: 'hygiene',
          fix_complexity: 'S',
          evidence_trail: [{
            tool: 'regex',
            query: { pattern: 'dead code', file: file.path },
            result: { line: i + 1 },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
        afterTerminator = false;
        continue;
      }

      if (TERMINATOR_RE.test(line) && !line.includes('{')) {
        afterTerminator = true;
      }
    }

    return findings;
  },
};
