import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

export const missingPathmatchFullRule: RuleDefinition = {
  id: 'routing/missing-pathMatch-full',
  version: '1.0.0',
  category: 'routing',
  severity: 'error',
  description: 'Detects redirectTo without pathMatch: "full"',
  principle: 'Without pathMatch: "full", empty path redirects match all routes',
  applicable_to: ['is_typescript'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.ts') || !file.path.includes('route')) return [];

    const source = await readSource(file.path, cwd);
    if (!source.includes('redirectTo')) return [];

    const findings = [];
    const lines = source.split('\n');

    for (let i = 0; i < lines.length; i++) {
      if (/redirectTo\s*:/.test(lines[i]!)) {
        const context = lines.slice(Math.max(0, i - 2), i + 3).join(' ');
        if (!/pathMatch/.test(context)) {
          findings.push(createFinding({
            rule_id: 'routing/missing-pathMatch-full',
            file: file.path,
            line: i + 1,
            severity: 'error',
            message: "redirectTo without pathMatch: 'full'. This will match all routes.",
            source_principle: 'Empty-path redirects need pathMatch to avoid catch-all behavior',
            category: 'routing',
            fix_complexity: 'L',
            evidence_trail: [{
              tool: 'regex.redirectNoPathMatch',
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
