import type { RuleDefinition } from '../../../engine/runner.js';
import { createFinding } from '../../../engine/finding.js';
import path from 'node:path';

const KEBAB_CASE_FILE_RE = /^[a-z][a-z0-9]*(-[a-z0-9]+)*(\.[a-z]+)+$/;

const EXEMPT_BASENAMES = new Set([
  'index.ts', 'main.ts', 'polyfills.ts',
  'environment.ts', 'environment.prod.ts', 'environment.development.ts',
  'setup-jest.ts', 'jest.config.ts', 'vitest.config.ts',
  'tsconfig.json', 'tsconfig.app.json', 'tsconfig.spec.json',
]);

export const fileNamingConventionRule: RuleDefinition = {
  id: 'naming/file-naming-convention',
  version: '1.0.0',
  category: 'naming',
  severity: 'error',
  description: 'Detects .ts files not following kebab-case.type.ext convention',
  principle: 'Consistent file naming enables mechanical navigation and reduces cognitive load',
  applicable_to: ['is_typescript'],

  async run(file) {
    if (!file.path.endsWith('.ts')) return [];

    const basename = path.basename(file.path);

    if (EXEMPT_BASENAMES.has(basename)) return [];
    if (basename.endsWith('.d.ts')) return [];

    if (KEBAB_CASE_FILE_RE.test(basename)) return [];

    return [createFinding({
      rule_id: 'naming/file-naming-convention',
      file: file.path,
      line: 1,
      severity: 'error',
      message: `File "${basename}" does not follow kebab-case.type.ext convention`,
      source_principle: 'File naming follows kebab-case.type.ext for consistency',
      category: 'naming',
      fix_complexity: 'S',
      evidence_trail: [{
        tool: 'regex',
        query: { pattern: 'kebab-case.type.ext', file: file.path },
        result: { basename },
        timestamp: new Date().toISOString(),
        cache_hit: false,
      }],
    })];
  },
};
