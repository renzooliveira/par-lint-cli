import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const ION_HEADER_RE = /<ion-header/;
const ION_BACK_BUTTON_RE = /<ion-back-button/;

export const missingIonBackButtonRule: RuleDefinition = {
  id: 'ionic/missing-ion-back-button',
  version: '1.0.0',
  category: 'ionic',
  severity: 'warning',
  description: 'Detects Ionic pages with header but no back button',
  principle: 'Non-root pages need a back button for navigation — users get stuck without one',
  applicable_to: ['is_template'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.html')) return [];
    if (!file.path.includes('.page.') && !file.path.includes('/pages/')) return [];

    const opts = config.rules['ionic/missing-ion-back-button'] as { root_pages?: string[] } | undefined;
    const rootPages = opts?.root_pages ?? ['home', 'tabs', 'login', 'dashboard'];

    const fileName = file.path.split('/').pop() ?? '';
    if (rootPages.some(p => fileName.includes(p))) return [];

    const source = await readSource(file.path, cwd);

    if (!ION_HEADER_RE.test(source)) return [];
    if (ION_BACK_BUTTON_RE.test(source)) return [];

    const lines = source.split('\n');
    let headerLine = 1;
    for (let i = 0; i < lines.length; i++) {
      if (ION_HEADER_RE.test(lines[i]!)) {
        headerLine = i + 1;
        break;
      }
    }

    return [createFinding({
      rule_id: 'ionic/missing-ion-back-button',
      file: file.path,
      line: headerLine,
      severity: 'warning',
      message: `<ion-header> without <ion-back-button>. Non-root pages need a back button for navigation.`,
      source_principle: 'Non-root pages need a back button for navigation',
      category: 'ionic',
      fix_complexity: 'S',
      evidence_trail: [{
        tool: 'regex.missingBackButton',
        query: { file: file.path },
        result: { hasHeader: true, hasBackButton: false },
        timestamp: new Date().toISOString(),
        cache_hit: false,
      }],
    })];
  },
};
