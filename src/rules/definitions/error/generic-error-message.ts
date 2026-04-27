import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const GENERIC_MESSAGES = new Set([
  'Error', 'error', 'Something went wrong', 'Unknown error',
  'Failed', 'Unexpected error', 'An error occurred',
]);

const THROW_ERROR_RE = /throw\s+new\s+Error\(\s*['"]([^'"]+)['"]\s*\)/;

export const genericErrorMessageRule: RuleDefinition = {
  id: 'error/generic-error-message',
  version: '1.0.0',
  category: 'error',
  severity: 'info',
  description: 'Detects throw new Error() with generic messages',
  principle: 'Error messages should describe what went wrong for debugging',
  applicable_to: ['is_typescript'],

  async run(file, _config, cwd) {
    if (!file.path.endsWith('.ts')) return [];

    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');
    const findings = [];

    for (let i = 0; i < lines.length; i++) {
      const match = THROW_ERROR_RE.exec(lines[i]!);
      if (!match) continue;

      if (!GENERIC_MESSAGES.has(match[1]!)) continue;

      findings.push(createFinding({
        rule_id: 'error/generic-error-message',
        file: file.path,
        line: i + 1,
        severity: 'info',
        message: `Generic error message "${match[1]}". Use a descriptive message for debugging.`,
        source_principle: 'Error messages should be specific and actionable',
        category: 'error',
        fix_complexity: 'S',
        evidence_trail: [{
          tool: 'regex',
          query: { pattern: 'generic error message', file: file.path },
          result: { line: i + 1, message: match[1] },
          timestamp: new Date().toISOString(),
          cache_hit: false,
        }],
      }));
    }

    return findings;
  },
};
