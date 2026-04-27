import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

export const subscribeInServiceRule: RuleDefinition = {
  id: 'rxjs/subscribe-in-service',
  version: '1.0.0',
  category: 'rxjs',
  severity: 'warning',
  description: 'Detects .subscribe() inside @Injectable services',
  principle: 'Services should return Observables, letting consumers manage subscriptions',
  applicable_to: ['is_typescript'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.ts')) return [];

    const source = await readSource(file.path, cwd);
    if (!/@Injectable/.test(source)) return [];

    const findings = [];
    const lines = source.split('\n');

    for (let i = 0; i < lines.length; i++) {
      if (/\.subscribe\s*\(/.test(lines[i]!)) {
        findings.push(createFinding({
          rule_id: 'rxjs/subscribe-in-service',
          file: file.path,
          line: i + 1,
          severity: 'warning',
          message: 'Avoid .subscribe() in services. Return Observable and let consumers manage subscriptions.',
          source_principle: 'Services should be reactive pipelines, not subscription holders',
          category: 'rxjs',
          fix_complexity: 'M',
          evidence_trail: [{
            tool: 'regex.subscribeInService',
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
