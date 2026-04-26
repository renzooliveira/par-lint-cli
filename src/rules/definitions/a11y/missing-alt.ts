import type { RuleDefinition } from '../../../engine/runner.js';
import { readHtmlSource, findMissingAlt } from '../../../adapters/axe-html.js';
import { createFinding } from '../../../engine/finding.js';

export const missingAltRule: RuleDefinition = {
  id: 'a11y/missing-alt',
  version: '1.0.0',
  category: 'a11y',
  severity: 'error',
  description: 'Detects <img> elements without alt attribute',
  principle: 'Informative images must have alternative text for screen readers',
  applicable_to: ['is_html', 'is_template'],

  async run(file, _config, cwd) {
    if (!file.path.endsWith('.html')) return [];

    const source = await readHtmlSource(file.path, cwd);
    const issues = findMissingAlt(source);

    return issues.map((issue) =>
      createFinding({
        rule_id: 'a11y/missing-alt',
        file: file.path,
        line: issue.line,
        column: issue.column,
        severity: 'error',
        message: `${issue.issue}: ${issue.element.slice(0, 60)}`,
        source_principle: 'Images must have alt text for screen readers (WCAG 1.1.1)',
        category: 'a11y',
        fix_complexity: 'S',
        evidence_trail: [{
          tool: 'axe-html.findMissingAlt',
          query: { file: file.path },
          result: { line: issue.line, element: issue.element },
          timestamp: new Date().toISOString(),
          cache_hit: false,
        }],
      }),
    );
  },
};
