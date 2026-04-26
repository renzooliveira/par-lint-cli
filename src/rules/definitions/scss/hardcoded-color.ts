import type { RuleDefinition } from '../../../engine/runner.js';
import { readScssSource, findHardcodedColors } from '../../../adapters/stylelint.js';
import { createFinding } from '../../../engine/finding.js';

export const hardcodedColorRule: RuleDefinition = {
  id: 'scss/hardcoded-color',
  version: '1.0.0',
  category: 'scss',
  severity: 'warning',
  applicable_to: ['is_scss', 'is_style'],

  async run(file, _config, cwd) {
    if (!file.path.endsWith('.scss')) return [];

    const source = await readScssSource(file.path, cwd);
    const issues = findHardcodedColors(source);

    return issues.map((issue) =>
      createFinding({
        rule_id: 'scss/hardcoded-color',
        file: file.path,
        line: issue.line,
        column: issue.column,
        severity: 'warning',
        message: `Hardcoded color ${issue.value} in property '${issue.property}'. Use design token or variable.`,
        source_principle: 'Hardcoded colors break design system consistency',
        category: 'scss',
        fix_complexity: 'S',
        evidence_trail: [{
          tool: 'stylelint.findHardcodedColors',
          query: { file: file.path },
          result: { line: issue.line, value: issue.value },
          timestamp: new Date().toISOString(),
          cache_hit: false,
        }],
      }),
    );
  },
};
