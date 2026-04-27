import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

export const deprecatedImportRule: RuleDefinition = {
  id: 'scss/deprecated-import',
  version: '1.0.0',
  category: 'scss',
  severity: 'warning',
  description: 'Detects @import in SCSS instead of @use/@forward',
  principle: 'Sass @import is deprecated; @use/@forward provide proper namespacing',
  applicable_to: ['is_scss', 'is_style'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.scss')) return [];

    const source = await readSource(file.path, cwd);
    const findings = [];
    const lines = source.split('\n');

    for (let i = 0; i < lines.length; i++) {
      if (/^@import\s/.test(lines[i]!.trim())) {
        findings.push(createFinding({
          rule_id: 'scss/deprecated-import',
          file: file.path,
          line: i + 1,
          severity: 'warning',
          message: 'Use @use or @forward instead of deprecated @import.',
          source_principle: '@use/@forward provide namespacing and avoid duplicate loading',
          category: 'scss',
          fix_complexity: 'M',
          evidence_trail: [{
            tool: 'regex.scssImport',
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
