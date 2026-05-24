import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const FIXED_HEIGHT_RE = /^\s*height\s*:\s*(\d+)(px|vh)\s*;/;
const ICON_SELECTOR_RE = /\b(?:logo|icon|avatar)\b/i;
const SELECTOR_RE = /^([^{]+)\{/;

export const fixedHeightContentRule: RuleDefinition = {
  id: 'responsive/fixed-height-content',
  version: '1.1.0',
  category: 'responsive',
  severity: 'warning',
  description: 'Detects fixed height instead of min-height on content containers',
  principle: 'Fixed height on dynamic content clips text at larger zoom or a11y settings',
  applicable_to: ['is_scss', 'is_style'],

  async run(file, _config, cwd) {
    if (!file.path.endsWith('.scss')) return [];

    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');
    const findings = [];
    let inIconContext = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (line.trimStart().startsWith('//') || line.trimStart().startsWith('*')) continue;

      const selectorMatch = SELECTOR_RE.exec(line);
      if (selectorMatch) {
        inIconContext = ICON_SELECTOR_RE.test(selectorMatch[1]!);
      }
      if (line.includes('}')) inIconContext = false;

      const match = FIXED_HEIGHT_RE.exec(line);
      if (!match) continue;
      if (inIconContext) continue;

      findings.push(createFinding({
        rule_id: 'responsive/fixed-height-content',
        file: file.path,
        line: i + 1,
        severity: 'warning',
        message: `Fixed height: ${match[1]}${match[2]}. Use min-height instead to allow content to grow.`,
        source_principle: 'Fixed height clips dynamic content',
        category: 'responsive',
        fix_complexity: 'S',
        evidence_trail: [{
          tool: 'regex',
          query: { pattern: 'fixed height', file: file.path },
          result: { line: i + 1, value: `${match[1]}${match[2]}` },
          timestamp: new Date().toISOString(),
          cache_hit: false,
        }],
      }));
    }

    return findings;
  },
};
