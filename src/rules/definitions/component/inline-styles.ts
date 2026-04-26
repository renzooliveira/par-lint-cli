import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const INLINE_STYLE_RE = /\bstyle\s*=\s*"/g;

export const inlineStylesRule: RuleDefinition = {
  id: 'component/inline-styles',
  version: '1.0.0',
  category: 'component',
  severity: 'warning',
  applicable_to: ['is_template', 'is_html'],

  async run(file, _config, cwd) {
    if (!file.path.endsWith('.html')) return [];

    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');
    const findings = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      INLINE_STYLE_RE.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = INLINE_STYLE_RE.exec(line)) !== null) {
        findings.push(createFinding({
          rule_id: 'component/inline-styles',
          file: file.path,
          line: i + 1,
          column: match.index + 1,
          severity: 'warning',
          message: 'Inline style attribute. Move styles to SCSS file.',
          source_principle: 'Styles belong in SCSS files, not inline attributes',
          category: 'component',
          fix_complexity: 'S',
          evidence_trail: [{
            tool: 'regex',
            query: { pattern: 'style=', file: file.path },
            result: { line: i + 1 },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
      }
    }

    return findings;
  },
};
