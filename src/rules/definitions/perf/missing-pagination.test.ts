import { describe, it, expect } from 'vitest';
import { missingPaginationRule } from './missing-pagination.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');

describe('perf/missing-pagination', () => {
  it('flags getAll returning array without pagination', async () => {
    const config = parLintConfigSchema.parse({ project: { name: 'test' } });
    const file = categorizeFile('violations/missing-pagination.service.ts');
    const findings = await missingPaginationRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(1);
    expect(findings[0]!.rule_id).toBe('perf/missing-pagination');
  });

  it('passes for clean service', async () => {
    const config = parLintConfigSchema.parse({ project: { name: 'test' } });
    const file = categorizeFile('valid/clean.component.ts');
    const findings = await missingPaginationRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
