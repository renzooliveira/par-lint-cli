import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

export const exhaustiveSwitchRule: RuleDefinition = {
  id: 'typescript/exhaustive-switch',
  version: '1.0.0',
  category: 'typescript',
  severity: 'warning',
  description: 'Detects switch statements with default that returns a value instead of assertNever',
  principle: 'Exhaustive switches with never-check catch missing cases at compile time',
  applicable_to: ['is_typescript'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.ts') || file.path.endsWith('.spec.ts') || file.path.endsWith('.test.ts')) return [];

    const source = await readSource(file.path, cwd);
    if (!source.includes('switch')) return [];
    if (source.includes('assertNever') || source.includes(': never')) return [];

    const findings = [];
    const lines = source.split('\n');

    for (let i = 0; i < lines.length; i++) {
      if (/^\s*default\s*:/.test(lines[i]!)) {
        const nextLines = lines.slice(i + 1, i + 3).join(' ');
        if (/return\s+['"`]/.test(nextLines) || /return\s+\w+/.test(nextLines)) {
          findings.push(createFinding({
            rule_id: 'typescript/exhaustive-switch',
            file: file.path,
            line: i + 1,
            severity: 'warning',
            message: 'Default case returns a value. Use assertNever() for exhaustive type checking.',
            source_principle: 'Exhaustive switches catch missing union members at compile time',
            category: 'typescript',
            fix_complexity: 'L',
            suggested_fix: {
              kind: 'replace',
              description: 'Replace default return with assertNever(value) for compile-time exhaustiveness',
              diff: '- default: return "unknown";\n+ default: return assertNever(value);',
            },
            evidence_trail: [{
              tool: 'regex.defaultReturn',
              query: { file: file.path },
              result: { line: i + 1 },
              timestamp: new Date().toISOString(),
              cache_hit: false,
            }],
          }));
        }
      }
    }

    return findings;
  },
};
