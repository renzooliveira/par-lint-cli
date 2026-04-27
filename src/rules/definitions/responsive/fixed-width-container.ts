import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const FIXED_WIDTH_RE = /^\s*width\s*:\s*(\d+)px\s*;/;

export const fixedWidthContainerRule: RuleDefinition = {
  id: 'responsive/fixed-width-container',
  version: '1.0.0',
  category: 'responsive',
  severity: 'warning',
  description: 'Detects fixed width in px on containers instead of max-width or percentage',
  principle: 'Containers should use fluid widths for responsive layouts',
  applicable_to: ['is_scss', 'is_style'],

  async run(file, _config, cwd) {
    if (!file.path.endsWith('.scss')) return [];

    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');
    const findings = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (line.trimStart().startsWith('//') || line.trimStart().startsWith('*')) continue;

      const match = FIXED_WIDTH_RE.exec(line);
      if (!match) continue;

      findings.push(createFinding({
        rule_id: 'responsive/fixed-width-container',
        file: file.path,
        line: i + 1,
        severity: 'warning',
        message: `Fixed width "${match[1]}px". Use max-width + width: 100% or percentage for responsive layout.`,
        source_principle: 'Containers should use fluid widths',
        category: 'responsive',
        fix_complexity: 'S',
        evidence_trail: [{
          tool: 'regex',
          query: { pattern: 'fixed width px', file: file.path },
          result: { line: i + 1, value: `${match[1]}px` },
          timestamp: new Date().toISOString(),
          cache_hit: false,
        }],
      }));
    }

    return findings;
  },
};
