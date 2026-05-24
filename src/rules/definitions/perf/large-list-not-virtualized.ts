import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const FOR_LOOP_RE = /@for\s*\(\s*\w+\s+of\s+(\w+)/;
const NGFOR_RE = /\*ngFor\s*=\s*"let\s+\w+\s+of\s+(\w+)/;
const VIRTUAL_SCROLL_RE = /(?:cdk-virtual-scroll-viewport|ion-virtual-scroll|cdkVirtualFor|virtualItem)/;
const SMALL_LIST_COMMENT_RE = /<!--\s*small-list\s*-->/;
const TEMPLATE_EXT_RE = /\.(?:page|component)\.html$/;

export const largeListNotVirtualizedRule: RuleDefinition = {
  id: 'perf/large-list-not-virtualized',
  version: '1.0.0',
  category: 'perf',
  severity: 'info',
  description: 'Detects list iteration without virtual scrolling in templates',
  principle: 'Large lists should use virtual scrolling to avoid rendering all items',
  applicable_to: ['is_template'],

  async run(file, _config, cwd) {
    if (!TEMPLATE_EXT_RE.test(file.path)) return [];

    const source = await readSource(file.path, cwd);

    if (VIRTUAL_SCROLL_RE.test(source)) return [];
    if (SMALL_LIST_COMMENT_RE.test(source)) return [];

    const lines = source.split('\n');
    const findings: ReturnType<typeof createFinding>[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      const forMatch = line.match(FOR_LOOP_RE) ?? line.match(NGFOR_RE);
      if (!forMatch) continue;

      const collection = forMatch[1]!;

      findings.push(createFinding({
        rule_id: 'perf/large-list-not-virtualized',
        file: file.path,
        line: i + 1,
        severity: 'info',
        message: `Loop over '${collection}' without virtual scrolling. Use cdk-virtual-scroll-viewport for potentially large lists.`,
        source_principle: 'Large lists should use virtual scrolling',
        category: 'perf',
        fix_complexity: 'M',
        evidence_trail: [{
          tool: 'regex.largeListNotVirtualized',
          query: { file: file.path },
          result: { collection, line: i + 1 },
          timestamp: new Date().toISOString(),
          cache_hit: false,
        }],
      }));
    }

    return findings;
  },
};
