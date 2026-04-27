import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const FUNC_DECL_RE = /(?:function\s+(\w+)|(?:const|let)\s+(\w+)\s*=\s*(?:async\s+)?(?:\([^)]*\)|(\w+))\s*=>)/;

const COMMON_UTILS: Record<string, string> = {
  formatDate: 'date.util',
  formatCurrency: 'currency.util',
  formatNumber: 'number.util',
  capitalize: 'string.util',
  truncate: 'string.util',
  debounce: 'rxjs debounceTime',
  throttle: 'rxjs throttleTime',
  deepClone: 'structuredClone',
  isEmpty: 'lodash/isEmpty or custom util',
  isNil: 'lodash/isNil or custom util',
  groupBy: 'Object.groupBy or lodash/groupBy',
  uniqBy: 'lodash/uniqBy or Set',
  sortBy: 'Array.toSorted',
  flatten: 'Array.flat',
  chunk: 'lodash/chunk',
};

export const preferExistingUtilityRule: RuleDefinition = {
  id: 'duplication/prefer-existing-utility',
  version: '1.0.0',
  category: 'duplication',
  severity: 'info',
  description: 'Detects local utility functions that likely duplicate existing shared utilities',
  principle: 'Check shared utilities before writing a new one — someone probably already solved it',
  applicable_to: ['is_typescript'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.ts') || file.path.endsWith('.spec.ts') || file.path.endsWith('.test.ts')) return [];
    if (file.path.includes('/utils/') || file.path.includes('/helpers/') || file.path.includes('.util.')) return [];

    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');
    const findings: ReturnType<typeof createFinding>[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      const match = line.match(FUNC_DECL_RE);
      if (!match) continue;

      const name = match[1] ?? match[2];
      if (!name) continue;

      const existing = COMMON_UTILS[name];
      if (existing) {
        findings.push(createFinding({
          rule_id: 'duplication/prefer-existing-utility',
          file: file.path,
          line: i + 1,
          severity: 'info',
          message: `Local function '${name}' likely duplicates existing utility (${existing}). Check shared utils first.`,
          source_principle: 'Check shared utilities before writing a new one',
          category: 'duplication',
          fix_complexity: 'S',
          evidence_trail: [{
            tool: 'regex.preferUtility',
            query: { file: file.path },
            result: { name, suggestion: existing },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
      }
    }

    return findings;
  },
};
