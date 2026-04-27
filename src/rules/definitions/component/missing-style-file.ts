import type { RuleDefinition } from '../../../engine/runner.js';
import { createFinding } from '../../../engine/finding.js';
import { access } from 'node:fs/promises';
import path from 'node:path';

export const missingStyleFileRule: RuleDefinition = {
  id: 'component/missing-style-file',
  version: '1.0.0',
  category: 'component',
  severity: 'warning',
  description: 'Detects Angular components with .ts + .html but no .scss in the same directory',
  principle: 'Component trio (ts + html + scss) keeps structure consistent',
  applicable_to: ['is_component'],

  async run(file, _config, cwd) {
    if (!file.path.endsWith('.component.ts')) return [];

    const dir = path.dirname(path.resolve(cwd, file.path));
    const base = path.basename(file.path, '.component.ts');

    const htmlPath = path.join(dir, `${base}.component.html`);
    const scssPath = path.join(dir, `${base}.component.scss`);

    const htmlExists = await access(htmlPath).then(() => true, () => false);
    if (!htmlExists) return [];

    const scssExists = await access(scssPath).then(() => true, () => false);
    if (scssExists) return [];

    return [createFinding({
      rule_id: 'component/missing-style-file',
      file: file.path,
      line: 1,
      severity: 'warning',
      message: `Component "${base}" has .ts + .html but no .scss file. Add ${base}.component.scss.`,
      source_principle: 'Component trio (ts + html + scss) keeps structure consistent',
      category: 'component',
      fix_complexity: 'S',
      evidence_trail: [{
        tool: 'fs',
        query: { check: 'scss-exists', dir },
        result: { htmlExists, scssExists: false },
        timestamp: new Date().toISOString(),
        cache_hit: false,
      }],
    })];
  },
};
