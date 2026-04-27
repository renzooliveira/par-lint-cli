import { describe, it, expect } from 'vitest';
import { technicalNamingRule } from './technical-naming.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('domain/technical-naming', () => {
  it('detects generic technical names', async () => {
    const file = categorizeFile('violations/domain/technical-naming.service.ts');
    const findings = await technicalNamingRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(2);
  });

  it('does not flag domain-specific names', async () => {
    const file = categorizeFile('valid/domain/domain-naming.service.ts');
    const findings = await technicalNamingRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
