import type { RuleDefinition } from '../../../engine/runner.js';
import { readScssSource, findDeepNesting } from '../../../adapters/stylelint.js';
import { createFinding } from '../../../engine/finding.js';

export const deepNestingRule: RuleDefinition = {
  id: 'scss/deep-nesting',
  version: '1.0.0',
  category: 'scss',
  severity: 'warning',
  applicable_to: ['is_scss', 'is_style'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.scss')) return [];

    const maxDepth = (config.rules['scss/deep-nesting']?.options as { maxDepth?: number })?.maxDepth ?? 3;
    const source = await readScssSource(file.path, cwd);
    const issues = findDeepNesting(source, maxDepth);

    return issues.map((issue) =>
      createFinding({
        rule_id: 'scss/deep-nesting',
        file: file.path,
        line: issue.line,
        severity: 'warning',
        message: `SCSS nesting depth ${issue.depth} exceeds max ${maxDepth}: ${issue.selector}`,
        source_principle: 'Deep nesting increases specificity wars and maintenance cost',
        category: 'scss',
        fix_complexity: 'M',
        evidence_trail: [{
          tool: 'stylelint.findDeepNesting',
          query: { file: file.path, maxDepth },
          result: { line: issue.line, depth: issue.depth },
          timestamp: new Date().toISOString(),
          cache_hit: false,
        }],
      }),
    );
  },
};
