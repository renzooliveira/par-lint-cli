import { describe, it, expect } from 'vitest';
import { tsIgnoreWithoutReasonRule } from './ts-ignore-without-reason.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('typescript/ts-ignore-without-reason', () => {
  it('detects @ts-ignore and @ts-expect-error without reason', async () => {
    const file = categorizeFile('violations/typescript/ts-ignore.service.ts');
    const findings = await tsIgnoreWithoutReasonRule.run(file, config, FIXTURES);

    expect(findings.length).toBe(2);
    expect(findings[0]!.message).toContain('reason');
  });

  it('does not flag @ts-ignore with reason', async () => {
    const file = categorizeFile('valid/typescript/ts-ignore-with-reason.service.ts');
    const findings = await tsIgnoreWithoutReasonRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
