import { describe, it, expect } from 'vitest';
import { classTooManyFieldsRule } from './class-too-many-fields.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('arch/class-too-many-fields', () => {
  it('detects class with 8+ fields', async () => {
    const file = categorizeFile('violations/arch/too-many-fields.service.ts');
    const findings = await classTooManyFieldsRule.run(file, config, FIXTURES);

    expect(findings.length).toBe(1);
    expect(findings[0]!.message).toContain('fields');
  });

  it('does not flag small classes', async () => {
    const file = categorizeFile('valid/clean.component.ts');
    const findings = await classTooManyFieldsRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
