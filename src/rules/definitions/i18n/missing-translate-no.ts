import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const CODE_TAGS = ['code', 'pre', 'kbd', 'samp', 'var'];
const TRANSLATE_NO_RE = /translate\s*=\s*"no"/;
const TEMPLATE_EXT_RE = /\.(?:page|component)\.html$/;

const CODE_TAG_RE = new RegExp(
  `<(${CODE_TAGS.join('|')})\\b([^>]*)>`,
  'gi',
);

const BRAND_ELEMENT_RE = /<(\w[\w-]*)\b([^>]*class="[^"]*(?:brand|logo|product-name|app-name)[^"]*"[^>]*)>/gi;

export const missingTranslateNoRule: RuleDefinition = {
  id: 'i18n/missing-translate-no',
  version: '1.0.0',
  category: 'i18n',
  severity: 'info',
  description: 'Detects code/brand elements missing translate="no" to prevent auto-translation',
  principle: 'Technical terms, brand names, and code must not be auto-translated by browsers',
  applicable_to: ['is_template'],

  async run(file, _config, cwd) {
    if (!TEMPLATE_EXT_RE.test(file.path)) return [];

    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');
    const findings: ReturnType<typeof createFinding>[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;

      let match: RegExpExecArray | null;

      const codeRe = new RegExp(CODE_TAG_RE.source, 'gi');
      while ((match = codeRe.exec(line)) !== null) {
        const attrs = match[2] ?? '';
        if (TRANSLATE_NO_RE.test(attrs)) continue;
        const tag = match[1]!.toLowerCase();

        findings.push(createFinding({
          rule_id: 'i18n/missing-translate-no',
          file: file.path,
          line: i + 1,
          severity: 'info',
          message: `<${tag}> element should have translate="no" to prevent auto-translation of technical content.`,
          source_principle: 'Technical content must not be auto-translated',
          category: 'i18n',
          fix_complexity: 'S',
          evidence_trail: [{
            tool: 'regex.missingTranslateNo',
            query: { file: file.path },
            result: { tag, line: i + 1 },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
      }

      const brandRe = new RegExp(BRAND_ELEMENT_RE.source, 'gi');
      while ((match = brandRe.exec(line)) !== null) {
        const attrs = match[2] ?? '';
        if (TRANSLATE_NO_RE.test(attrs)) continue;
        const tag = match[1]!.toLowerCase();

        if (CODE_TAGS.includes(tag)) continue;

        findings.push(createFinding({
          rule_id: 'i18n/missing-translate-no',
          file: file.path,
          line: i + 1,
          severity: 'info',
          message: `<${tag}> with brand/logo class should have translate="no" to prevent auto-translation.`,
          source_principle: 'Brand names must not be auto-translated',
          category: 'i18n',
          fix_complexity: 'S',
          evidence_trail: [{
            tool: 'regex.missingTranslateNo',
            query: { file: file.path },
            result: { tag, line: i + 1, reason: 'brand-class' },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
      }
    }

    return findings;
  },
};
