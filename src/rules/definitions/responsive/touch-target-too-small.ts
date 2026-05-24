import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const SIZE_RE = /(?:width|height|min-width|min-height)\s*:\s*(\d+)(px|rem)/;
const MIN_PX = 44;
const MIN_REM = 2.75;

export const touchTargetTooSmallRule: RuleDefinition = {
  id: 'responsive/touch-target-too-small',
  version: '1.0.0',
  category: 'responsive',
  severity: 'warning',
  description: 'Detects interactive elements with touch targets smaller than 44px',
  principle: 'WCAG/Apple/Google minimum touch target is 44x44px for accessibility',
  applicable_to: ['is_scss', 'is_css'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.scss') && !file.path.endsWith('.css')) return [];

    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');
    const findings: ReturnType<typeof createFinding>[] = [];

    let inInteractiveSelector = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;

      if (/(?:^|\s|,)(button|\.btn|\.clickable|a\b|input|select|\[role=['"]button['"]|\[type=['"]submit)/i.test(line)) {
        inInteractiveSelector = true;
      }

      if (inInteractiveSelector && line.includes('}')) {
        inInteractiveSelector = false;
      }

      if (!inInteractiveSelector) continue;

      const match = line.match(SIZE_RE);
      if (!match) continue;

      const value = parseFloat(match[1]!);
      const unit = match[2]!;
      const tooSmall = (unit === 'px' && value < MIN_PX) || (unit === 'rem' && value < MIN_REM);

      if (tooSmall) {
        findings.push(createFinding({
          rule_id: 'responsive/touch-target-too-small',
          file: file.path,
          line: i + 1,
          severity: 'warning',
          message: `Touch target ${value}${unit} is below 44px minimum. Increase for accessibility.`,
          source_principle: 'Minimum touch target is 44x44px (WCAG)',
          category: 'responsive',
          fix_complexity: 'S',
          evidence_trail: [{
            tool: 'regex.touchTarget',
            query: { file: file.path },
            result: { line: i + 1, value: `${value}${unit}` },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
      }
    }

    return findings;
  },
};
