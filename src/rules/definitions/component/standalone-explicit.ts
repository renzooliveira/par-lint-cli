import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

export const standaloneExplicitRule: RuleDefinition = {
  id: 'component/standalone-explicit',
  version: '1.0.0',
  category: 'component',
  severity: 'info',
  description: 'Detects standalone: true when it is the default in Angular 19+',
  principle: 'Remove redundant standalone: true since Angular 19 defaults to standalone',
  applicable_to: ['is_component', 'is_typescript'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.ts')) return [];

    const source = await readSource(file.path, cwd);
    if (!/@Component\s*\(/.test(source)) return [];

    const findings = [];
    const lines = source.split('\n');

    for (let i = 0; i < lines.length; i++) {
      if (/standalone\s*:\s*true/.test(lines[i]!)) {
        findings.push(createFinding({
          rule_id: 'component/standalone-explicit',
          file: file.path,
          line: i + 1,
          severity: 'info',
          message: 'standalone: true is the default since Angular 19. Remove the redundant property.',
          source_principle: 'Remove boilerplate that matches framework defaults',
          category: 'component',
          fix_complexity: 'L',
          evidence_trail: [{
            tool: 'regex.standaloneExplicit',
            query: { file: file.path },
            result: { line: i + 1 },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
      }
    }

    return findings;
  },
};
