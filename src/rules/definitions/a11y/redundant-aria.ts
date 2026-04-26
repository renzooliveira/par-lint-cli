import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const REDUNDANT_PAIRS: Array<{ element: string; role: string }> = [
  { element: 'button', role: 'button' },
  { element: 'nav', role: 'navigation' },
  { element: 'main', role: 'main' },
  { element: 'header', role: 'banner' },
  { element: 'footer', role: 'contentinfo' },
  { element: 'aside', role: 'complementary' },
  { element: 'form', role: 'form' },
  { element: 'img', role: 'img' },
  { element: 'h1', role: 'heading' },
  { element: 'h2', role: 'heading' },
  { element: 'h3', role: 'heading' },
  { element: 'ul', role: 'list' },
  { element: 'ol', role: 'list' },
  { element: 'a', role: 'link' },
];

export const redundantAriaRule: RuleDefinition = {
  id: 'a11y/redundant-aria',
  version: '1.0.0',
  category: 'a11y',
  severity: 'warning',
  description: 'Detects ARIA roles that duplicate native element semantics',
  principle: 'ARIA should not duplicate semantics already provided by native HTML elements',
  applicable_to: ['is_template', 'is_html'],

  async run(file, _config, cwd) {
    if (!file.path.endsWith('.html')) return [];

    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');
    const findings = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      for (const pair of REDUNDANT_PAIRS) {
        const re = new RegExp(`<${pair.element}\\b[^>]*\\brole\\s*=\\s*["']${pair.role}["']`, 'i');
        if (re.test(line)) {
          findings.push(createFinding({
            rule_id: 'a11y/redundant-aria',
            file: file.path,
            line: i + 1,
            severity: 'warning',
            message: `Redundant role="${pair.role}" on <${pair.element}>. Native element already has this semantic.`,
            source_principle: 'ARIA should not duplicate native HTML semantics',
            category: 'a11y',
            fix_complexity: 'S',
            evidence_trail: [{
              tool: 'regex',
              query: { file: file.path },
              result: { element: pair.element, role: pair.role },
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
