import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const LANDMARK_RE = /<main[\s>]|<nav[\s>]|<header[\s>]|role="main"|role="navigation"|role="banner"/i;

export const landmarkStructureRule: RuleDefinition = {
  id: 'a11y/landmark-structure',
  version: '1.0.0',
  category: 'a11y',
  severity: 'warning',
  applicable_to: ['is_page'],

  async run(file, _config, cwd) {
    if (!file.path.endsWith('.html')) return [];

    const source = await readSource(file.path, cwd);
    if (LANDMARK_RE.test(source)) return [];

    return [createFinding({
      rule_id: 'a11y/landmark-structure',
      file: file.path,
      line: 1,
      severity: 'warning',
      message: 'Page template has no landmark elements (<main>, <nav>, <header>). Add landmarks for screen reader navigation.',
      source_principle: 'Pages should have landmark structure for assistive technology navigation',
      category: 'a11y',
      fix_complexity: 'S',
      evidence_trail: [{
        tool: 'regex',
        query: { file: file.path },
        result: { hasLandmarks: false },
        timestamp: new Date().toISOString(),
        cache_hit: false,
      }],
    })];
  },
};
