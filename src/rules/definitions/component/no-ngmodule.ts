import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

export const noNgmoduleRule: RuleDefinition = {
  id: 'component/no-ngmodule',
  version: '1.0.0',
  category: 'component',
  severity: 'warning',
  description: 'Detects @NgModule usage instead of standalone components',
  principle: 'Standalone components are simpler and enable better tree-shaking',
  applicable_to: ['is_typescript'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.ts')) return [];

    const source = await readSource(file.path, cwd);
    const findings = [];
    const lines = source.split('\n');

    for (let i = 0; i < lines.length; i++) {
      if (/@NgModule\s*\(/.test(lines[i]!)) {
        findings.push(createFinding({
          rule_id: 'component/no-ngmodule',
          file: file.path,
          line: i + 1,
          severity: 'warning',
          message: 'Migrate @NgModule to standalone components for simpler architecture.',
          source_principle: 'Standalone components reduce boilerplate and improve tree-shaking',
          category: 'component',
          fix_complexity: 'XL',
          evidence_trail: [{
            tool: 'regex.ngModule',
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
