import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const LAYOUT_RE = /display\s*:\s*(flex|grid)/;
const MEDIA_QUERY_RE = /@media|@container/;

export const missingBreakpointsRule: RuleDefinition = {
  id: 'responsive/missing-breakpoints',
  version: '1.0.0',
  category: 'responsive',
  severity: 'info',
  description: 'Detects layout styles without responsive breakpoints',
  principle: 'Flex/grid layouts should include media or container queries for responsive behavior',
  applicable_to: ['is_scss', 'is_css'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.scss') && !file.path.endsWith('.css')) return [];
    if (file.path.includes('variables') || file.path.includes('mixins') || file.path.includes('global')) return [];

    const source = await readSource(file.path, cwd);

    if (!LAYOUT_RE.test(source)) return [];
    if (MEDIA_QUERY_RE.test(source)) return [];

    const lines = source.split('\n');
    const findings: ReturnType<typeof createFinding>[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      const match = line.match(LAYOUT_RE);
      if (match) {
        findings.push(createFinding({
          rule_id: 'responsive/missing-breakpoints',
          file: file.path,
          line: i + 1,
          severity: 'info',
          message: `Layout '${match[0]}' without any media/container query in file. Add responsive breakpoints.`,
          source_principle: 'Flex/grid layouts should include responsive breakpoints',
          category: 'responsive',
          fix_complexity: 'M',
          evidence_trail: [{
            tool: 'regex.missingBreakpoints',
            query: { file: file.path },
            result: { line: i + 1, layout: match[0] },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
        break;
      }
    }

    return findings;
  },
};
