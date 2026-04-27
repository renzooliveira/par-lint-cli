import type { RuleDefinition } from '../../../engine/runner.js';
import { createFinding } from '../../../engine/finding.js';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const SELECTOR_RE = /selector\s*:\s*['"]([^'"]+)['"]/;

export const selectorPrefixMismatchRule: RuleDefinition = {
  id: 'component/selector-prefix-mismatch',
  version: '1.0.0',
  category: 'component',
  severity: 'warning',
  description: 'Detects component selector without required prefix',
  principle: 'Consistent selector prefix avoids naming collisions and aids grep-ability',
  applicable_to: ['is_component'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.component.ts')) return [];

    const opts = config.rules['component/selector-prefix-mismatch']?.options as {
      prefix?: string;
    } | undefined;
    const prefix = opts?.prefix ?? 'app';

    const source = await readFile(path.resolve(cwd, file.path), 'utf-8');
    const match = SELECTOR_RE.exec(source);
    if (!match) return [];

    const selector = match[1]!;
    if (selector.startsWith(`${prefix}-`)) return [];

    return [createFinding({
      rule_id: 'component/selector-prefix-mismatch',
      file: file.path,
      line: source.substring(0, match.index).split('\n').length,
      severity: 'warning',
      message: `Selector "${selector}" does not start with "${prefix}-". Expected prefix "${prefix}-".`,
      source_principle: 'Consistent selector prefix avoids naming collisions',
      category: 'component',
      fix_complexity: 'S',
      evidence_trail: [{
        tool: 'regex',
        query: { pattern: 'selector', file: file.path },
        result: { selector, expectedPrefix: prefix },
        timestamp: new Date().toISOString(),
        cache_hit: false,
      }],
    })];
  },
};
