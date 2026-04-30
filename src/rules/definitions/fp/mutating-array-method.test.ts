import { describe, it, expect } from 'vitest';
import { mutatingArrayMethodRule } from './mutating-array-method.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('fp/mutating-array-method', () => {
  it('detects push, shift, sort, splice, reverse', async () => {
    const file = categorizeFile('violations/fp/mutating-array.service.ts');
    const findings = await mutatingArrayMethodRule.run(file, config, FIXTURES);

    expect(findings.length).toBe(5);
    expect(findings.some((f) => f.message.includes('.push()'))).toBe(true);
    expect(findings.some((f) => f.message.includes('.sort()'))).toBe(true);
    expect(findings.some((f) => f.message.includes('.splice()'))).toBe(true);
  });

  it('does not flag immutable array operations', async () => {
    const file = categorizeFile('valid/fp/immutable-array.service.ts');
    const findings = await mutatingArrayMethodRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });

  it('does not flag push on local builder arrays', async () => {
    const file = categorizeFile('valid/fp/local-builder-push.service.ts');
    const findings = await mutatingArrayMethodRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
