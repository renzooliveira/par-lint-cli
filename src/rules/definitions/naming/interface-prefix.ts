import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const INTERFACE_WITH_I_PREFIX = /^\s*export\s+interface\s+(I[A-Z][a-zA-Z0-9]*)\b/;

export const interfacePrefixRule: RuleDefinition = {
  id: 'naming/interface-prefix',
  version: '1.0.0',
  category: 'naming',
  severity: 'warning',
  description: 'Detects interfaces with Hungarian "I" prefix',
  principle: 'Interfaces should not use I prefix (Google TS Style Guide)',
  applicable_to: ['is_typescript'],

  async run(file, _config, cwd) {
    if (!file.path.endsWith('.ts')) return [];

    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');
    const findings = [];

    for (let i = 0; i < lines.length; i++) {
      const match = INTERFACE_WITH_I_PREFIX.exec(lines[i]!);
      if (!match) continue;

      const name = match[1]!;
      const suggested = name.slice(1);

      findings.push(createFinding({
        rule_id: 'naming/interface-prefix',
        file: file.path,
        line: i + 1,
        severity: 'warning',
        message: `Interface "${name}" uses I prefix. Rename to "${suggested}".`,
        source_principle: 'No Hungarian notation for interfaces',
        category: 'naming',
        fix_complexity: 'S',
        evidence_trail: [{
          tool: 'regex',
          query: { pattern: 'interface I[A-Z]', file: file.path },
          result: { line: i + 1, name },
          timestamp: new Date().toISOString(),
          cache_hit: false,
        }],
      }));
    }

    return findings;
  },
};
