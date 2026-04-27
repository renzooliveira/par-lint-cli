import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

export const lawOfDemeterRule: RuleDefinition = {
  id: 'domain/law-of-demeter',
  version: '1.0.0',
  category: 'domain',
  severity: 'info',
  description: 'Detects deep property chain access (3+ dots) violating Law of Demeter',
  principle: 'Objects should only talk to immediate friends, not strangers',
  applicable_to: ['is_typescript'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.ts') || file.path.endsWith('.spec.ts') || file.path.endsWith('.test.ts')) return [];

    const source = await readSource(file.path, cwd);
    const findings = [];
    const lines = source.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (/^\s*(\/\/|\/\*|\*)/.test(line)) continue;
      if (/import\s/.test(line)) continue;

      const chains = line.match(/\b\w+(?:\.\w+){3,}/g);
      if (!chains) continue;

      for (const chain of chains) {
        if (/^(this|self|console|Math|Object|Array|JSON|Number|String|Date|Promise|process|module|exports|window|document|navigator)\b/.test(chain)) continue;
        if (/\.(pipe|subscribe|then|catch|finally)\b/.test(chain)) continue;

        findings.push(createFinding({
          rule_id: 'domain/law-of-demeter',
          file: file.path,
          line: i + 1,
          severity: 'info',
          message: `Deep chain "${chain}" violates Law of Demeter. Extract intermediate variable or delegate to object.`,
          source_principle: 'Objects should only talk to immediate friends',
          category: 'domain',
          fix_complexity: 'M',
          evidence_trail: [{
            tool: 'regex.deepChain',
            query: { file: file.path },
            result: { line: i + 1, chain },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
      }
    }

    return findings;
  },
};
