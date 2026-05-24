import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const COMPONENT_HTML_RE = /\.component\.html$/;
const TAG_RE = /<([a-zA-Z][a-zA-Z0-9-]*)/g;
const IONIC_TAG_RE = /^ion-/;
const JUSTIFICATION_RE = /<!--\s*custom:/;
const SELF_CLOSING_VOID = new Set(['br', 'hr', 'img', 'input', 'meta', 'link', 'source', 'area', 'base', 'col', 'embed', 'track', 'wbr']);

export const customWithoutJustificationRule: RuleDefinition = {
  id: 'component/custom-without-justification',
  version: '1.0.0',
  category: 'component',
  severity: 'info',
  description: 'Detects custom components with mostly non-Ionic elements in an Ionic project',
  principle: 'Prefer Ionic components over custom HTML — "build vs use" defaults to "use"',
  applicable_to: ['is_template'],

  async run(file, _config, cwd) {
    if (!COMPONENT_HTML_RE.test(file.path)) return [];

    const source = await readSource(file.path, cwd);

    if (JUSTIFICATION_RE.test(source)) return [];

    let ionicCount = 0;
    let totalCount = 0;
    let match: RegExpExecArray | null;
    const re = new RegExp(TAG_RE.source, 'g');

    while ((match = re.exec(source)) !== null) {
      const tag = match[1]!.toLowerCase();
      if (SELF_CLOSING_VOID.has(tag)) continue;
      totalCount++;
      if (IONIC_TAG_RE.test(tag)) ionicCount++;
    }

    if (totalCount < 5) return [];

    const nonIonicRatio = (totalCount - ionicCount) / totalCount;
    if (nonIonicRatio <= 0.70) return [];

    const pct = Math.round(nonIonicRatio * 100);
    return [createFinding({
      rule_id: 'component/custom-without-justification',
      file: file.path,
      line: 1,
      severity: 'info',
      message: `Component template is ${pct}% non-Ionic elements. Add <!-- custom: reason --> or use Ionic components.`,
      source_principle: 'Prefer Ionic components — "build vs use" defaults to "use"',
      category: 'component',
      fix_complexity: 'M',
      evidence_trail: [{
        tool: 'regex.customWithoutJustification',
        query: { file: file.path },
        result: { totalTags: totalCount, ionicTags: ionicCount, nonIonicPct: pct },
        timestamp: new Date().toISOString(),
        cache_hit: false,
      }],
    })];
  },
};
