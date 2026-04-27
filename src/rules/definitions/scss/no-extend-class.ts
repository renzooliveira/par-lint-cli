import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

export const noExtendClassRule: RuleDefinition = {
  id: 'scss/no-extend-class',
  version: '1.0.0',
  category: 'scss',
  severity: 'info',
  description: 'Detects @extend .class instead of @extend %placeholder',
  principle: 'Extending classes bloats output; placeholders produce cleaner CSS',
  applicable_to: ['is_scss', 'is_style'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.scss')) return [];

    const source = await readSource(file.path, cwd);
    const findings = [];
    const lines = source.split('\n');

    for (let i = 0; i < lines.length; i++) {
      if (/@extend\s+\./.test(lines[i]!)) {
        findings.push(createFinding({
          rule_id: 'scss/no-extend-class',
          file: file.path,
          line: i + 1,
          severity: 'info',
          message: 'Use @extend %placeholder instead of @extend .class to avoid output bloat.',
          source_principle: 'Placeholder selectors only emit CSS when extended',
          category: 'scss',
          fix_complexity: 'L',
          evidence_trail: [{
            tool: 'regex.extendClass',
            query: { file: file.path },
            result: { line: i + 1, match: lines[i]!.trim() },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
      }
    }

    return findings;
  },
};
