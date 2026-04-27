import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const FONT_FACE_RE = /@font-face\s*\{/g;
const FONT_DISPLAY_RE = /font-display\s*:/;

export const fontDisplayMissingRule: RuleDefinition = {
  id: 'perf/font-display-missing',
  version: '1.0.0',
  category: 'perf',
  severity: 'warning',
  description: 'Detects @font-face without font-display property',
  principle: '@font-face without font-display causes FOIT (Flash of Invisible Text)',
  applicable_to: ['is_scss', 'is_style'],

  async run(file, _config, cwd) {
    if (!file.path.endsWith('.scss') && !file.path.endsWith('.css')) return [];

    const source = await readSource(file.path, cwd);
    const findings = [];

    for (const match of source.matchAll(FONT_FACE_RE)) {
      const startIdx = match.index;
      const line = source.substring(0, startIdx).split('\n').length;

      let depth = 0;
      let blockEnd = startIdx;
      for (let i = startIdx; i < source.length; i++) {
        if (source[i] === '{') depth++;
        if (source[i] === '}') { depth--; if (depth === 0) { blockEnd = i; break; } }
      }

      const block = source.substring(startIdx, blockEnd + 1);
      if (FONT_DISPLAY_RE.test(block)) continue;

      findings.push(createFinding({
        rule_id: 'perf/font-display-missing',
        file: file.path,
        line,
        severity: 'warning',
        message: '@font-face without font-display. Add font-display: swap to avoid FOIT.',
        source_principle: 'Font display strategy prevents invisible text flash',
        category: 'perf',
        fix_complexity: 'S',
        evidence_trail: [{
          tool: 'regex',
          query: { pattern: '@font-face', file: file.path },
          result: { line },
          timestamp: new Date().toISOString(),
          cache_hit: false,
        }],
      }));
    }

    return findings;
  },
};
