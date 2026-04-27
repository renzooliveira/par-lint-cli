import { describe, it, expect } from 'vitest';
import { sensitiveDataInLogRule } from './sensitive-data-in-log.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('security/sensitive-data-in-log', () => {
  it('detects sensitive data in console output', async () => {
    const file = categorizeFile('violations/security/sensitive-log.service.ts');
    const findings = await sensitiveDataInLogRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(2);
    expect(findings[0]!.severity).toBe('error');
  });

  it('does not flag safe logging', async () => {
    const file = categorizeFile('valid/security/safe-log.service.ts');
    const findings = await sensitiveDataInLogRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
