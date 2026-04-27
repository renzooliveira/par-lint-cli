import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

export const missingIconAccessibilityRule: RuleDefinition = {
  id: 'ionic/missing-icon-accessibility',
  version: '1.0.0',
  category: 'ionic',
  severity: 'warning',
  description: 'Detects ion-icon without aria-label or aria-hidden',
  principle: 'Icons need accessibility attributes for screen readers',
  applicable_to: ['is_template', 'is_html'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.html')) return [];

    const source = await readSource(file.path, cwd);
    if (!source.includes('ion-icon')) return [];

    const findings = [];
    const lines = source.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (/<ion-icon\b/.test(line) && !/aria-label|aria-hidden/.test(line)) {
        findings.push(createFinding({
          rule_id: 'ionic/missing-icon-accessibility',
          file: file.path,
          line: i + 1,
          severity: 'warning',
          message: 'ion-icon without aria-label or aria-hidden. Add accessibility attributes.',
          source_principle: 'Decorative icons need aria-hidden; meaningful icons need aria-label',
          category: 'ionic',
          fix_complexity: 'L',
          evidence_trail: [{
            tool: 'regex.iconA11y',
            query: { file: file.path },
            result: { line: i + 1 },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
      }
    }

    return findings;
  },
};
