import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const TERMINATOR_RE = /^\s*(return\b|throw\b|break\s*;|continue\s*;)/;
const BRACE_CLOSE_RE = /^\s*\}/;
const CASE_LABEL_RE = /^\s*(case\s+|default\s*:)/;
const CONTINUATION_RE = /^\s*[.)`,]|^\s*\.\w/;

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
        if (BRACE_CLOSE_RE.test(line) || CASE_LABEL_RE.test(line) || CONTINUATION_RE.test(line)) {
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
          suggested_fix: {
            kind: 'replace',
            description: 'Remove unreachable code after return/throw',
          },
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

      if (TERMINATOR_RE.test(line) && !line.includes('{') &&
          !line.includes('`') && !/\b(if|else|for|while)\b/.test(line) &&
          !/\(\s*$/.test(trimmed)) {
        afterTerminator = true;
      }
    }

    return findings;
  },
};
