import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const BOOL_PREFIXES = /^(is|has|can|should|will|did|was|are|does|needs)/;
const BOOL_ASSIGNMENT = /^\s*(?:private\s+|protected\s+|public\s+|readonly\s+)*(\w+)\s*(?::\s*boolean)?\s*=\s*(true|false)\s*;/;

export const booleanMissingPrefixRule: RuleDefinition = {
  id: 'naming/boolean-missing-prefix',
  version: '1.0.0',
  category: 'naming',
  severity: 'info',
  description: 'Detects boolean properties without is/has/can/should prefix',
  principle: 'Boolean naming with verb prefix makes intent clear at call sites',
  applicable_to: ['is_typescript'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.ts') || file.path.endsWith('.spec.ts') || file.path.endsWith('.test.ts')) return [];

    const source = await readSource(file.path, cwd);
    const findings = [];
    const lines = source.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const match = BOOL_ASSIGNMENT.exec(lines[i]!);
      if (!match) continue;

      const name = match[1]!;
      if (BOOL_PREFIXES.test(name)) continue;
      if (name.startsWith('_')) continue;

      findings.push(createFinding({
        rule_id: 'naming/boolean-missing-prefix',
        file: file.path,
        line: i + 1,
        severity: 'info',
        message: `Boolean "${name}" missing prefix. Use is${name.charAt(0).toUpperCase()}${name.slice(1)}, has${name.charAt(0).toUpperCase()}${name.slice(1)}, etc.`,
        source_principle: 'Boolean verb prefix improves readability',
        category: 'naming',
        fix_complexity: 'L',
        evidence_trail: [{
          tool: 'regex.booleanNaming',
          query: { file: file.path },
          result: { line: i + 1, name },
          timestamp: new Date().toISOString(),
          cache_hit: false,
        }],
      }));
    }

    return findings;
  },
};
