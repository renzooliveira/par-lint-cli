import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const CATCH_OPEN_RE = /\bcatch\b.*\{/;
const CONSOLE_ONLY_RE = /^\s*console\.\w+\s*\(/;

export const catchOnlyConsoleRule: RuleDefinition = {
  id: 'error/catch-only-console',
  version: '1.0.0',
  category: 'error',
  severity: 'warning',
  description: 'Detects catch blocks whose only statement is console.error/log',
  principle: 'Logging to console is not error handling — users and monitoring never see it',
  applicable_to: ['is_typescript'],

  async run(file, _config, cwd) {
    if (!file.path.endsWith('.ts')) return [];
    if (/cli[\\/]commands[\\/]/.test(file.path)) return [];

    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');
    const findings = [];

    for (let i = 0; i < lines.length; i++) {
      if (!CATCH_OPEN_RE.test(lines[i]!)) continue;

      const catchLine = i;
      const bodyLines: string[] = [];

      let depth = 1;
      const startJ = i + 1;

      for (let j = startJ; j < lines.length; j++) {
        for (const ch of lines[j]!) {
          if (ch === '{') depth++;
          else if (ch === '}') depth--;
        }
        if (depth > 0) bodyLines.push(lines[j]!);
        if (depth === 0) break;
      }

      const meaningful = bodyLines.filter(l => l.trim().length > 0 && l.trim() !== '}');
      if (meaningful.length === 0) continue;

      const allConsole = meaningful.every(l => CONSOLE_ONLY_RE.test(l));
      if (!allConsole) continue;

      findings.push(createFinding({
        rule_id: 'error/catch-only-console',
        file: file.path,
        line: catchLine + 1,
        severity: 'warning',
        message: 'Catch block only logs to console. Add real error handling (report, retry, rethrow).',
        source_principle: 'Console logging is not error handling',
        category: 'error',
        fix_complexity: 'S',
        suggested_fix: {
          kind: 'replace',
          description: 'Add real error handling: rethrow, return error result, or report to monitoring',
        },
        evidence_trail: [{
          tool: 'regex',
          query: { pattern: 'catch only console', file: file.path },
          result: { line: catchLine + 1 },
          timestamp: new Date().toISOString(),
          cache_hit: false,
        }],
      }));
    }

    return findings;
  },
};
