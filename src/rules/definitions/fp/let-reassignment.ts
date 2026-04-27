import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

export const letReassignmentRule: RuleDefinition = {
  id: 'fp/let-reassignment',
  version: '1.0.0',
  category: 'fp',
  severity: 'info',
  description: 'Detects let variables that are reassigned, suggesting const alternatives',
  principle: 'Prefer const; reassignment signals mutable state that is harder to reason about',
  applicable_to: ['is_typescript'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.ts') || file.path.endsWith('.spec.ts') || file.path.endsWith('.test.ts')) return [];

    const source = await readSource(file.path, cwd);
    const findings = [];
    const lines = source.split('\n');

    const letDeclarations = new Map<string, number>();

    for (let i = 0; i < lines.length; i++) {
      const letMatch = lines[i]!.match(/\blet\s+(\w+)\s*=/);
      if (letMatch) {
        letDeclarations.set(letMatch[1]!, i + 1);
      }
    }

    for (const [name, line] of letDeclarations) {
      const reassignPattern = new RegExp(`\\b${name}\\s*=(?!=)`, 'g');
      let reassignCount = 0;
      for (const l of lines) {
        const matches = l.match(reassignPattern);
        if (matches) reassignCount += matches.length;
      }
      if (reassignCount > 1) {
        findings.push(createFinding({
          rule_id: 'fp/let-reassignment',
          file: file.path,
          line,
          severity: 'info',
          message: `Variable "${name}" declared with let and reassigned. Consider restructuring to use const.`,
          source_principle: 'const communicates intent and prevents accidental mutation',
          category: 'fp',
          fix_complexity: 'L',
          evidence_trail: [{
            tool: 'regex.letReassignment',
            query: { file: file.path },
            result: { line, name, reassignCount },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
      }
    }

    return findings;
  },
};
