import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const SUBSCRIBE_RE = /\.subscribe\s*\(/g;
const CATCH_ERROR_RE = /catchError/;

export const missingErrorHandlerRule: RuleDefinition = {
  id: 'rxjs/missing-error-handler',
  version: '1.0.0',
  category: 'rxjs',
  severity: 'warning',
  description: 'Detects .subscribe() without error handling or upstream catchError',
  principle: 'Unhandled observable errors go to global handler silently',
  applicable_to: ['is_typescript'],

  async run(file, _config, cwd) {
    if (!file.path.endsWith('.ts')) return [];

    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');
    const findings = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (!SUBSCRIBE_RE.test(line)) continue;
      SUBSCRIBE_RE.lastIndex = 0;

      const contextStart = Math.max(0, i - 10);
      const context = lines.slice(contextStart, i + 1).join('\n');

      if (CATCH_ERROR_RE.test(context)) continue;

      const afterSubscribe = line.substring(line.indexOf('.subscribe'));
      const hasMultipleArgs = /\.subscribe\s*\(\s*\{/.test(afterSubscribe) ||
        /\.subscribe\s*\([^,]+,\s*\S/.test(afterSubscribe);
      if (hasMultipleArgs) continue;

      findings.push(createFinding({
        rule_id: 'rxjs/missing-error-handler',
        file: file.path,
        line: i + 1,
        severity: 'warning',
        message: '.subscribe() without error handler or catchError upstream. Errors will be unhandled.',
        source_principle: 'Observable errors need explicit handling',
        category: 'rxjs',
        fix_complexity: 'S',
        evidence_trail: [{
          tool: 'regex',
          query: { pattern: 'subscribe without error handler', file: file.path },
          result: { line: i + 1 },
          timestamp: new Date().toISOString(),
          cache_hit: false,
        }],
      }));
    }

    return findings;
  },
};
