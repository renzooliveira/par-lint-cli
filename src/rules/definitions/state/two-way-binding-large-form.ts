import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const NGMODEL_REGEX = /\[\(ngModel\)\]/g;
const DEFAULT_THRESHOLD = 3;

export const twoWayBindingLargeFormRule: RuleDefinition = {
  id: 'state/two-way-binding-on-large-form',
  version: '1.0.0',
  category: 'state',
  severity: 'warning',
  applicable_to: ['is_template', 'is_html'],

  async run(file, config, cwd) {
    const source = await readSource(file.path, cwd);
    const ruleConfig = config.rules['state/two-way-binding-on-large-form'];
    const threshold = (ruleConfig?.['threshold'] as number | undefined) ?? DEFAULT_THRESHOLD;

    const lines = source.split('\n');
    const matchLines: number[] = [];

    for (let i = 0; i < lines.length; i++) {
      if (NGMODEL_REGEX.test(lines[i]!)) {
        matchLines.push(i + 1);
      }
      NGMODEL_REGEX.lastIndex = 0;
    }

    if (matchLines.length <= threshold) return [];

    return [createFinding({
      rule_id: 'state/two-way-binding-on-large-form',
      file: file.path,
      line: matchLines[0]!,
      severity: 'warning',
      message: `Form with ${matchLines.length} [(ngModel)] bindings (threshold: ${threshold}). Use Reactive Forms for complex forms.`,
      source_principle: 'Large forms use Reactive Forms, not ngModel',
      category: 'state',
      fix_complexity: 'L',
      evidence_trail: [{
        tool: 'T7.find_pattern',
        query: { pattern: '[(ngModel)]', file: file.path, threshold },
        result: { count: matchLines.length, lines: matchLines },
        timestamp: new Date().toISOString(),
        cache_hit: false,
      }],
    })];
  },
};
