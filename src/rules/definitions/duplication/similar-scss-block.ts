import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const SELECTOR_RE = /^([.#\w&:[\]=-]+(?:\s*[,>+~]\s*[.#\w&:[\]=-]+)*)\s*\{/;
const PROP_RE = /^\s*([\w-]+)\s*:\s*(.+?)\s*;?\s*$/;

export const similarScssBlockRule: RuleDefinition = {
  id: 'duplication/similar-scss-block',
  version: '1.0.0',
  category: 'duplication',
  severity: 'info',
  description: 'Detects SCSS blocks with identical properties and values in the same file',
  principle: 'Duplicate style blocks should use a mixin, placeholder, or utility class',
  applicable_to: ['is_scss', 'is_css'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.scss') && !file.path.endsWith('.css')) return [];

    const opts = config.rules['duplication/similar-scss-block'] as { min_props?: number } | undefined;
    const minProps = opts?.min_props ?? 3;

    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');

    const blocks: { selector: string; props: string; line: number }[] = [];
    let currentSelector = '';
    let currentLine = 0;
    let currentProps: string[] = [];
    let depth = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;

      const selMatch = line.match(SELECTOR_RE);
      if (selMatch && depth === 0) {
        currentSelector = selMatch[1]!.trim();
        currentLine = i + 1;
        currentProps = [];
      }

      for (const ch of line) {
        if (ch === '{') depth++;
        if (ch === '}') {
          depth--;
          if (depth === 0 && currentSelector && currentProps.length >= minProps) {
            blocks.push({
              selector: currentSelector,
              props: currentProps.sort().join('|'),
              line: currentLine,
            });
            currentSelector = '';
          }
        }
      }

      if (depth === 1) {
        const propMatch = line.match(PROP_RE);
        if (propMatch) {
          currentProps.push(`${propMatch[1]}:${propMatch[2]}`);
        }
      }
    }

    const propMap = new Map<string, { selectors: string[]; lines: number[] }>();
    for (const block of blocks) {
      const entry = propMap.get(block.props) ?? { selectors: [], lines: [] };
      entry.selectors.push(block.selector);
      entry.lines.push(block.line);
      propMap.set(block.props, entry);
    }

    const findings: ReturnType<typeof createFinding>[] = [];
    for (const [, data] of propMap) {
      if (data.selectors.length < 2) continue;
      findings.push(createFinding({
        rule_id: 'duplication/similar-scss-block',
        file: file.path,
        line: data.lines[0]!,
        severity: 'info',
        message: `Selectors ${data.selectors.join(', ')} have identical properties. Extract to a mixin or placeholder.`,
        source_principle: 'Duplicate style blocks should use a mixin or utility class',
        category: 'duplication',
        fix_complexity: 'S',
        evidence_trail: [{
          tool: 'regex.similarScss',
          query: { file: file.path },
          result: { selectors: data.selectors },
          timestamp: new Date().toISOString(),
          cache_hit: false,
        }],
      }));
    }

    return findings;
  },
};
