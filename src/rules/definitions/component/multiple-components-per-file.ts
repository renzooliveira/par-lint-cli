import type { RuleDefinition } from '../../../engine/runner.js';
import { createFinding } from '../../../engine/finding.js';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const COMPONENT_DECORATOR_RE = /@Component\s*\(/g;

export const multipleComponentsPerFileRule: RuleDefinition = {
  id: 'component/multiple-components-per-file',
  version: '1.0.0',
  category: 'component',
  severity: 'error',
  description: 'Detects files with 2+ @Component decorators',
  principle: 'One component per file for clarity and testability',
  applicable_to: ['is_component'],

  async run(file, _config, cwd) {
    if (!file.path.endsWith('.component.ts')) return [];

    const source = await readFile(path.resolve(cwd, file.path), 'utf-8');
    const matches = [...source.matchAll(COMPONENT_DECORATOR_RE)];

    if (matches.length < 2) return [];

    return [createFinding({
      rule_id: 'component/multiple-components-per-file',
      file: file.path,
      line: source.substring(0, matches[1]!.index).split('\n').length,
      severity: 'error',
      message: `File has ${matches.length} @Component decorators. One component per file.`,
      source_principle: 'One component per file for clarity and testability',
      category: 'component',
      fix_complexity: 'M',
      evidence_trail: [{
        tool: 'regex',
        query: { pattern: '@Component', file: file.path },
        result: { count: matches.length },
        timestamp: new Date().toISOString(),
        cache_hit: false,
      }],
    })];
  },
};
