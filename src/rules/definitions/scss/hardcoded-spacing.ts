import type { RuleDefinition } from '../../../engine/runner.js';
import { readScssSource, findHardcodedSpacing } from '../../../adapters/stylelint.js';
import { createFinding } from '../../../engine/finding.js';

export const hardcodedSpacingRule: RuleDefinition = {
  id: 'scss/hardcoded-spacing',
  version: '1.0.0',
  category: 'scss',
  severity: 'warning',
  applicable_to: ['is_scss', 'is_style'],

  async run(file, _config, cwd) {
    if (!file.path.endsWith('.scss')) return [];

    const source = await readScssSource(file.path, cwd);
    const issues = findHardcodedSpacing(source);

    return issues.map((issue) =>
      createFinding({
        rule_id: 'scss/hardcoded-spacing',
        file: file.path,
        line: issue.line,
        column: issue.column,
        severity: 'warning',
        message: `Hardcoded spacing ${issue.value} in '${issue.property}'. Use spacing variable or token.`,
        source_principle: 'Hardcoded spacing values break design system grid consistency',
        category: 'scss',
        fix_complexity: 'S',
        evidence_trail: [{
          tool: 'stylelint.findHardcodedSpacing',
          query: { file: file.path },
          result: { line: issue.line, value: issue.value, property: issue.property },
          timestamp: new Date().toISOString(),
          cache_hit: false,
        }],
      }),
    );
  },
};
