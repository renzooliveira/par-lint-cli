import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

export const typeAssertionWithoutGuardRule: RuleDefinition = {
  id: 'typescript/type-assertion-without-guard',
  version: '1.0.0',
  category: 'typescript',
  severity: 'warning',
  description: 'Detects `as Type` assertions without accompanying type guard',
  principle: 'Type assertions bypass the type system; type guards maintain safety',
  applicable_to: ['is_typescript'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.ts')) return [];

    const source = await readSource(file.path, cwd);

    const hasTypeGuard = /\bis\s+\w+/.test(source) || /instanceof\s+/.test(source) || /typeof\s+\w+\s*===/.test(source);
    if (hasTypeGuard) return [];

    const findings = [];
    const lines = source.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      const stripped = line.replace(/'[^']*'/g, '""').replace(/"[^"]*"/g, '""').replace(/`[^`]*`/g, '""');
      if (/\bas\s+(?!const\b)\w+/.test(stripped) && !/\/\//.test(stripped.split('as')[0]!) &&
          !/\bas\s+.*\|\s*undefined/.test(line) &&
          !/\bas\s+Record</.test(line) &&
          !/config\.rules\[/.test(line) &&
          !/JSON\.parse\(/.test(line) &&
          !/'\w+'\s+as\s+/.test(line) &&
          !/\bas\s+(object|unknown)\b/.test(line) &&
          !/\bas\s+\w+\[/.test(line)) {
        findings.push(createFinding({
          rule_id: 'typescript/type-assertion-without-guard',
          file: file.path,
          line: i + 1,
          severity: 'warning',
          message: 'Type assertion without type guard. Consider adding a type guard or runtime check.',
          source_principle: 'Type assertions bypass the type system; type guards maintain safety',
          category: 'typescript',
          fix_complexity: 'M',
          evidence_trail: [{
            tool: 'regex.typeAssertion',
            query: { file: file.path },
            result: { line: i + 1, match: line.trim() },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
      }
    }

    return findings;
  },
};
