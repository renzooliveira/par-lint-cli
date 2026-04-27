import type { RuleDefinition } from '../../../engine/runner.js';
import { createFinding } from '../../../engine/finding.js';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const INTERACTIVE_ELEMENTS = new Set(['button', 'a', 'input', 'select', 'textarea', 'summary', 'details']);

const TAG_WITH_CLICK_RE = /<([a-zA-Z][a-zA-Z0-9-]*)\b([^>]*\(click\)[^>]*)>/gi;
const KEYBOARD_RE = /\(keydown[^)]*\)|\(keyup[^)]*\)|\(keypress[^)]*\)/i;

export const eventWithoutKeyboardRule: RuleDefinition = {
  id: 'template/event-without-keyboard',
  version: '1.0.0',
  category: 'template',
  severity: 'warning',
  description: 'Detects non-interactive elements with (click) but no keyboard event handler',
  principle: 'Keyboard users cannot activate click-only handlers — a11y requirement',
  applicable_to: ['is_template', 'is_html'],

  async run(file, _config, cwd) {
    if (!file.path.endsWith('.html')) return [];

    const source = await readFile(path.resolve(cwd, file.path), 'utf-8');
    const lines = source.split('\n');
    const findings = [];

    for (const match of source.matchAll(TAG_WITH_CLICK_RE)) {
      const tag = match[1]!.toLowerCase();
      const attrs = match[2]!;

      if (INTERACTIVE_ELEMENTS.has(tag)) continue;
      if (KEYBOARD_RE.test(attrs)) continue;

      const line = source.substring(0, match.index).split('\n').length;
      findings.push(createFinding({
        rule_id: 'template/event-without-keyboard',
        file: file.path,
        line,
        severity: 'warning',
        message: `<${tag}> has (click) without keyboard handler. Add (keydown.enter) or (keyup.enter) for a11y.`,
        source_principle: 'Keyboard users cannot activate click-only handlers',
        category: 'template',
        fix_complexity: 'S',
        evidence_trail: [{
          tool: 'regex',
          query: { pattern: '(click) without keyboard', file: file.path },
          result: { element: tag, lineContent: lines[line - 1] },
          timestamp: new Date().toISOString(),
          cache_hit: false,
        }],
      }));
    }

    return findings;
  },
};
