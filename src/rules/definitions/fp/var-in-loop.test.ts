import { describe, it, expect } from 'vitest';
import { varInLoopRule } from './var-in-loop.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('fp/var-in-loop', () => {
  it('detects var inside loop', async () => {
    const file = categorizeFile('violations/fp/var-in-loop.service.ts');
    const findings = await varInLoopRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings[0]!.severity).toBe('error');
  });

  it('does not flag const usage', async () => {
    const file = categorizeFile('valid/fp/const-usage.service.ts');
    const findings = await varInLoopRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
