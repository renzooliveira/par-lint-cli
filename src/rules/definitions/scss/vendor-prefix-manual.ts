import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

export const vendorPrefixManualRule: RuleDefinition = {
  id: 'scss/vendor-prefix-manual',
  version: '1.0.0',
  category: 'scss',
  severity: 'info',
  description: 'Detects manual vendor prefixes that autoprefixer should handle',
  principle: 'Autoprefixer manages vendor prefixes automatically and keeps them current',
  applicable_to: ['is_scss', 'is_style'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.scss') && !file.path.endsWith('.css')) return [];

    const source = await readSource(file.path, cwd);
    const findings = [];
    const lines = source.split('\n');

    for (let i = 0; i < lines.length; i++) {
      if (/^\s*-(webkit|moz|ms|o)-/.test(lines[i]!)) {
        findings.push(createFinding({
          rule_id: 'scss/vendor-prefix-manual',
          file: file.path,
          line: i + 1,
          severity: 'info',
          message: 'Manual vendor prefix detected. Let autoprefixer handle vendor prefixes.',
          source_principle: 'Autoprefixer keeps prefixes current with browser support data',
          category: 'scss',
          fix_complexity: 'L',
          evidence_trail: [{
            tool: 'regex.vendorPrefix',
            query: { file: file.path },
            result: { line: i + 1, match: lines[i]!.trim() },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
      }
    }

    return findings;
  },
};
