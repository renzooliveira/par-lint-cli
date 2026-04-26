import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const NGFOR_RE = /\*ngFor\s*=\s*"([^"]*)"/g;

export const missingTrackByRule: RuleDefinition = {
  id: 'component/missing-trackby',
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
      NGFOR_RE.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = NGFOR_RE.exec(line)) !== null) {
        const expr = match[1]!;
        if (!expr.includes('trackBy')) {
          findings.push(createFinding({
            rule_id: 'component/missing-trackby',
            file: file.path,
            line: i + 1,
            column: match.index + 1,
            severity: 'warning',
            message: '*ngFor without trackBy function. Add trackBy for better rendering performance.',
            source_principle: 'trackBy prevents unnecessary DOM re-creation on list changes',
            category: 'component',
            fix_complexity: 'S',
            evidence_trail: [{
              tool: 'regex',
              query: { pattern: '*ngFor', file: file.path },
              result: { line: i + 1, expression: expr },
              timestamp: new Date().toISOString(),
              cache_hit: false,
            }],
          }));
        }
      }
    }

    return findings;
  },
};
