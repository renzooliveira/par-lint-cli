import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

export const deprecatedViewchildDecoratorRule: RuleDefinition = {
  id: 'component/deprecated-viewchild-decorator',
  version: '1.0.0',
  category: 'component',
  severity: 'info',
  description: 'Detects @ViewChild decorator instead of viewChild() signal query',
  principle: 'Signal-based queries provide better type safety and reactive integration',
  applicable_to: ['is_component', 'is_typescript'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.ts')) return [];

    const source = await readSource(file.path, cwd);
    const findings = [];
    const lines = source.split('\n');

    for (let i = 0; i < lines.length; i++) {
      if (/@ViewChild\s*\(/.test(lines[i]!) || /@ViewChildren\s*\(/.test(lines[i]!)) {
        const decorator = lines[i]!.includes('@ViewChildren') ? '@ViewChildren' : '@ViewChild';
        const replacement = decorator === '@ViewChildren' ? 'viewChildren()' : 'viewChild()';
        findings.push(createFinding({
          rule_id: 'component/deprecated-viewchild-decorator',
          file: file.path,
          line: i + 1,
          severity: 'info',
          message: `Use ${replacement} signal query instead of ${decorator} decorator.`,
          source_principle: 'Signal queries integrate with the reactive graph',
          category: 'component',
          fix_complexity: 'L',
          evidence_trail: [{
            tool: 'regex.viewChild',
            query: { file: file.path },
            result: { line: i + 1, decorator },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
      }
    }

    return findings;
  },
};
