import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const CONSECUTIVE_CAPS_RE = /[A-Z]{3,}/g;

const DEFAULT_ALLOWLIST = new Set(['ID', 'URL', 'HTTP', 'API', 'DOM', 'HTML', 'CSS', 'SQL', 'JSON', 'JWT', 'UUID', 'XML', 'CSV', 'CLI', 'URI', 'DNS', 'SSH', 'TLS', 'SSL', 'TCP', 'UDP', 'IP']);

const IDENTIFIER_RE = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g;

export const abbreviationInIdentifierRule: RuleDefinition = {
  id: 'naming/abbreviation-in-identifier',
  version: '1.0.0',
  category: 'naming',
  severity: 'info',
  description: 'Detects 3+ consecutive uppercase letters in identifiers',
  principle: 'Acronyms follow consistent casing: getHttpUrl not getHTTPURL',
  applicable_to: ['is_typescript'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.ts')) return [];

    const opts = config.rules['naming/abbreviation-in-identifier']?.options as {
      allowlist?: string[];
    } | undefined;
    const allowlist = new Set([...DEFAULT_ALLOWLIST, ...(opts?.allowlist ?? [])]);

    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');
    const findings = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (line.trimStart().startsWith('//') || line.trimStart().startsWith('*')) continue;
      if (line.trimStart().startsWith('import ')) continue;

      IDENTIFIER_RE.lastIndex = 0;
      let identMatch: RegExpExecArray | null;
      while ((identMatch = IDENTIFIER_RE.exec(line)) !== null) {
        const ident = identMatch[1]!;

        CONSECUTIVE_CAPS_RE.lastIndex = 0;
        let capsMatch: RegExpExecArray | null;
        while ((capsMatch = CONSECUTIVE_CAPS_RE.exec(ident)) !== null) {
          const abbr = capsMatch[0];
          if (allowlist.has(abbr)) continue;

          findings.push(createFinding({
            rule_id: 'naming/abbreviation-in-identifier',
            file: file.path,
            line: i + 1,
            column: identMatch.index + 1,
            severity: 'info',
            message: `"${ident}" contains "${abbr}" — use PascalCase for acronyms`,
            source_principle: 'Consistent acronym casing improves readability',
            category: 'naming',
            fix_complexity: 'S',
            evidence_trail: [{
              tool: 'regex',
              query: { pattern: '3+ uppercase', file: file.path },
              result: { line: i + 1, identifier: ident, abbreviation: abbr },
              timestamp: new Date().toISOString(),
              cache_hit: false,
            }],
          }));
        }
      }
    }

    return findings;
  },
};
