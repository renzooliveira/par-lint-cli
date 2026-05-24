import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const FUNC_RE = /^\s*(?:async\s+)?(?:public\s+|private\s+|protected\s+)?(\w+)\s*\(([^)]*)\)\s*[:{]/;

function normalizeBody(lines: string[]): string {
  return lines
    .map(l => l.trim())
    .filter(l => l.length > 0 && l !== '{' && l !== '}')
    .map(l => l.replace(/\b\w+\b/g, '_').replace(/['"`][^'"`]*['"`]/g, '""'))
    .join('\n');
}

export const structuralCloneRule: RuleDefinition = {
  id: 'duplication/structural-clone',
  version: '1.0.0',
  category: 'duplication',
  severity: 'warning',
  description: 'Detects methods/functions with structurally identical bodies within the same file',
  principle: 'Duplicate logic should be extracted into a shared function',
  applicable_to: ['is_typescript'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.ts') || file.path.endsWith('.spec.ts') || file.path.endsWith('.test.ts')) return [];

    const opts = config.rules['duplication/structural-clone'] as { min_lines?: number } | undefined;
    const minLines = opts?.min_lines ?? 3;

    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');

    const functions: { name: string; body: string; line: number }[] = [];
    let currentName = '';
    let currentLine = 0;
    let bodyLines: string[] = [];
    let braceDepth = 0;
    let inFunc = false;

    const flushFunc = () => {
      if (currentName && bodyLines.length >= minLines) {
        functions.push({ name: currentName, body: normalizeBody(bodyLines), line: currentLine });
      }
      currentName = '';
      bodyLines = [];
      inFunc = false;
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      const funcMatch = line.match(FUNC_RE);

      if (funcMatch && !inFunc) {
        currentName = funcMatch[1]!;
        currentLine = i + 1;
        bodyLines = [];
        braceDepth = 0;
        inFunc = true;
      }

      if (inFunc) {
        for (const ch of line) {
          if (ch === '{') braceDepth++;
          if (ch === '}') {
            braceDepth--;
            if (braceDepth <= 0) {
              flushFunc();
              break;
            }
          }
        }
        if (inFunc) bodyLines.push(line);
      }
    }
    flushFunc();

    const bodyMap = new Map<string, { names: string[]; lines: number[] }>();
    for (const func of functions) {
      const entry = bodyMap.get(func.body) ?? { names: [], lines: [] };
      entry.names.push(func.name);
      entry.lines.push(func.line);
      bodyMap.set(func.body, entry);
    }

    const findings: ReturnType<typeof createFinding>[] = [];
    for (const [, data] of bodyMap) {
      if (data.names.length < 2) continue;
      findings.push(createFinding({
        rule_id: 'duplication/structural-clone',
        file: file.path,
        line: data.lines[0]!,
        severity: 'warning',
        message: `Functions ${data.names.join(', ')} have structurally identical bodies. Extract shared logic.`,
        source_principle: 'Duplicate logic should be extracted into a shared function',
        category: 'duplication',
        fix_complexity: 'M',
        evidence_trail: [{
          tool: 'regex.structuralClone',
          query: { file: file.path },
          result: { functions: data.names, count: data.names.length },
          timestamp: new Date().toISOString(),
          cache_hit: false,
        }],
      }));
    }

    return findings;
  },
};
