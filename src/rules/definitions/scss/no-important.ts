import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

export const noImportantRule: RuleDefinition = {
  id: 'scss/no-important',
  version: '1.1.0',
  category: 'scss',
  severity: 'warning',
  description: 'Detects !important usage in SCSS',
  principle: '!important breaks CSS specificity cascade and makes maintenance harder',
  applicable_to: ['is_scss', 'is_style'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.scss') && !file.path.endsWith('.css')) return [];

    const source = await readSource(file.path, cwd);
    const findings = [];
    const lines = source.split('\n');
    let shadowDomBlock = false;

    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i]!.trimStart();
      if (/shadow\s*dom/i.test(trimmed) && (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*'))) {
        shadowDomBlock = true;
      }
      if (lines[i]!.includes('}')) shadowDomBlock = false;

      if (/!important/.test(lines[i]!) && !/\/\//.test(lines[i]!.split('!important')[0]!) && !shadowDomBlock) {
        findings.push(createFinding({
          rule_id: 'scss/no-important',
          file: file.path,
          line: i + 1,
          severity: 'warning',
          message: 'Avoid !important. Increase specificity or refactor selectors instead.',
          source_principle: '!important breaks the natural CSS cascade',
          category: 'scss',
          fix_complexity: 'M',
          evidence_trail: [{
            tool: 'regex.important',
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
