import { describe, it, expect } from 'vitest';
import { functionTooManyParamsRule } from './function-too-many-params.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('typescript/function-too-many-params', () => {
  it('detects functions with 4+ params', async () => {
    const file = categorizeFile('violations/typescript/too-many-params.service.ts');
    const findings = await functionTooManyParamsRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings[0]!.message).toContain('options object');
  });

  it('does not flag functions with options object', async () => {
    const file = categorizeFile('valid/typescript/options-object.service.ts');
    const findings = await functionTooManyParamsRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
