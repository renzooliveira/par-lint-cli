import type { RuleDefinition } from '../../../engine/runner.js';
import { createFinding } from '../../../engine/finding.js';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const IMG_RE = /<img\b([^>]*)>/gi;
const WIDTH_RE = /\bwidth\s*=/i;
const HEIGHT_RE = /\bheight\s*=/i;

export const imgMissingDimensionsRule: RuleDefinition = {
  id: 'template/img-missing-dimensions',
  version: '1.0.0',
  category: 'template',
  severity: 'warning',
  description: 'Detects <img> without width and height attributes — causes layout shift (CLS)',
  principle: 'Explicit image dimensions prevent Cumulative Layout Shift',
  applicable_to: ['is_template', 'is_html'],

  async run(file, _config, cwd) {
    if (!file.path.endsWith('.html')) return [];

    const source = await readFile(path.resolve(cwd, file.path), 'utf-8');
    const lines = source.split('\n');
    const findings = [];

    for (const match of source.matchAll(IMG_RE)) {
      const attrs = match[1]!;
      const hasWidth = WIDTH_RE.test(attrs);
      const hasHeight = HEIGHT_RE.test(attrs);

      if (!hasWidth || !hasHeight) {
        const missing = !hasWidth && !hasHeight ? 'width and height' : !hasWidth ? 'width' : 'height';
        const line = source.substring(0, match.index).split('\n').length;
        findings.push(createFinding({
          rule_id: 'template/img-missing-dimensions',
          file: file.path,
          line,
          severity: 'warning',
          message: `<img> missing ${missing} attribute(s). Add both to prevent layout shift.`,
          source_principle: 'Explicit image dimensions prevent CLS',
          category: 'template',
          fix_complexity: 'S',
          evidence_trail: [{
            tool: 'regex',
            query: { pattern: '<img>', file: file.path },
            result: { hasWidth, hasHeight, lineContent: lines[line - 1] },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
      }
    }

    return findings;
  },
};
