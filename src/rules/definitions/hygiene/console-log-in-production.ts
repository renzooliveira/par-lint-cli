import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const CONSOLE_LOG_RE = /\bconsole\.(log|debug|info)\s*\(/;

export const consoleLogInProductionRule: RuleDefinition = {
  id: 'hygiene/console-log-in-production',
  version: '1.0.0',
  category: 'hygiene',
  severity: 'warning',
  description: 'Detects console.log/debug/info in production code',
  principle: 'Console logging in production pollutes output; use proper logging service',
  applicable_to: ['is_typescript'],

  async run(file, _config, cwd) {
    if (!file.path.endsWith('.ts')) return [];
    if (file.path.endsWith('.spec.ts') || file.path.endsWith('.test.ts')) return [];
    if (/\b(cli|commands?|bin)\b/.test(file.path)) return [];

    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');
    const findings = [];

    for (let i = 0; i < lines.length; i++) {
      const match = CONSOLE_LOG_RE.exec(lines[i]!);
      if (!match) continue;

      findings.push(createFinding({
        rule_id: 'hygiene/console-log-in-production',
        file: file.path,
        line: i + 1,
        severity: 'warning',
        message: `console.${match[1]}() in production code. Use a logging service or remove.`,
        source_principle: 'Production code should not use console.log',
        category: 'hygiene',
        fix_complexity: 'S',
        suggested_fix: {
          kind: 'replace',
          description: `Remove console.${match[1]}() or replace with logger service injection`,
        },
        evidence_trail: [{
          tool: 'regex',
          query: { pattern: 'console.log', file: file.path },
          result: { line: i + 1, method: match[1] },
          timestamp: new Date().toISOString(),
          cache_hit: false,
        }],
      }));
    }

    return findings;
  },
};
