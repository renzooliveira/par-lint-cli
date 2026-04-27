import { describe, it, expect } from 'vitest';
import { classTooManyMethodsRule } from './class-too-many-methods.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('arch/class-too-many-methods', () => {
  it('detects class with 16+ methods', async () => {
    const file = categorizeFile('violations/arch/too-many-methods.service.ts');
    const findings = await classTooManyMethodsRule.run(file, config, FIXTURES);

    expect(findings.length).toBe(1);
    expect(findings[0]!.message).toContain('methods');
  });

  it('does not flag small classes', async () => {
    const file = categorizeFile('valid/clean.component.ts');
    const findings = await classTooManyMethodsRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
