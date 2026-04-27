import type { RuleDefinition } from '../../../engine/runner.js';
import { createFinding } from '../../../engine/finding.js';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const IMG_SRC_RE = /<img\b([^>]*)\bsrc\s*=\s*["']([^"']+)["']([^>]*)>/gi;
const NG_SRC_RE = /\bngSrc\s*=/i;

export const missingNgSrcRule: RuleDefinition = {
  id: 'template/missing-ngSrc',
  version: '1.0.0',
  category: 'template',
  severity: 'info',
  description: 'Detects <img src="..."> when NgOptimizedImage should be used (ngSrc)',
  principle: 'NgOptimizedImage provides automatic lazy-loading, srcset, and priority hints',
  applicable_to: ['is_template', 'is_html'],

  async run(file, _config, cwd) {
    if (!file.path.endsWith('.html')) return [];

    const source = await readFile(path.resolve(cwd, file.path), 'utf-8');
    const lines = source.split('\n');
    const findings = [];

    for (const match of source.matchAll(IMG_SRC_RE)) {
      const beforeAttrs = match[1]!;
      const afterAttrs = match[3]!;
      const allAttrs = beforeAttrs + afterAttrs;

      if (NG_SRC_RE.test(allAttrs)) continue;

      const line = source.substring(0, match.index).split('\n').length;
      findings.push(createFinding({
        rule_id: 'template/missing-ngSrc',
        file: file.path,
        line,
        severity: 'info',
        message: `<img src="..."> should use ngSrc for NgOptimizedImage benefits (lazy-loading, srcset, priority).`,
        source_principle: 'NgOptimizedImage provides automatic optimization',
        category: 'template',
        fix_complexity: 'S',
        evidence_trail: [{
          tool: 'regex',
          query: { pattern: '<img src>', file: file.path },
          result: { lineContent: lines[line - 1] },
          timestamp: new Date().toISOString(),
          cache_hit: false,
        }],
      }));
    }

    return findings;
  },
};
