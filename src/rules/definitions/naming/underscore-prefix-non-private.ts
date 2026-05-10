import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const MEMBER_WITH_UNDERSCORE = /^\s*(?:public\s+|protected\s+|readonly\s+)*(_[a-zA-Z][a-zA-Z0-9]*)\s*[=:(]/;
const METHOD_WITH_UNDERSCORE = /^\s*(?:public\s+|protected\s+|readonly\s+)*(_[a-zA-Z][a-zA-Z0-9]*)\s*\(/;
const PRIVATE_KEYWORD = /\bprivate\b/;

export const underscorePrefixNonPrivateRule: RuleDefinition = {
  id: 'naming/underscore-prefix-non-private',
  version: '1.0.0',
  category: 'naming',
  severity: 'warning',
  description: 'Detects _prefixed members that are not declared private',
  principle: 'Underscore prefix is reserved for private members',
  applicable_to: ['is_typescript'],

  async run(file, _config, cwd) {
    if (!file.path.endsWith('.ts')) return [];

    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');
    const findings = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (line.trimStart().startsWith('//') || line.trimStart().startsWith('*')) continue;

      const memberMatch = MEMBER_WITH_UNDERSCORE.exec(line) ?? METHOD_WITH_UNDERSCORE.exec(line);
      if (!memberMatch) continue;

      if (PRIVATE_KEYWORD.test(line)) continue;
      if (line.trimEnd().endsWith(',')) continue;

      const name = memberMatch[1]!;

      findings.push(createFinding({
        rule_id: 'naming/underscore-prefix-non-private',
        file: file.path,
        line: i + 1,
        severity: 'warning',
        message: `"${name}" has underscore prefix but is not private`,
        source_principle: 'Underscore prefix convention is reserved for private members',
        category: 'naming',
        fix_complexity: 'S',
        evidence_trail: [{
          tool: 'regex',
          query: { pattern: '_prefix without private', file: file.path },
          result: { line: i + 1, name },
          timestamp: new Date().toISOString(),
          cache_hit: false,
        }],
      }));
    }

    return findings;
  },
};
