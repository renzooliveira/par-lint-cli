import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const PX_FONT_RE = /^\s*font-size\s*:\s*(\d+(?:\.\d+)?)px\s*;/;
const ICON_SELECTOR_RE = /\bion-icon\b/;
const SELECTOR_RE = /^([^{]+)\{/;

export const hardcodedPxFontRule: RuleDefinition = {
  id: 'responsive/hardcoded-px-font',
  version: '1.1.0',
  category: 'responsive',
  severity: 'warning',
  description: 'Detects font-size in px instead of rem/em',
  principle: 'Font sizes in px do not scale with user preferences; use rem or em',
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

      const match = PX_FONT_RE.exec(line);
      if (!match) continue;
      if (inIconContext) continue;

      findings.push(createFinding({
        rule_id: 'responsive/hardcoded-px-font',
        file: file.path,
        line: i + 1,
        severity: 'warning',
        message: `font-size: ${match[1]}px. Use rem or em for scalable typography.`,
        source_principle: 'Font sizes should scale with user preferences',
        category: 'responsive',
        fix_complexity: 'S',
        evidence_trail: [{
          tool: 'regex',
          query: { pattern: 'font-size px', file: file.path },
          result: { line: i + 1, value: `${match[1]}px` },
          timestamp: new Date().toISOString(),
          cache_hit: false,
        }],
      }));
    }

    return findings;
  },
};
