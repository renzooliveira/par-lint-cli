import type { RuleDefinition } from '../../../engine/runner.js';
import { createFinding } from '../../../engine/finding.js';
import { access } from 'node:fs/promises';
import path from 'node:path';

const TESTABLE_SUFFIXES = ['.service.ts', '.component.ts', '.pipe.ts', '.guard.ts', '.directive.ts', '.interceptor.ts', '.resolver.ts'];

export const specFileMissingRule: RuleDefinition = {
  id: 'naming/spec-file-missing',
  version: '1.0.0',
  category: 'naming',
  severity: 'info',
  description: 'Detects production files without a corresponding .spec.ts',
  principle: 'Production code has test coverage',
  applicable_to: ['is_typescript'],

  async run(file, _config, cwd) {
    if (!file.path.endsWith('.ts')) return [];
    if (file.path.endsWith('.spec.ts') || file.path.endsWith('.test.ts')) return [];
    if (file.path.endsWith('.d.ts')) return [];

    const isTestable = TESTABLE_SUFFIXES.some((s) => file.path.endsWith(s));
    if (!isTestable) return [];

    const specPath = file.path.replace(/\.ts$/, '.spec.ts');
    const absSpecPath = path.resolve(cwd, specPath);

    try {
      await access(absSpecPath);
      return [];
    } catch {
      return [createFinding({
        rule_id: 'naming/spec-file-missing',
        file: file.path,
        line: 1,
        severity: 'info',
        message: `Missing .spec.ts for "${path.basename(file.path)}"`,
        source_principle: 'Testable production code should have spec file',
        category: 'naming',
        fix_complexity: 'M',
        evidence_trail: [{
          tool: 'filesystem',
          query: { specPath },
          result: { exists: false },
          timestamp: new Date().toISOString(),
          cache_hit: false,
        }],
      })];
    }
  },
};
