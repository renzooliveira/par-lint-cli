import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

export const ngclassInsteadOfClassBindingRule: RuleDefinition = {
  id: 'template/ngclass-instead-of-class-binding',
  version: '1.0.0',
  category: 'template',
  severity: 'info',
  description: 'Detects [ngClass]/[ngStyle] instead of [class.x]/[style.x] bindings',
  principle: 'Direct class/style bindings are simpler and more performant',
  applicable_to: ['is_template', 'is_html'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.html')) return [];

    const source = await readSource(file.path, cwd);
    const findings = [];
    const lines = source.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (/\[ngClass\]/.test(line)) {
        findings.push(createFinding({
          rule_id: 'template/ngclass-instead-of-class-binding',
          file: file.path,
          line: i + 1,
          severity: 'info',
          message: 'Use [class.name] binding instead of [ngClass] for simple cases.',
          source_principle: 'Direct class bindings are simpler and more performant',
          category: 'template',
          fix_complexity: 'L',
          evidence_trail: [{
            tool: 'regex.ngClass',
            query: { file: file.path },
            result: { line: i + 1, match: line.trim() },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
      }
      if (/\[ngStyle\]/.test(line)) {
        findings.push(createFinding({
          rule_id: 'template/ngclass-instead-of-class-binding',
          file: file.path,
          line: i + 1,
          severity: 'info',
          message: 'Use [style.prop] binding instead of [ngStyle] for simple cases.',
          source_principle: 'Direct style bindings are simpler and more performant',
          category: 'template',
          fix_complexity: 'L',
          evidence_trail: [{
            tool: 'regex.ngStyle',
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
