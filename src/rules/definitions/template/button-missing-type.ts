import type { RuleDefinition } from '../../../engine/runner.js';
import { createFinding } from '../../../engine/finding.js';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const BUTTON_RE = /<button\b([^>]*)>/gi;
const TYPE_ATTR_RE = /\btype\s*=/i;

export const buttonMissingTypeRule: RuleDefinition = {
  id: 'template/button-missing-type',
  version: '1.0.0',
  category: 'template',
  severity: 'warning',
  description: 'Detects <button> without type attribute — default is submit which may cause accidental form submission',
  principle: 'Explicit button type prevents accidental form submissions',
  applicable_to: ['is_template', 'is_html'],

  async run(file, _config, cwd) {
    if (!file.path.endsWith('.html')) return [];

    const source = await readFile(path.resolve(cwd, file.path), 'utf-8');
    const lines = source.split('\n');
    const findings = [];

    for (const match of source.matchAll(BUTTON_RE)) {
      const attrs = match[1]!;
      if (!TYPE_ATTR_RE.test(attrs)) {
        const line = source.substring(0, match.index).split('\n').length;
        findings.push(createFinding({
          rule_id: 'template/button-missing-type',
          file: file.path,
          line,
          severity: 'warning',
          message: `<button> without type attribute. Default is "submit" — add type="button" or type="submit" explicitly.`,
          source_principle: 'Explicit button type prevents accidental form submissions',
          category: 'template',
          fix_complexity: 'S',
          evidence_trail: [{
            tool: 'regex',
            query: { pattern: '<button>', file: file.path },
            result: { lineContent: lines[line - 1] },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
      }
    }

    return findings;
  },
};
