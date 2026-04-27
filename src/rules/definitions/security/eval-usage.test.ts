import { describe, it, expect } from 'vitest';
import { evalUsageRule } from './eval-usage.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('security/eval-usage', () => {
  it('detects eval() and new Function()', async () => {
    const file = categorizeFile('violations/security/eval-usage.service.ts');
    const findings = await evalUsageRule.run(file, config, FIXTURES);

    expect(findings.length).toBe(2);
    expect(findings.some((f) => f.message.includes('eval()'))).toBe(true);
    expect(findings.some((f) => f.message.includes('new Function()'))).toBe(true);
  });

  it('does not flag safe code', async () => {
    const file = categorizeFile('valid/security/no-eval.service.ts');
    const findings = await evalUsageRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
