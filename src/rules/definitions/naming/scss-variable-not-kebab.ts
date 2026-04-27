import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const SCSS_VAR_DECL_RE = /^\s*(\$[a-zA-Z_][a-zA-Z0-9_-]*)\s*:/;
const KEBAB_CASE_VAR_RE = /^\$[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

export const scssVariableNotKebabRule: RuleDefinition = {
  id: 'naming/scss-variable-not-kebab',
  version: '1.0.0',
  category: 'naming',
  severity: 'warning',
  description: 'Detects SCSS variables not using $kebab-case',
  principle: 'SCSS variables follow $kebab-case for consistency',
  applicable_to: ['is_scss', 'is_style'],

  async run(file, _config, cwd) {
    if (!file.path.endsWith('.scss')) return [];

    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');
    const findings = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      const match = SCSS_VAR_DECL_RE.exec(line);
      if (!match) continue;

      const varName = match[1]!;
      if (KEBAB_CASE_VAR_RE.test(varName)) continue;

      findings.push(createFinding({
        rule_id: 'naming/scss-variable-not-kebab',
        file: file.path,
        line: i + 1,
        severity: 'warning',
        message: `SCSS variable "${varName}" is not $kebab-case`,
        source_principle: 'SCSS variables use $kebab-case consistently',
        category: 'naming',
        fix_complexity: 'S',
        evidence_trail: [{
          tool: 'regex',
          query: { pattern: '$kebab-case', file: file.path },
          result: { line: i + 1, varName },
          timestamp: new Date().toISOString(),
          cache_hit: false,
        }],
      }));
    }

    return findings;
  },
};
