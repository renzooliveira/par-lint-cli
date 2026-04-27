import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const ASYNC_CALL_RE = /^\s*(this\.\w+\.\w+|fetch)\s*\([^)]*\)\s*;/;
const HANDLED_RE = /\bawait\b|\.then\s*\(|\.catch\s*\(|\.subscribe\s*\(|=\s*/;

export const swallowedPromiseRule: RuleDefinition = {
  id: 'error/swallowed-promise',
  version: '1.0.0',
  category: 'error',
  severity: 'warning',
  description: 'Detects async function calls without await, .then(), .catch(), or assignment',
  principle: 'Fire-and-forget promises hide errors silently',
  applicable_to: ['is_typescript'],

  async run(file, _config, cwd) {
    if (!file.path.endsWith('.ts')) return [];

    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');
    const findings = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (!ASYNC_CALL_RE.test(line)) continue;
      if (HANDLED_RE.test(line)) continue;

      findings.push(createFinding({
        rule_id: 'error/swallowed-promise',
        file: file.path,
        line: i + 1,
        severity: 'warning',
        message: 'Async call without await/.then()/.catch(). Promise result is silently discarded.',
        source_principle: 'Do not fire-and-forget promises',
        category: 'error',
        fix_complexity: 'S',
        evidence_trail: [{
          tool: 'regex',
          query: { pattern: 'swallowed promise', file: file.path },
          result: { line: i + 1 },
          timestamp: new Date().toISOString(),
          cache_hit: false,
        }],
      }));
    }

    return findings;
  },
};
