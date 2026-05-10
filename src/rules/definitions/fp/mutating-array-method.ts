import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const MUTATING_METHODS = ['push', 'pop', 'shift', 'unshift', 'splice', 'fill'];
const PATTERN = new RegExp(`(\\w+)\\.(${MUTATING_METHODS.join('|')})\\s*\\(`, 'g');
const LOCAL_ARRAY_INIT = /(?:const|let)\s+(\w+)(?:\s*:\s*\w+(?:<[^>]*>)?\[\])?\s*=\s*\[\s*\]/;

export const mutatingArrayMethodRule: RuleDefinition = {
  id: 'fp/mutating-array-method',
  version: '1.1.0',
  category: 'fp',
  severity: 'warning',
  description: 'Detects mutating array methods like push/splice/sort',
  principle: 'Immutable operations prevent accidental state mutation',
  applicable_to: ['is_typescript'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.ts') || file.path.endsWith('.spec.ts') || file.path.endsWith('.test.ts')) return [];

    const source = await readSource(file.path, cwd);
    const findings = [];
    const lines = source.split('\n');

    const localArrays = new Set<string>();
    for (const line of lines) {
      const initMatch = LOCAL_ARRAY_INIT.exec(line);
      if (initMatch) localArrays.add(initMatch[1]!);
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      PATTERN.lastIndex = 0;
      let match;
      while ((match = PATTERN.exec(line)) !== null) {
        const varName = match[1]!;
        if (localArrays.has(varName)) continue;

        findings.push(createFinding({
          rule_id: 'fp/mutating-array-method',
          file: file.path,
          line: i + 1,
          severity: 'warning',
          message: `Mutating method .${match[2]}() detected. Prefer immutable alternatives like spread or .toSorted().`,
          source_principle: 'Immutable operations prevent accidental state mutation',
          category: 'fp',
          fix_complexity: 'L',
          suggested_fix: {
            kind: 'replace',
            description: `Use immutable alternative for .${match[2]}() — e.g. spread + new array`,
          },
          evidence_trail: [{
            tool: 'regex.mutatingMethod',
            query: { file: file.path },
            result: { line: i + 1, method: match[2] },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
      }
    }

    return findings;
  },
};
