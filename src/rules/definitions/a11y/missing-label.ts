import type { RuleDefinition } from '../../../engine/runner.js';
import { readHtmlSource, findMissingLabel } from '../../../adapters/axe-html.js';
import { createFinding } from '../../../engine/finding.js';

export const missingLabelRule: RuleDefinition = {
  id: 'a11y/missing-label',
  version: '1.0.0',
  category: 'a11y',
  severity: 'error',
  applicable_to: ['is_html', 'is_template'],

  async run(file, _config, cwd) {
    if (!file.path.endsWith('.html')) return [];

    const source = await readHtmlSource(file.path, cwd);
    const issues = findMissingLabel(source);

    return issues.map((issue) =>
      createFinding({
        rule_id: 'a11y/missing-label',
        file: file.path,
        line: issue.line,
        column: issue.column,
        severity: 'error',
        message: `${issue.issue}: ${issue.element.slice(0, 60)}`,
        source_principle: 'Form controls must have accessible labels (WCAG 1.3.1)',
        category: 'a11y',
        fix_complexity: 'S',
        evidence_trail: [{
          tool: 'axe-html.findMissingLabel',
          query: { file: file.path },
          result: { line: issue.line, element: issue.element },
          timestamp: new Date().toISOString(),
          cache_hit: false,
        }],
      }),
    );
  },
};
