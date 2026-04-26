import { describe, it, expect } from 'vitest';
import { syncInAsyncPathRule } from './sync-in-async-path.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('perf/sync-in-async-path', () => {
  it('detects .Result and .Wait() in async methods', async () => {
    const file = categorizeFile('violations/sync-in-async.service.ts');
    const findings = await syncInAsyncPathRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(2);
    expect(findings.some((f) => f.message.includes('.Result'))).toBe(true);
    expect(findings.some((f) => f.message.includes('.Wait()'))).toBe(true);
  });

  it('does not flag clean component', async () => {
    const file = categorizeFile('valid/clean.component.ts');
    const findings = await syncInAsyncPathRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
