import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const LIST_RETURN_RE = /(?:getAll|findAll|list|fetch|loadAll)\w*\s*\(/i;
const PAGINATION_RE = /page|pageSize|skip|take|limit|offset|cursor|paginate|Paginated|PageRequest/i;
const OBSERVABLE_ARRAY_RE = /Observable<\w+\[\]>|Promise<\w+\[\]>|Signal<\w+\[\]>/;

export const missingPaginationRule: RuleDefinition = {
  id: 'perf/missing-pagination',
  version: '1.0.0',
  category: 'perf',
  severity: 'warning',
  applicable_to: ['is_service', 'is_typescript'],

  async run(file, _config, cwd) {
    if (!file.path.endsWith('.ts')) return [];

    const source = await readSource(file.path, cwd);
    if (PAGINATION_RE.test(source)) return [];

    const lines = source.split('\n');
    const findings = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (!LIST_RETURN_RE.test(line)) continue;
      if (OBSERVABLE_ARRAY_RE.test(line) || /\w+\[\]/.test(line)) {
        findings.push(createFinding({
          rule_id: 'perf/missing-pagination',
          file: file.path,
          line: i + 1,
          severity: 'warning',
          message: 'Collection endpoint without pagination parameters. Add page/pageSize or cursor-based pagination.',
          source_principle: 'Public endpoints returning collections must support pagination to prevent unbounded responses',
          category: 'perf',
          fix_complexity: 'M',
          evidence_trail: [{
            tool: 'regex',
            query: { file: file.path },
            result: { line: i + 1, method: line.trim() },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
      }
    }

    return findings;
  },
};
