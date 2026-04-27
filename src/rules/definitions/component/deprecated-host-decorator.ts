import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

export const deprecatedHostDecoratorRule: RuleDefinition = {
  id: 'component/deprecated-host-decorator',
  version: '1.0.0',
  category: 'component',
  severity: 'warning',
  description: 'Detects @HostBinding/@HostListener instead of host metadata',
  principle: 'host metadata in @Component is more declarative and co-located',
  applicable_to: ['is_component', 'is_typescript'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.ts')) return [];

    const source = await readSource(file.path, cwd);
    const findings = [];
    const lines = source.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (/@HostBinding\s*\(/.test(line)) {
        findings.push(createFinding({
          rule_id: 'component/deprecated-host-decorator',
          file: file.path,
          line: i + 1,
          severity: 'warning',
          message: 'Use host metadata in @Component instead of @HostBinding.',
          source_principle: 'host metadata is more declarative and co-located',
          category: 'component',
          fix_complexity: 'L',
          evidence_trail: [{
            tool: 'regex.hostBinding',
            query: { file: file.path },
            result: { line: i + 1, match: line.trim() },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
      }
      if (/@HostListener\s*\(/.test(line)) {
        findings.push(createFinding({
          rule_id: 'component/deprecated-host-decorator',
          file: file.path,
          line: i + 1,
          severity: 'warning',
          message: 'Use host metadata in @Component instead of @HostListener.',
          source_principle: 'host metadata is more declarative and co-located',
          category: 'component',
          fix_complexity: 'L',
          evidence_trail: [{
            tool: 'regex.hostListener',
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
