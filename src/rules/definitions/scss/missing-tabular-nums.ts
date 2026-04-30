import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const TABLE_CELL_RE = /^\s*(td|th)\s*[{,]/;
const TABULAR_NUMS_RE = /font-variant-numeric\s*:\s*tabular-nums/;
const GLOBAL_TABULAR_RE = /(?:body|html|\*)\s*\{[^}]*font-variant-numeric\s*:\s*tabular-nums/s;

export const missingTabularNumsRule: RuleDefinition = {
  id: 'scss/missing-tabular-nums',
  version: '1.0.0',
  category: 'scss',
  severity: 'info',
  description: 'Detects table cell styles without tabular-nums for numeric alignment',
  principle: 'Tabular numbers ensure consistent column alignment in data tables',
  applicable_to: ['is_scss', 'is_css'],

  async run(file, _config, cwd) {
    if (!file.path.endsWith('.scss') && !file.path.endsWith('.css')) return [];

    const source = await readSource(file.path, cwd);

    if (GLOBAL_TABULAR_RE.test(source)) return [];

    const lines = source.split('\n');
    const findings: ReturnType<typeof createFinding>[] = [];
    let inCellBlock = false;
    let cellLine = 0;
    let cellTag = '';
    let depth = 0;
    let hasTabularNums = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;

      if (!inCellBlock) {
        const match = line.match(TABLE_CELL_RE);
        if (match) {
          inCellBlock = true;
          cellLine = i + 1;
          cellTag = match[1]!;
          depth = 0;
          hasTabularNums = false;
        }
      }

      if (inCellBlock) {
        if (TABULAR_NUMS_RE.test(line)) hasTabularNums = true;

        for (const ch of line) {
          if (ch === '{') depth++;
          if (ch === '}') {
            depth--;
            if (depth <= 0) {
              if (!hasTabularNums) {
                findings.push(createFinding({
                  rule_id: 'scss/missing-tabular-nums',
                  file: file.path,
                  line: cellLine,
                  severity: 'info',
                  message: `<${cellTag}> style block missing font-variant-numeric: tabular-nums for numeric alignment.`,
                  source_principle: 'Tabular numbers ensure consistent column alignment',
                  category: 'scss',
                  fix_complexity: 'S',
                  evidence_trail: [{
                    tool: 'regex.missingTabularNums',
                    query: { file: file.path },
                    result: { element: cellTag, line: cellLine },
                    timestamp: new Date().toISOString(),
                    cache_hit: false,
                  }],
                }));
              }
              inCellBlock = false;
            }
          }
        }
      }
    }

    return findings;
  },
};
