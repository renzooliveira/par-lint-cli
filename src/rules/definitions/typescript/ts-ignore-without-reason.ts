import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

export const tsIgnoreWithoutReasonRule: RuleDefinition = {
  id: 'typescript/ts-ignore-without-reason',
  version: '1.0.0',
  category: 'typescript',
  severity: 'warning',
  description: 'Detects @ts-ignore without an explanatory comment',
  principle: 'Type suppressions without reasons become untraceable tech debt',
  applicable_to: ['is_typescript'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.ts')) return [];

    const source = await readSource(file.path, cwd);
    const findings = [];
    const lines = source.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      const match = line.match(/@ts-ignore(?!\s+--?\s*\S)|@ts-expect-error(?!\s+--?\s*\S)/);
      if (match) {
        const afterDirective = line.substring(line.indexOf(match[0]) + match[0].length).trim();
        if (!afterDirective || afterDirective === '*/') {
          findings.push(createFinding({
            rule_id: 'typescript/ts-ignore-without-reason',
            file: file.path,
            line: i + 1,
            severity: 'warning',
            message: `${match[0]} without explanation. Add a reason: ${match[0]} -- reason here`,
            source_principle: 'Type suppressions need documented justification',
            category: 'typescript',
            fix_complexity: 'L',
            suggested_fix: {
              kind: 'replace',
              description: `Add reason: "${match[0]} -- explanation of why this is needed"`,
            },
            evidence_trail: [{
              tool: 'regex.tsIgnore',
              query: { file: file.path },
              result: { line: i + 1 },
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
