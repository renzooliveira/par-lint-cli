import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

export const redundantLambdaRule: RuleDefinition = {
  id: 'fp/redundant-lambda',
  version: '1.0.0',
  category: 'fp',
  severity: 'info',
  description: 'Detects (x) => fn(x) that can be simplified to fn',
  principle: 'Redundant wrappers add noise; pass the function reference directly',
  applicable_to: ['is_typescript'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.ts') || file.path.endsWith('.spec.ts') || file.path.endsWith('.test.ts')) return [];

    const source = await readSource(file.path, cwd);
    const findings = [];
    const lines = source.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const match = lines[i]!.match(/\((\w+)\)\s*=>\s*(\w+)\(\1\)/);
      if (match) {
        findings.push(createFinding({
          rule_id: 'fp/redundant-lambda',
          file: file.path,
          line: i + 1,
          severity: 'info',
          message: `Redundant lambda (${match[1]}) => ${match[2]}(${match[1]}). Pass ${match[2]} directly.`,
          source_principle: 'Unnecessary wrappers reduce readability',
          category: 'fp',
          fix_complexity: 'L',
          evidence_trail: [{
            tool: 'regex.redundantLambda',
            query: { file: file.path },
            result: { line: i + 1, fn: match[2] },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
      }
    }

    return findings;
  },
};
