import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

export const missingIonContentRule: RuleDefinition = {
  id: 'ionic/missing-ion-content',
  version: '1.0.0',
  category: 'ionic',
  severity: 'warning',
  applicable_to: ['is_template'],

  async run(file, _config, cwd) {
    if (!file.path.endsWith('.page.html')) return [];

    const source = await readSource(file.path, cwd);

    if (source.includes('<ion-content')) return [];

    return [createFinding({
      rule_id: 'ionic/missing-ion-content',
      file: file.path,
      line: 1,
      severity: 'warning',
      message: 'Ionic page missing <ion-content>. Pages should wrap content in <ion-content> for proper scrolling and layout.',
      source_principle: 'Ionic pages require ion-content for scroll management and keyboard handling',
      category: 'ionic',
      fix_complexity: 'S',
      evidence_trail: [{
        tool: 'regex',
        query: { file: file.path },
        result: { hasIonContent: false },
        timestamp: new Date().toISOString(),
        cache_hit: false,
      }],
    })];
  },
};
