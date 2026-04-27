import { describe, it, expect } from 'vitest';
import { genericErrorMessageRule } from './generic-error-message.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('error/generic-error-message', () => {
  it('flags throw new Error with generic messages', async () => {
    const file = categorizeFile('violations/error/generic-error-message.service.ts');
    const findings = await genericErrorMessageRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(3);
    expect(findings[0]!.rule_id).toBe('error/generic-error-message');
  });

  it('passes specific error messages', async () => {
    const file = categorizeFile('valid/error/specific-error-message.service.ts');
    const findings = await genericErrorMessageRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
