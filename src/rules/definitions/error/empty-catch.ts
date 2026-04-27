import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const CATCH_RE = /\bcatch\b/;

export const emptyCatchRule: RuleDefinition = {
  id: 'error/empty-catch',
  version: '1.0.0',
  category: 'error',
  severity: 'error',
  description: 'Detects catch blocks with empty body',
  principle: 'Empty catch blocks swallow errors silently',
  applicable_to: ['is_typescript'],

  async run(file, _config, cwd) {
    if (!file.path.endsWith('.ts')) return [];

    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');
    const findings = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (!CATCH_RE.test(line)) continue;

      let braceStart = -1;
      for (let j = i; j < Math.min(i + 3, lines.length); j++) {
        const idx = lines[j]!.indexOf('{');
        if (idx !== -1) { braceStart = j; break; }
      }
      if (braceStart === -1) continue;

      const nextLine = lines[braceStart + 1];
      if (!nextLine) continue;

      const trimmed = nextLine.trim();
      if (trimmed === '}' || trimmed === '') {
        const afterNext = lines[braceStart + 2];
        if (trimmed === '' && afterNext && afterNext.trim() !== '}') continue;

        findings.push(createFinding({
          rule_id: 'error/empty-catch',
          file: file.path,
          line: i + 1,
          severity: 'error',
          message: 'Empty catch block swallows errors silently. Handle or rethrow.',
          source_principle: 'Never silently swallow errors',
          category: 'error',
          fix_complexity: 'S',
          evidence_trail: [{
            tool: 'regex',
            query: { pattern: 'empty catch', file: file.path },
            result: { line: i + 1 },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
      }
    }

    return findings;
  },
};
