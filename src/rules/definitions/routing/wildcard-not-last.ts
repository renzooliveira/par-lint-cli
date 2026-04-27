import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

export const wildcardNotLastRule: RuleDefinition = {
  id: 'routing/wildcard-not-last',
  version: '1.0.0',
  category: 'routing',
  severity: 'error',
  description: 'Detects wildcard route (**) not as the last route',
  principle: 'Routes after ** are unreachable; wildcard must be last',
  applicable_to: ['is_typescript'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.ts') || !file.path.includes('route')) return [];

    const source = await readSource(file.path, cwd);
    if (!source.includes('**')) return [];

    const findings = [];
    const lines = source.split('\n');
    let wildcardLine = -1;

    for (let i = 0; i < lines.length; i++) {
      if (/path\s*:\s*'\*\*'|path\s*:\s*"\*\*"/.test(lines[i]!)) {
        wildcardLine = i;
      } else if (wildcardLine >= 0 && /path\s*:/.test(lines[i]!)) {
        findings.push(createFinding({
          rule_id: 'routing/wildcard-not-last',
          file: file.path,
          line: wildcardLine + 1,
          severity: 'error',
          message: 'Wildcard route (**) is not last. Routes after it are unreachable.',
          source_principle: 'Wildcard catches all paths; subsequent routes never match',
          category: 'routing',
          fix_complexity: 'L',
          evidence_trail: [{
            tool: 'regex.wildcardNotLast',
            query: { file: file.path },
            result: { wildcardLine: wildcardLine + 1, routeAfter: i + 1 },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
        break;
      }
    }

    return findings;
  },
};
