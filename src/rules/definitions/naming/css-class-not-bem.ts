import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const BEM_RE = /^[a-z][a-z0-9]*(-[a-z0-9]+)*(__[a-z0-9]+(-[a-z0-9]+)*)?(--[a-z0-9]+(-[a-z0-9]+)*)?$/;
const CLASS_SELECTOR_RE = /^\s*\.([a-zA-Z_][a-zA-Z0-9_-]*)\s*[{,]/;

export const cssClassNotBemRule: RuleDefinition = {
  id: 'naming/css-class-not-bem',
  version: '1.0.0',
  category: 'naming',
  severity: 'warning',
  description: 'Detects CSS class names not following BEM convention',
  principle: 'CSS class names follow BEM for predictable structure',
  applicable_to: ['is_scss', 'is_style'],

  async run(file, _config, cwd) {
    if (!file.path.endsWith('.scss')) return [];

    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');
    const findings = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (line.trimStart().startsWith('//') || line.trimStart().startsWith('*')) continue;
      if (line.includes('&')) continue;

      const match = CLASS_SELECTOR_RE.exec(line);
      if (!match) continue;

      const className = match[1]!;
      if (BEM_RE.test(className)) continue;

      findings.push(createFinding({
        rule_id: 'naming/css-class-not-bem',
        file: file.path,
        line: i + 1,
        severity: 'warning',
        message: `CSS class "${className}" does not follow BEM naming convention`,
        source_principle: 'BEM naming ensures predictable CSS class structure',
        category: 'naming',
        fix_complexity: 'S',
        evidence_trail: [{
          tool: 'regex',
          query: { pattern: 'BEM convention', file: file.path },
          result: { line: i + 1, className },
          timestamp: new Date().toISOString(),
          cache_hit: false,
        }],
      }));
    }

    return findings;
  },
};
