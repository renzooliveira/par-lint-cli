import { describe, it, expect } from 'vitest';
import { highEntropyStringRule } from './high-entropy-string.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('security/high-entropy-string', () => {
  it('detects high-entropy strings', async () => {
    const file = categorizeFile('violations/security/high-entropy.service.ts');
    const findings = await highEntropyStringRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings[0]!.severity).toBe('error');
  });

  it('does not flag normal strings', async () => {
    const file = categorizeFile('valid/security/no-secrets.service.ts');
    const findings = await highEntropyStringRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
