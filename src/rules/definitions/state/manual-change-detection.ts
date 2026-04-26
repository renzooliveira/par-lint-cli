import type { RuleDefinition } from '../../../engine/runner.js';
import { findPattern } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

export const manualChangeDetectionRule: RuleDefinition = {
  id: 'state/manual-change-detection',
  version: '1.0.0',
  category: 'state',
  severity: 'warning',
  applicable_to: ['is_component', 'is_typescript'],

  async run(file, _config, cwd) {
    const patterns = [
      '$CDR.detectChanges()',
      '$CDR.markForCheck()',
    ];

    const findings = [];

    for (const pattern of patterns) {
      const matches = await findPattern(file.path, pattern, cwd);

      for (const match of matches) {
        findings.push(createFinding({
          rule_id: 'state/manual-change-detection',
          file: file.path,
          line: match.line,
          column: match.column,
          end_line: match.endLine,
          end_column: match.endColumn,
          severity: 'warning',
          message: `Manual change detection: ${match.text.trim()}. Indicates broken state model — prefer signals/computed.`,
          source_principle: 'Manual change detection indicates broken state model',
          category: 'state',
          fix_complexity: 'M',
          evidence_trail: [{
            tool: 'T7.find_pattern',
            query: { pattern, file: file.path },
            result: { line: match.line, text: match.text },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
      }
    }

    return findings;
  },
};
