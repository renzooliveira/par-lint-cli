import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const DEBUGGER_RE = /^\s*debugger\s*;/;

export const debuggerStatementRule: RuleDefinition = {
  id: 'hygiene/debugger-statement',
  version: '1.0.0',
  category: 'hygiene',
  severity: 'error',
  description: 'Detects debugger statements left in code',
  principle: 'debugger statements must not reach production',
  applicable_to: ['is_typescript'],

  async run(file, _config, cwd) {
    if (!file.path.endsWith('.ts')) return [];

    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');
    const findings = [];

    for (let i = 0; i < lines.length; i++) {
      if (!DEBUGGER_RE.test(lines[i]!)) continue;

      findings.push(createFinding({
        rule_id: 'hygiene/debugger-statement',
        file: file.path,
        line: i + 1,
        severity: 'error',
        message: 'debugger statement. Remove before committing.',
        source_principle: 'No debugger in production code',
        category: 'hygiene',
        fix_complexity: 'S',
        evidence_trail: [{
          tool: 'regex',
          query: { pattern: 'debugger', file: file.path },
          result: { line: i + 1 },
          timestamp: new Date().toISOString(),
          cache_hit: false,
        }],
      }));
    }

    return findings;
  },
};
