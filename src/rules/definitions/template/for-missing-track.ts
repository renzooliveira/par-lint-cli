import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

export const forMissingTrackRule: RuleDefinition = {
  id: 'template/for-missing-track',
  version: '1.0.0',
  category: 'template',
  severity: 'error',
  description: 'Detects @for without track expression',
  principle: 'track is required for performant DOM reconciliation',
  applicable_to: ['is_template', 'is_html'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.html')) return [];

    const source = await readSource(file.path, cwd);
    const findings = [];
    const lines = source.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (/@for\s*\(/.test(line) && !/track\s/.test(line)) {
        findings.push(createFinding({
          rule_id: 'template/for-missing-track',
          file: file.path,
          line: i + 1,
          severity: 'error',
          message: '@for requires a track expression for efficient DOM updates.',
          source_principle: 'track is required for performant DOM reconciliation',
          category: 'template',
          fix_complexity: 'L',
          evidence_trail: [{
            tool: 'regex.forMissingTrack',
            query: { file: file.path },
            result: { line: i + 1, match: line.trim() },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
      }
    }

    return findings;
  },
};
