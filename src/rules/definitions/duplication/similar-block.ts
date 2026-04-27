import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';
import { createHash } from 'node:crypto';

const MIN_BLOCK_LINES = 4;

const METHOD_START_RE = /^[ \t]*(?:async\s+)?(?:private\s+|protected\s+|public\s+|static\s+)*\w+\s*\([^)]*\)\s*(?::\s*\S+)?\s*\{/;
const FUNCTION_START_RE = /^[ \t]*(?:export\s+)?(?:async\s+)?function\s+\w+/;

function normalize(line: string): string {
  return line
    .trim()
    .replace(/['"`][^'"`]*['"`]/g, '"STR"')
    .replace(/\b\d+\.?\d*\b/g, '0')
    .replace(/\b[a-z][a-zA-Z0-9]*\b/g, 'ID')
    .replace(/\s+/g, ' ');
}

interface Block {
  startLine: number;
  endLine: number;
  hash: string;
  methodName: string;
}

function extractBlocks(lines: string[]): Block[] {
  const blocks: Block[] = [];
  let depth = 0;
  let blockStart = -1;
  let blockLines: string[] = [];
  let methodName = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;

    if (blockStart === -1) {
      if (METHOD_START_RE.test(line) || FUNCTION_START_RE.test(line)) {
        const nameMatch = line.match(/(\w+)\s*\(/);
        methodName = nameMatch ? nameMatch[1]! : 'anonymous';
        blockStart = i;
        depth = 0;
      }
    }

    if (blockStart >= 0) {
      for (const ch of line) {
        if (ch === '{') depth++;
        if (ch === '}') depth--;
      }
      blockLines.push(line);

      if (depth <= 0 && blockLines.length > 1) {
        const body = blockLines.slice(1, -1);
        if (body.length >= MIN_BLOCK_LINES) {
          const normalized = body.map(normalize).join('\n');
          const hash = createHash('md5').update(normalized).digest('hex');
          blocks.push({ startLine: blockStart + 1, endLine: i + 1, hash, methodName });
        }
        blockStart = -1;
        blockLines = [];
        methodName = '';
      }
    }
  }

  return blocks;
}

export const similarBlockRule: RuleDefinition = {
  id: 'duplication/similar-block',
  version: '1.0.0',
  category: 'duplication',
  severity: 'warning',
  description: 'Detects structurally similar code blocks (potential boilerplate) within the same file',
  principle: 'Repeated structure signals missing abstraction — extract or generalize',
  applicable_to: ['is_typescript'],

  async run(file, _config, cwd) {
    if (!file.path.endsWith('.ts')) return [];
    if (file.path.endsWith('.spec.ts') || file.path.endsWith('.test.ts')) return [];

    let source: string;
    try {
      source = await readSource(file.path, cwd);
    } catch {
      return [];
    }

    const lines = source.split('\n');
    const blocks = extractBlocks(lines);

    const hashGroups = new Map<string, Block[]>();
    for (const block of blocks) {
      const group = hashGroups.get(block.hash) ?? [];
      group.push(block);
      hashGroups.set(block.hash, group);
    }

    const findings = [];
    for (const [, group] of hashGroups) {
      if (group.length < 2) continue;

      const names = group.map((b) => b.methodName).join(', ');
      const linesRange = group.map((b) => `L${b.startLine}-${b.endLine}`).join(', ');

      findings.push(createFinding({
        rule_id: 'duplication/similar-block',
        file: file.path,
        line: group[0]!.startLine,
        severity: 'warning',
        message: `${group.length} structurally similar blocks found (${names}). Consider extracting a shared helper. Locations: ${linesRange}`,
        source_principle: 'DRY — repeated structure should be abstracted',
        category: 'duplication',
        fix_complexity: 'M',
        evidence_trail: [{
          tool: 'hash.normalizedBlock',
          query: { file: file.path },
          result: { duplicateCount: group.length, methods: names },
          timestamp: new Date().toISOString(),
          cache_hit: false,
        }],
      }));
    }

    return findings;
  },
};
