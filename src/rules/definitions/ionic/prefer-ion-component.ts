import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const REPLACEMENTS: Record<string, string> = {
  '<select': 'ion-select',
  '<textarea': 'ion-textarea',
  '<input type="range"': 'ion-range',
};

const PATTERNS = Object.keys(REPLACEMENTS).map(k => ({
  regex: new RegExp(k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
  native: k.replace('<', ''),
  ionic: REPLACEMENTS[k]!,
}));

export const preferIonComponentRule: RuleDefinition = {
  id: 'ionic/prefer-ion-component',
  version: '1.0.0',
  category: 'ionic',
  severity: 'warning',
  description: 'Detects native HTML elements that should use Ionic equivalents',
  principle: 'Ionic components provide consistent cross-platform styling and behavior',
  applicable_to: ['is_template', 'is_html'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.html')) return [];

    const source = await readSource(file.path, cwd);
    if (!source.includes('ion-')) return [];

    const findings = [];
    const lines = source.split('\n');

    for (let i = 0; i < lines.length; i++) {
      for (const p of PATTERNS) {
        p.regex.lastIndex = 0;
        if (p.regex.test(lines[i]!)) {
          findings.push(createFinding({
            rule_id: 'ionic/prefer-ion-component',
            file: file.path,
            line: i + 1,
            severity: 'warning',
            message: `Use <${p.ionic}> instead of native <${p.native}> in Ionic template.`,
            source_principle: 'Ionic components provide consistent cross-platform styling',
            category: 'ionic',
            fix_complexity: 'L',
            evidence_trail: [{
              tool: 'regex.nativeElement',
              query: { file: file.path },
              result: { line: i + 1, native: p.native, ionic: p.ionic },
              timestamp: new Date().toISOString(),
              cache_hit: false,
            }],
          }));
        }
      }
    }

    return findings;
  },
};
