import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const BINDING_RE = /\{\{\s*\w+\.\w+/;
const OVERFLOW_CLASS_RE = /(?:truncate|text-ellipsis|line-clamp-\d+|overflow-hidden|ion-text-wrap|text-nowrap)/;
const OVERFLOW_STYLE_RE = /(?:text-overflow\s*:\s*ellipsis|overflow-wrap\s*:\s*break-word|word-break\s*:\s*break-all)/;
const SMALL_CONTAINER_RE = /<(?:ion-badge|ion-chip|ion-button|ion-note|button|span\b)/;
const TAG_WITH_BINDING_RE = /^(\s*)<(\w[\w-]*)\b([^>]*)>([^<]*\{\{[^}]+\}\})/;
const TEMPLATE_EXT_RE = /\.(?:page|component)\.html$/;

export const textOverflowUnhandledRule: RuleDefinition = {
  id: 'component/text-overflow-unhandled',
  version: '1.0.0',
  category: 'component',
  severity: 'info',
  description: 'Detects dynamic text bindings without overflow/truncation handling',
  principle: 'Text of unknown length must have overflow handling to prevent layout breakage',
  applicable_to: ['is_template'],

  async run(file, _config, cwd) {
    if (!TEMPLATE_EXT_RE.test(file.path)) return [];

    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');
    const findings: ReturnType<typeof createFinding>[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (!BINDING_RE.test(line)) continue;

      if (SMALL_CONTAINER_RE.test(line)) continue;

      const context = (lines[i - 1] ?? '') + line + (lines[i + 1] ?? '');
      if (OVERFLOW_CLASS_RE.test(context)) continue;
      if (OVERFLOW_STYLE_RE.test(context)) continue;

      const tagMatch = line.match(TAG_WITH_BINDING_RE);
      const element = tagMatch ? tagMatch[2] : 'element';

      findings.push(createFinding({
        rule_id: 'component/text-overflow-unhandled',
        file: file.path,
        line: i + 1,
        severity: 'info',
        message: `Dynamic text in <${element}> without overflow handling. Add truncate/line-clamp or ion-text-wrap.`,
        source_principle: 'Text of unknown length must have overflow handling',
        category: 'component',
        fix_complexity: 'S',
        evidence_trail: [{
          tool: 'regex.textOverflowUnhandled',
          query: { file: file.path },
          result: { element, line: i + 1 },
          timestamp: new Date().toISOString(),
          cache_hit: false,
        }],
      }));
    }

    return findings;
  },
};
