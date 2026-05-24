import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const TEXT_CONTENT_RE = />([\w][\w\s,.!?:;'"()-]{2,})</;
const I18N_ATTR_RE = /\bi18n\b/;
const TRANSLATE_PIPE_RE = /\|\s*translate/;
const INTERPOLATION_RE = /\{\{.*\}\}/;
const SKIP_TAGS = /^<\s*(script|style|code|pre)/i;

export const hardcodedTextRule: RuleDefinition = {
  id: 'template/hardcoded-text',
  version: '1.0.0',
  category: 'template',
  severity: 'info',
  description: 'Detects hardcoded text in templates without i18n markers',
  principle: 'User-facing text should go through translation pipeline for i18n support',
  applicable_to: ['is_template'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.html')) return [];

    const ruleConfig = config.rules['template/hardcoded-text'] as { enabled?: boolean } | undefined;
    if (ruleConfig?.enabled !== true) return [];

    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');
    const findings: ReturnType<typeof createFinding>[] = [];

    let inSkipBlock = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;

      if (SKIP_TAGS.test(line)) { inSkipBlock = true; continue; }
      if (/<\/\s*(script|style|code|pre)/i.test(line)) { inSkipBlock = false; continue; }
      if (inSkipBlock) continue;

      if (line.trimStart().startsWith('<!--')) continue;
      if (I18N_ATTR_RE.test(line)) continue;
      if (TRANSLATE_PIPE_RE.test(line)) continue;

      const match = line.match(TEXT_CONTENT_RE);
      if (!match) continue;

      const text = match[1]!.trim();
      if (text.length < 3) continue;
      if (INTERPOLATION_RE.test(text)) continue;
      if (/^(true|false|null|undefined|\d+)$/i.test(text)) continue;

      findings.push(createFinding({
        rule_id: 'template/hardcoded-text',
        file: file.path,
        line: i + 1,
        severity: 'info',
        message: `Hardcoded text "${text.slice(0, 50)}". Use translate pipe or i18n attribute.`,
        source_principle: 'User-facing text should go through translation pipeline',
        category: 'template',
        fix_complexity: 'M',
        evidence_trail: [{
          tool: 'regex.hardcodedText',
          query: { file: file.path },
          result: { line: i + 1, text: text.slice(0, 50) },
          timestamp: new Date().toISOString(),
          cache_hit: false,
        }],
      }));
    }

    return findings;
  },
};
