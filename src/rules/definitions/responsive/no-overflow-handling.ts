import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const NOWRAP_RE = /white-space\s*:\s*nowrap/;
const OVERFLOW_RE = /overflow\s*:\s*(hidden|auto|scroll)/;

export const noOverflowHandlingRule: RuleDefinition = {
  id: 'responsive/no-overflow-handling',
  version: '1.0.0',
  category: 'responsive',
  severity: 'warning',
  description: 'Detects white-space: nowrap without overflow handling',
  principle: 'Nowrap text without overflow handling overflows on small screens',
  applicable_to: ['is_scss', 'is_style'],

  async run(file, _config, cwd) {
    if (!file.path.endsWith('.scss')) return [];

    const source = await readSource(file.path, cwd);
    const findings = [];

    const blocks = parseBlocks(source);
    for (const block of blocks) {
      if (!NOWRAP_RE.test(block.content)) continue;
      if (OVERFLOW_RE.test(block.content)) continue;

      const nowrapLine = block.startLine + block.content.substring(0, block.content.search(NOWRAP_RE)).split('\n').length - 1;

      findings.push(createFinding({
        rule_id: 'responsive/no-overflow-handling',
        file: file.path,
        line: nowrapLine,
        severity: 'warning',
        message: 'white-space: nowrap without overflow: hidden and text-overflow: ellipsis. Text may overflow on small screens.',
        source_principle: 'Nowrap text needs overflow handling',
        category: 'responsive',
        fix_complexity: 'S',
        evidence_trail: [{
          tool: 'regex',
          query: { pattern: 'nowrap without overflow', file: file.path },
          result: { line: nowrapLine },
          timestamp: new Date().toISOString(),
          cache_hit: false,
        }],
      }));
    }

    return findings;
  },
};

function parseBlocks(source: string): { content: string; startLine: number }[] {
  const blocks: { content: string; startLine: number }[] = [];
  let depth = 0;
  let blockStart = -1;
  let blockStartLine = 0;
  let currentLine = 1;

  for (let i = 0; i < source.length; i++) {
    if (source[i] === '\n') currentLine++;
    if (source[i] === '{') {
      if (depth === 0) {
        blockStart = i;
        blockStartLine = currentLine;
      }
      depth++;
    } else if (source[i] === '}') {
      depth--;
      if (depth === 0 && blockStart !== -1) {
        blocks.push({ content: source.substring(blockStart, i + 1), startLine: blockStartLine });
        blockStart = -1;
      }
    }
  }

  return blocks;
}
