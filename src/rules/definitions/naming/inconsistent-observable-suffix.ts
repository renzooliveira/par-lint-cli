import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const OBSERVABLE_TYPES = /(?:Observable|Subject|BehaviorSubject|ReplaySubject|AsyncSubject)\b/;
const MEMBER_DECL_RE = /^\s*(?:private\s+|public\s+|protected\s+|readonly\s+)*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*[=:]/;
const DOLLAR_SUFFIX = /\$$/;

export const inconsistentObservableSuffixRule: RuleDefinition = {
  id: 'naming/inconsistent-observable-suffix',
  version: '1.0.0',
  category: 'naming',
  severity: 'warning',
  description: 'Detects Observable members without $ suffix when project uses the convention',
  principle: 'Observable naming convention ($) must be consistent across the project',
  applicable_to: ['is_typescript'],

  async run(file, _config, cwd) {
    if (!file.path.endsWith('.ts')) return [];

    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');

    let hasDollarConvention = false;
    for (const line of lines) {
      const match = MEMBER_DECL_RE.exec(line);
      if (match && DOLLAR_SUFFIX.test(match[1]!) && OBSERVABLE_TYPES.test(line)) {
        hasDollarConvention = true;
        break;
      }
    }

    if (!hasDollarConvention) return [];

    const findings = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      const match = MEMBER_DECL_RE.exec(line);
      if (!match) continue;

      const name = match[1]!;
      if (!OBSERVABLE_TYPES.test(line)) continue;
      if (DOLLAR_SUFFIX.test(name)) continue;

      findings.push(createFinding({
        rule_id: 'naming/inconsistent-observable-suffix',
        file: file.path,
        line: i + 1,
        severity: 'warning',
        message: `Observable "${name}" missing $ suffix — use "${name}$" for consistency`,
        source_principle: 'Observable $ convention must be consistent',
        category: 'naming',
        fix_complexity: 'S',
        evidence_trail: [{
          tool: 'regex',
          query: { pattern: 'observable without $', file: file.path },
          result: { line: i + 1, name },
          timestamp: new Date().toISOString(),
          cache_hit: false,
        }],
      }));
    }

    return findings;
  },
};
