import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const MAGIC_NUM_RE = /^\s*([\w-]+)\s*:\s*(-?\d+(?:\.\d+)?)(px|em|rem|vh|vw|vmin|vmax|ch|ex)\s*;/;
const VAR_DEF_RE = /^\s*\$/;
const ALLOWED_VALUES = new Set(['0', '1', '100']);

export const magicNumberInScssRule: RuleDefinition = {
  id: 'naming/magic-number-in-scss',
  version: '1.0.0',
  category: 'naming',
  severity: 'info',
  description: 'Detects magic numbers in SCSS properties instead of variables/tokens',
  principle: 'Numeric literals should be design tokens for consistency and maintainability',
  applicable_to: ['is_scss', 'is_style'],

  async run(file, _config, cwd) {
    if (!file.path.endsWith('.scss')) return [];

    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');
    const findings = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (line.trimStart().startsWith('//') || line.trimStart().startsWith('*')) continue;
      if (VAR_DEF_RE.test(line)) continue;

      const match = MAGIC_NUM_RE.exec(line);
      if (!match) continue;

      const value = match[2]!;
      if (ALLOWED_VALUES.has(value)) continue;

      const property = match[1]!;
      const unit = match[3]!;

      findings.push(createFinding({
        rule_id: 'naming/magic-number-in-scss',
        file: file.path,
        line: i + 1,
        severity: 'info',
        message: `Magic number "${value}${unit}" in property "${property}". Use a variable or design token.`,
        source_principle: 'Numeric literals should be design tokens',
        category: 'naming',
        fix_complexity: 'S',
        evidence_trail: [{
          tool: 'regex',
          query: { pattern: 'magic number', file: file.path },
          result: { line: i + 1, value: `${value}${unit}`, property },
          timestamp: new Date().toISOString(),
          cache_hit: false,
        }],
      }));
    }

    return findings;
  },
};
