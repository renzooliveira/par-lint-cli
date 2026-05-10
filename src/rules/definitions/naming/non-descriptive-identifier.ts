import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const GENERIC_NAMES = new Set([
  'temp', 'obj', 'arr', 'info', 'stuff', 'thing',
  'foo', 'baz', 'tmp', 'ret',
]);

const ALLOWED_SHORT = new Set(['i', 'j', 'k', 'n', 'idx', 'id', 're', 'fp', 'rc', 'fn', 'db', 'io', 'fs', 'os', 'rx', 'el', 'r', 'm', 'l']);

const DECLARATION_RE = /\b(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g;

const FOR_LOOP_RE = /\bfor\s*\(/;
const CALLBACK_RE = /[.,(]\s*(?:async\s+)?(?:\([^)]*\)|[a-zA-Z_$]\w*)\s*=>/;

export const nonDescriptiveIdentifierRule: RuleDefinition = {
  id: 'naming/non-descriptive-identifier',
  version: '1.0.0',
  category: 'naming',
  severity: 'warning',
  description: 'Detects short or generic variable names',
  principle: 'Identifiers express intent, not abbreviation',
  applicable_to: ['is_typescript'],

  async run(file, _config, cwd) {
    if (!file.path.endsWith('.ts')) return [];
    if (file.path.endsWith('.spec.ts') || file.path.endsWith('.test.ts')) return [];

    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');
    const findings = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (line.trimStart().startsWith('//') || line.trimStart().startsWith('*')) continue;

      const isForLoop = FOR_LOOP_RE.test(line);
      const isCallback = CALLBACK_RE.test(line);

      DECLARATION_RE.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = DECLARATION_RE.exec(line)) !== null) {
        const name = match[1]!;

        if (ALLOWED_SHORT.has(name)) continue;
        if (isForLoop && name.length <= 2) continue;
        if (isCallback && name.length <= 2) continue;

        const isShort = name.length <= 2;
        const isGeneric = GENERIC_NAMES.has(name);

        if (!isShort && !isGeneric) continue;

        findings.push(createFinding({
          rule_id: 'naming/non-descriptive-identifier',
          file: file.path,
          line: i + 1,
          column: match.index + 1,
          severity: 'warning',
          message: `Non-descriptive identifier "${name}" — use a meaningful name`,
          source_principle: 'Variable names should express purpose',
          category: 'naming',
          fix_complexity: 'S',
          evidence_trail: [{
            tool: 'regex',
            query: { pattern: 'short/generic name', file: file.path },
            result: { line: i + 1, name, reason: isShort ? 'too short' : 'generic' },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
      }
    }

    return findings;
  },
};
