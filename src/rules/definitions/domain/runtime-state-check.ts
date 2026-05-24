import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const DOMAIN_PATH_RE = /(?:domain|entities|models|services|usecases|use-cases)\//;
const DISCRIMINANT_CHECK_RE = /if\s*\(\s*(\w+)\.(status|state|kind|type|phase|stage|mode|role)\s*!==?\s*['"`](\w+)['"`]\s*\)/;
const THROW_OR_RETURN_RE = /^\s*(?:throw\s|return\b)/;

export const runtimeStateCheckRule: RuleDefinition = {
  id: 'domain/runtime-state-check',
  version: '1.0.0',
  category: 'domain',
  severity: 'warning',
  description: 'Detects runtime discriminant checks that could be enforced at compile time with narrower types',
  principle: 'Invalid state transitions should be compile-time errors, not runtime checks',
  applicable_to: ['is_typescript'],

  async run(file, _config, cwd) {
    if (!file.path.endsWith('.ts') || file.path.endsWith('.spec.ts') || file.path.endsWith('.test.ts')) return [];
    if (!DOMAIN_PATH_RE.test(file.path)) return [];

    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');
    const findings: ReturnType<typeof createFinding>[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      const match = line.match(DISCRIMINANT_CHECK_RE);
      if (!match) continue;

      const restOfLine = line.slice(line.indexOf(')') + 1).trim();
      const nextLine = (lines[i + 1] ?? '').trim();
      const lineAfter = (lines[i + 2] ?? '').trim();
      const hasGuard = THROW_OR_RETURN_RE.test(restOfLine)
        || THROW_OR_RETURN_RE.test(nextLine)
        || THROW_OR_RETURN_RE.test(lineAfter);
      if (!hasGuard) continue;

      const obj = match[1]!;
      const prop = match[2]!;
      const value = match[3]!;

      findings.push(createFinding({
        rule_id: 'domain/runtime-state-check',
        file: file.path,
        line: i + 1,
        severity: 'warning',
        message: `Runtime check on '${obj}.${prop} !== "${value}"' could be a compile-time constraint with a narrower type parameter.`,
        source_principle: 'Invalid state transitions should be compile-time errors',
        category: 'domain',
        fix_complexity: 'M',
        evidence_trail: [{
          tool: 'regex.runtimeStateCheck',
          query: { file: file.path },
          result: { object: obj, property: prop, value, line: i + 1 },
          timestamp: new Date().toISOString(),
          cache_hit: false,
        }],
      }));
    }

    return findings;
  },
};
