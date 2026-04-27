import type { RuleDefinition } from '../../../engine/runner.js';
import { createFinding } from '../../../engine/finding.js';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const ION_COL_RE = /<ion-col\b([^>]*)>/gi;
const SIZE_ATTR_RE = /\bsize\s*=\s*["'](\d+)["']/i;
const RESPONSIVE_SIZE_RE = /\bsize-(sm|md|lg|xl)\s*=/i;

export const ionicGridWithoutResponsiveSizesRule: RuleDefinition = {
  id: 'responsive/ionic-grid-without-responsive-sizes',
  version: '1.0.0',
  category: 'responsive',
  severity: 'warning',
  description: 'Detects <ion-col size="N"> without responsive size variants (size-sm, size-md, size-lg)',
  principle: 'Fixed grid columns without responsive breakpoints create rigid layouts across screen sizes',
  applicable_to: ['is_template', 'is_html'],

  async run(file, _config, cwd) {
    if (!file.path.endsWith('.html')) return [];

    const source = await readFile(path.resolve(cwd, file.path), 'utf-8');
    const lines = source.split('\n');
    const findings = [];

    for (const match of source.matchAll(ION_COL_RE)) {
      const attrs = match[1]!;

      if (!SIZE_ATTR_RE.test(attrs)) continue;
      if (RESPONSIVE_SIZE_RE.test(attrs)) continue;

      const line = source.substring(0, match.index).split('\n').length;
      findings.push(createFinding({
        rule_id: 'responsive/ionic-grid-without-responsive-sizes',
        file: file.path,
        line,
        severity: 'warning',
        message: `<ion-col size="..."> without responsive variants (size-sm, size-md, size-lg). Layout is fixed across all screens.`,
        source_principle: 'Fixed grid columns create rigid layouts',
        category: 'responsive',
        fix_complexity: 'S',
        evidence_trail: [{
          tool: 'regex',
          query: { pattern: 'ion-col size', file: file.path },
          result: { lineContent: lines[line - 1] },
          timestamp: new Date().toISOString(),
          cache_hit: false,
        }],
      }));
    }

    return findings;
  },
};
