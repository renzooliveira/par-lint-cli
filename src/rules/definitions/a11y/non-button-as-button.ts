import type { RuleDefinition } from '../../../engine/runner.js';
import { readHtmlSource, findNonButtonAsButton } from '../../../adapters/axe-html.js';
import { createFinding } from '../../../engine/finding.js';

export const nonButtonAsButtonRule: RuleDefinition = {
  id: 'a11y/non-button-as-button',
  version: '1.0.0',
  category: 'a11y',
  severity: 'error',
  description: 'Detects div/span with click handler missing role="button" and keyboard support',
  principle: 'Clickable elements must be <button> or have proper ARIA role and keyboard handling',
  applicable_to: ['is_html', 'is_template'],

  async run(file, _config, cwd) {
    if (!file.path.endsWith('.html')) return [];

    const source = await readHtmlSource(file.path, cwd);
    const issues = findNonButtonAsButton(source);

    return issues.map((issue) =>
      createFinding({
        rule_id: 'a11y/non-button-as-button',
        file: file.path,
        line: issue.line,
        column: issue.column,
        severity: 'error',
        message: `${issue.issue}. Use <button> or add role="button".`,
        source_principle: 'Interactive elements must be semantically correct (WCAG 4.1.2)',
        category: 'a11y',
        fix_complexity: 'S',
        evidence_trail: [{
          tool: 'axe-html.findNonButtonAsButton',
          query: { file: file.path },
          result: { line: issue.line, element: issue.element },
          timestamp: new Date().toISOString(),
          cache_hit: false,
        }],
      }),
    );
  },
};
