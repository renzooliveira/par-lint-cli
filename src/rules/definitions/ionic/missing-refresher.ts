import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const ION_LIST_RE = /<ion-list/;
const ION_REFRESHER_RE = /<ion-refresher/;
const ASYNC_PIPE_RE = /\|\s*async/;

export const missingRefresherRule: RuleDefinition = {
  id: 'ionic/missing-refresher',
  version: '1.0.0',
  category: 'ionic',
  severity: 'info',
  description: 'Detects ion-list fed by API without ion-refresher',
  principle: 'Pull-to-refresh is a mobile UX standard — lists from APIs should support it',
  applicable_to: ['is_template'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.html')) return [];
    if (!file.path.includes('.page.') && !file.path.includes('/pages/')) return [];

    const source = await readSource(file.path, cwd);

    if (!ION_LIST_RE.test(source)) return [];
    if (ION_REFRESHER_RE.test(source)) return [];
    if (!ASYNC_PIPE_RE.test(source) && !/\*ngFor|\@for/.test(source)) return [];

    const lines = source.split('\n');
    let listLine = 1;
    for (let i = 0; i < lines.length; i++) {
      if (ION_LIST_RE.test(lines[i]!)) {
        listLine = i + 1;
        break;
      }
    }

    return [createFinding({
      rule_id: 'ionic/missing-refresher',
      file: file.path,
      line: listLine,
      severity: 'info',
      message: `<ion-list> with data binding but no <ion-refresher>. Add pull-to-refresh for better mobile UX.`,
      source_principle: 'Pull-to-refresh is a mobile UX standard for API-fed lists',
      category: 'ionic',
      fix_complexity: 'S',
      evidence_trail: [{
        tool: 'regex.missingRefresher',
        query: { file: file.path },
        result: { hasList: true, hasRefresher: false },
        timestamp: new Date().toISOString(),
        cache_hit: false,
      }],
    })];
  },
};
