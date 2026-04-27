import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const DEFAULT_RESERVED = new Set([
  'data', 'result', 'status', 'type', 'value', 'item',
  'list', 'error', 'state', 'config', 'options',
  'params', 'response', 'request',
]);

const DECLARATION_RE = /\b(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g;

export const reservedWordCollisionRule: RuleDefinition = {
  id: 'naming/reserved-word-collision',
  version: '1.1.0',
  category: 'naming',
  severity: 'warning',
  description: 'Detects variables using generic domain-reserved words',
  principle: 'Variable names should be specific to their context, not generic placeholders',
  applicable_to: ['is_typescript'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.ts')) return [];
    if (file.path.endsWith('.spec.ts') || file.path.endsWith('.test.ts')) return [];
    if (file.path.endsWith('.config.ts')) return [];

    const opts = config.rules['naming/reserved-word-collision']?.options as {
      reservedWords?: string[];
    } | undefined;
    const reserved = opts?.reservedWords
      ? new Set(opts.reservedWords)
      : DEFAULT_RESERVED;

    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');
    const findings = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (line.trimStart().startsWith('//') || line.trimStart().startsWith('*')) continue;

      DECLARATION_RE.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = DECLARATION_RE.exec(line)) !== null) {
        const name = match[1]!;

        if (!reserved.has(name)) continue;

        findings.push(createFinding({
          rule_id: 'naming/reserved-word-collision',
          file: file.path,
          line: i + 1,
          column: match.index + 1,
          severity: 'warning',
          message: `Generic name "${name}" — use a context-specific name`,
          source_principle: 'Variable names should be specific to context',
          category: 'naming',
          fix_complexity: 'S',
          evidence_trail: [{
            tool: 'regex',
            query: { pattern: 'reserved word', file: file.path },
            result: { line: i + 1, name },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
      }
    }

    return findings;
  },
};
