import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

export const enumInsteadOfConstRule: RuleDefinition = {
  id: 'fp/enum-instead-of-const',
  version: '1.0.0',
  category: 'fp',
  severity: 'info',
  description: 'Detects enum usage instead of as const object',
  principle: 'as const objects are more type-safe and tree-shakeable than enums',
  applicable_to: ['is_typescript'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.ts') || file.path.endsWith('.spec.ts') || file.path.endsWith('.test.ts')) return [];

    const source = await readSource(file.path, cwd);
    const findings = [];
    const lines = source.split('\n');

    for (let i = 0; i < lines.length; i++) {
      if (/^\s*export\s+enum\s+\w+|^\s*enum\s+\w+/.test(lines[i]!)) {
        const name = lines[i]!.match(/enum\s+(\w+)/)?.[1];
        findings.push(createFinding({
          rule_id: 'fp/enum-instead-of-const',
          file: file.path,
          line: i + 1,
          severity: 'info',
          message: `Enum "${name}" could be replaced with "as const" object for better tree-shaking.`,
          source_principle: 'as const objects produce no runtime code and are fully type-safe',
          category: 'fp',
          fix_complexity: 'L',
          evidence_trail: [{
            tool: 'regex.enum',
            query: { file: file.path },
            result: { line: i + 1, name },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
      }
    }

    return findings;
  },
};
