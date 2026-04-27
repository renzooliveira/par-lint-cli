import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const NON_COMPOSITABLE = /\b(transition|animation)\s*:.*\b(height|width|top|left|right|bottom|margin|padding)\b/;

export const animateNonCompositableRule: RuleDefinition = {
  id: 'perf/animate-non-compositable',
  version: '1.0.0',
  category: 'perf',
  severity: 'info',
  description: 'Detects CSS animations on non-compositable properties (height, width, etc.)',
  principle: 'Animate only transform and opacity for 60fps; other properties trigger layout',
  applicable_to: ['is_scss', 'is_style'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.scss') && !file.path.endsWith('.css')) return [];

    const source = await readSource(file.path, cwd);
    const findings = [];
    const lines = source.split('\n');

    for (let i = 0; i < lines.length; i++) {
      if (NON_COMPOSITABLE.test(lines[i]!)) {
        findings.push(createFinding({
          rule_id: 'perf/animate-non-compositable',
          file: file.path,
          line: i + 1,
          severity: 'info',
          message: 'Animating non-compositable property (triggers layout). Use transform/opacity instead.',
          source_principle: 'Only transform and opacity are GPU-composited for smooth animations',
          category: 'perf',
          fix_complexity: 'M',
          evidence_trail: [{
            tool: 'regex.nonCompositable',
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
