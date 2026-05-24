import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const TYPE_DECL_RE = /^\s*(?:export\s+)?(?:interface|type)\s+(\w+)/;
const PROP_RE = /^\s*(\w+)\s*[?]?\s*:\s*(.+?)\s*;?\s*$/;

function extractShape(lines: string[], startIdx: number): { props: string; endIdx: number } {
  const props: string[] = [];
  let depth = 0;
  let i = startIdx;

  for (; i < lines.length; i++) {
    const line = lines[i]!;
    for (const ch of line) {
      if (ch === '{') depth++;
      if (ch === '}') depth--;
    }

    const propMatch = line.match(PROP_RE);
    if (propMatch && depth > 0) {
      props.push(`${propMatch[1]}:${propMatch[2]!.trim()}`);
    }

    if (depth <= 0 && i > startIdx) break;
  }

  return { props: props.sort().join('|'), endIdx: i };
}

export const duplicateTypeShapeRule: RuleDefinition = {
  id: 'duplication/duplicate-type-shape',
  version: '1.0.0',
  category: 'duplication',
  severity: 'info',
  description: 'Detects interfaces/types with identical shapes in the same file',
  principle: 'Identical type shapes indicate a shared type that should be extracted',
  applicable_to: ['is_typescript'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.ts') || file.path.endsWith('.spec.ts') || file.path.endsWith('.test.ts')) return [];

    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');

    const shapes = new Map<string, { names: string[]; lines: number[] }>();

    for (let i = 0; i < lines.length; i++) {
      const match = lines[i]!.match(TYPE_DECL_RE);
      if (!match) continue;

      const name = match[1]!;
      const { props, endIdx } = extractShape(lines, i);
      if (!props) continue;

      const entry = shapes.get(props) ?? { names: [], lines: [] };
      entry.names.push(name);
      entry.lines.push(i + 1);
      shapes.set(props, entry);
      i = endIdx;
    }

    const findings: ReturnType<typeof createFinding>[] = [];
    for (const [, data] of shapes) {
      if (data.names.length < 2) continue;
      findings.push(createFinding({
        rule_id: 'duplication/duplicate-type-shape',
        file: file.path,
        line: data.lines[0]!,
        severity: 'info',
        message: `Types ${data.names.join(', ')} have identical shapes. Consider unifying into a shared type.`,
        source_principle: 'Identical type shapes indicate a shared type',
        category: 'duplication',
        fix_complexity: 'S',
        evidence_trail: [{
          tool: 'regex.duplicateShape',
          query: { file: file.path },
          result: { types: data.names },
          timestamp: new Date().toISOString(),
          cache_hit: false,
        }],
      }));
    }

    return findings;
  },
};
