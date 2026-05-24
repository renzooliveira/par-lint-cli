import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const FLEX_GRID_RE = /display\s*:\s*(flex|grid)/;
const ION_GRID_RE = /ion-grid|ion-row|ion-col/;

export const preferIonGridRule: RuleDefinition = {
  id: 'ionic/prefer-ion-grid',
  version: '1.0.0',
  category: 'ionic',
  severity: 'warning',
  description: 'Detects manual flex/grid layout in Ionic components instead of ion-grid',
  principle: 'Use ion-grid/ion-row/ion-col for column layouts — they handle responsive breakpoints natively',
  applicable_to: ['is_scss', 'is_css'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.scss') && !file.path.endsWith('.css')) return [];
    if (!file.path.includes('page') && !file.path.includes('component')) return [];

    const source = await readSource(file.path, cwd);

    if (ION_GRID_RE.test(source)) return [];

    const lines = source.split('\n');
    const findings: ReturnType<typeof createFinding>[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      const match = line.match(FLEX_GRID_RE);
      if (match) {
        findings.push(createFinding({
          rule_id: 'ionic/prefer-ion-grid',
          file: file.path,
          line: i + 1,
          severity: 'warning',
          message: `Manual '${match[0]}' in Ionic component. Use ion-grid/ion-row/ion-col for responsive layout.`,
          source_principle: 'Use ion-grid for column layouts in Ionic',
          category: 'ionic',
          fix_complexity: 'M',
          evidence_trail: [{
            tool: 'regex.preferIonGrid',
            query: { file: file.path },
            result: { line: i + 1, property: match[0] },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
      }
    }

    return findings;
  },
};
