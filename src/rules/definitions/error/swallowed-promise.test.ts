import { describe, it, expect } from 'vitest';
import { swallowedPromiseRule } from './swallowed-promise.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('error/swallowed-promise', () => {
  it('flags fire-and-forget async calls', async () => {
    const file = categorizeFile('violations/error/swallowed-promise.service.ts');
    const findings = await swallowedPromiseRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings[0]!.rule_id).toBe('error/swallowed-promise');
  });

  it('passes awaited promises', async () => {
    const file = categorizeFile('valid/error/awaited-promise.service.ts');
    const findings = await swallowedPromiseRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
