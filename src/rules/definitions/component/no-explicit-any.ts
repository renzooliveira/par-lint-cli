import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const ANY_TYPE_RE = /:\s*any\b(?!\w)/g;

export const noExplicitAnyRule: RuleDefinition = {
  id: 'component/no-explicit-any',
  version: '1.0.0',
  category: 'component',
  severity: 'warning',
  description: 'Detects explicit "any" type annotations',
  principle: 'Explicit any bypasses type safety — use specific types or unknown',
  applicable_to: ['is_typescript'],

  async run(file, config, cwd) {
    if (file.path.endsWith('.d.ts')) return [];

    const opts = config.rules['component/no-explicit-any']?.options as {
      allowInTests?: boolean;
    } | undefined;
    if (opts?.allowInTests && /\.(spec|test)\.ts$/.test(file.path)) return [];

    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');
    const findings = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (line.trimStart().startsWith('//') || line.trimStart().startsWith('*')) continue;

      ANY_TYPE_RE.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = ANY_TYPE_RE.exec(line)) !== null) {
        findings.push(createFinding({
          rule_id: 'component/no-explicit-any',
          file: file.path,
          line: i + 1,
          column: match.index + 1,
          severity: 'warning',
          message: `Explicit 'any' type. Use a specific type or 'unknown'.`,
          source_principle: 'Explicit any defeats TypeScript type safety',
          category: 'component',
          fix_complexity: 'S',
          evidence_trail: [{
            tool: 'regex',
            query: { pattern: ':\\s*any\\b', file: file.path },
            result: { line: i + 1, text: line.trim() },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
      }
    }

    return findings;
  },
};
