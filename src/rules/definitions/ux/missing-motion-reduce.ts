import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const MOTION_RE = /\b(animation|transition)\s*:/g;
const PREFERS_REDUCED_RE = /prefers-reduced-motion/;

export const missingMotionReduceRule: RuleDefinition = {
  id: 'ux/missing-motion-reduce',
  version: '1.0.0',
  category: 'ux',
  severity: 'warning',
  description: 'Detects CSS animations/transitions without prefers-reduced-motion media query',
  principle: 'Accessibility requires respecting user motion preferences',
  applicable_to: ['is_scss', 'is_style'],

  async run(file, _config, cwd) {
    if (!file.path.endsWith('.scss')) return [];

    const source = await readSource(file.path, cwd);

    if (!MOTION_RE.test(source)) return [];
    if (PREFERS_REDUCED_RE.test(source)) return [];

    MOTION_RE.lastIndex = 0;
    const lines = source.split('\n');
    const findings = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      MOTION_RE.lastIndex = 0;
      if (MOTION_RE.test(line)) {
        findings.push(createFinding({
          rule_id: 'ux/missing-motion-reduce',
          file: file.path,
          line: i + 1,
          severity: 'warning',
          message: 'Animation/transition without prefers-reduced-motion media query. Add @media (prefers-reduced-motion: reduce) override.',
          source_principle: 'Accessibility requires respecting reduced motion preference',
          category: 'ux',
          fix_complexity: 'S',
          evidence_trail: [{
            tool: 'regex',
            query: { file: file.path },
            result: { line: i + 1, hasPrefersReducedMotion: false },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
      }
    }

    return findings;
  },
};
