import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const INTERPOLATION_RE = /\{\{\s*([^}]*\([^)]*\)[^}]*)\s*\}\}/g;
const PIPE_BEFORE_CALL_RE = /\|\s*\w+/;

export const heavyComputationInRenderRule: RuleDefinition = {
  id: 'perf/heavy-computation-in-render',
  version: '1.0.0',
  category: 'perf',
  severity: 'warning',
  applicable_to: ['is_template', 'is_html'],

  async run(file, _config, cwd) {
    if (!file.path.endsWith('.html')) return [];

    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');
    const findings = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      INTERPOLATION_RE.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = INTERPOLATION_RE.exec(line)) !== null) {
        const expr = match[1]!;
        if (PIPE_BEFORE_CALL_RE.test(expr)) continue;

        findings.push(createFinding({
          rule_id: 'perf/heavy-computation-in-render',
          file: file.path,
          line: i + 1,
          column: match.index + 1,
          severity: 'warning',
          message: `Function call in template interpolation: {{ ${expr.trim()} }}. Use a pipe or precomputed value.`,
          source_principle: 'Function calls in templates execute on every change detection cycle',
          category: 'perf',
          fix_complexity: 'M',
          evidence_trail: [{
            tool: 'regex',
            query: { file: file.path },
            result: { line: i + 1, expression: expr.trim() },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
      }
    }

    return findings;
  },
};
