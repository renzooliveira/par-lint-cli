import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const DOM_ACCESS_RE = /\b(document\.(createElement|getElementById|querySelector|querySelectorAll)|\.nativeElement)\b/;
const DOM_MUTATION_RE = /\.(innerHTML|outerHTML|insertAdjacentHTML|appendChild|removeChild|replaceChild|prepend|append)\s*[=(]/;

export const directDomManipulationRule: RuleDefinition = {
  id: 'security/direct-dom-manipulation',
  version: '1.0.0',
  category: 'security',
  severity: 'warning',
  description: 'Detects direct DOM manipulation bypassing framework abstractions',
  principle: 'Use framework APIs (Renderer2, ViewChild) instead of direct DOM access to prevent XSS and maintain testability',
  applicable_to: ['is_typescript'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.ts') || file.path.endsWith('.spec.ts') || file.path.endsWith('.test.ts')) return [];

    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');
    const findings: ReturnType<typeof createFinding>[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (line.trimStart().startsWith('//') || line.trimStart().startsWith('*')) continue;

      const accessMatch = line.match(DOM_ACCESS_RE);
      const mutationMatch = line.match(DOM_MUTATION_RE);

      if (accessMatch || mutationMatch) {
        const matched = accessMatch?.[0] ?? mutationMatch?.[0];
        findings.push(createFinding({
          rule_id: 'security/direct-dom-manipulation',
          file: file.path,
          line: i + 1,
          severity: 'warning',
          message: `Direct DOM manipulation via '${matched}'. Use Renderer2 or framework bindings instead.`,
          source_principle: 'Use framework APIs instead of direct DOM access',
          category: 'security',
          fix_complexity: 'M',
          evidence_trail: [{
            tool: 'regex.domManipulation',
            query: { file: file.path },
            result: { line: i + 1, match: matched },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
      }
    }

    return findings;
  },
};
