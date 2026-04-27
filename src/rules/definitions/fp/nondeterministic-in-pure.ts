import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

export const nondeterministicInPureRule: RuleDefinition = {
  id: 'fp/nondeterministic-in-pure',
  version: '1.0.0',
  category: 'fp',
  severity: 'warning',
  description: 'Detects Date.now()/Math.random() in exported functions',
  principle: 'Nondeterministic calls make functions hard to test; inject them as dependencies',
  applicable_to: ['is_typescript'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.ts') || file.path.endsWith('.spec.ts') || file.path.endsWith('.test.ts')) return [];

    const source = await readSource(file.path, cwd);
    const findings = [];
    const lines = source.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (/Math\.random\s*\(/.test(line) || /Date\.now\s*\(/.test(line)) {
        if (/^\s*\/\//.test(line)) continue;

        const fnLine = lines.slice(Math.max(0, i - 10), i).reverse().find(l => /export\s+function\s+/.test(l));
        if (!fnLine) continue;

        const nondeterministic = /Math\.random/.test(line) ? 'Math.random()' : 'Date.now()';
        findings.push(createFinding({
          rule_id: 'fp/nondeterministic-in-pure',
          file: file.path,
          line: i + 1,
          severity: 'warning',
          message: `${nondeterministic} in exported function. Inject as parameter for testability.`,
          source_principle: 'Pure functions are deterministic and easy to test',
          category: 'fp',
          fix_complexity: 'M',
          evidence_trail: [{
            tool: 'regex.nondeterministic',
            query: { file: file.path },
            result: { line: i + 1, call: nondeterministic },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
      }
    }

    return findings;
  },
};
