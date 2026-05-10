import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const HUNGARIAN_RE = /\b(str|num|bool|arr|obj|int|fn)([A-Z][a-zA-Z0-9]*)\b/g;

const DECLARATION_CONTEXT_RE = /(?:const|let|var|private|public|protected|readonly)\s+|[,({]\s*$/;
const CLASS_MEMBER_RE = /^\s+(str|num|bool|arr|obj|int|fn)([A-Z][a-zA-Z0-9]*)\s*[=:]/;

export const hungarianNotationRule: RuleDefinition = {
  id: 'naming/hungarian-notation',
  version: '1.0.0',
  category: 'naming',
  severity: 'warning',
  description: 'Detects Hungarian notation type prefixes in identifiers',
  principle: 'Type info comes from the type system, not the name',
  applicable_to: ['is_typescript'],

  async run(file, _config, cwd) {
    if (!file.path.endsWith('.ts')) return [];

    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');
    const findings = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (line.trimStart().startsWith('//') || line.trimStart().startsWith('*')) continue;

      const classMemberMatch = CLASS_MEMBER_RE.exec(line);
      if (classMemberMatch) {
        const prefix = classMemberMatch[1]!;
        const name = `${prefix}${classMemberMatch[2]}`;
        findings.push(createFinding({
          rule_id: 'naming/hungarian-notation',
          file: file.path,
          line: i + 1,
          severity: 'warning',
          message: `Hungarian notation "${name}" — remove "${prefix}" prefix`,
          source_principle: 'Type prefix is redundant with TypeScript type system',
          category: 'naming',
          fix_complexity: 'S',
          suggested_fix: {
            kind: 'rename',
            description: `Remove "${prefix}" prefix: "${name}" → "${name.slice(prefix.length, prefix.length + 1).toLowerCase()}${name.slice(prefix.length + 1)}"`,
          },
          evidence_trail: [{
            tool: 'regex',
            query: { pattern: 'hungarian prefix', file: file.path },
            result: { line: i + 1, name, prefix },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
        continue;
      }

      HUNGARIAN_RE.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = HUNGARIAN_RE.exec(line)) !== null) {
        const prefix = match[1]!;
        const name = match[0];
        const beforeMatch = line.slice(0, match.index);

        if (!DECLARATION_CONTEXT_RE.test(beforeMatch) && !beforeMatch.trimEnd().endsWith('.')) continue;

        findings.push(createFinding({
          rule_id: 'naming/hungarian-notation',
          file: file.path,
          line: i + 1,
          column: match.index + 1,
          severity: 'warning',
          message: `Hungarian notation "${name}" — remove "${prefix}" prefix`,
          source_principle: 'Type prefix is redundant with TypeScript type system',
          category: 'naming',
          fix_complexity: 'S',
          suggested_fix: {
            kind: 'rename',
            description: `Remove "${prefix}" prefix: "${name}" → "${name.slice(prefix.length, prefix.length + 1).toLowerCase()}${name.slice(prefix.length + 1)}"`,
          },
          evidence_trail: [{
            tool: 'regex',
            query: { pattern: 'hungarian prefix', file: file.path },
            result: { line: i + 1, name, prefix },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
      }
    }

    return findings;
  },
};
