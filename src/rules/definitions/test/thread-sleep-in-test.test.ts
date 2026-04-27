import { describe, it, expect } from 'vitest';
import { threadSleepInTestRule } from './thread-sleep-in-test.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('test/thread-sleep-in-test', () => {
  it('detects setTimeout delays in test', async () => {
    const file = categorizeFile('violations/test/sleep-in-test.spec.ts');
    const findings = await threadSleepInTestRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(1);
  });

  it('does not flag clean test', async () => {
    const file = categorizeFile('valid/test/meaningful-assertions.spec.ts');
    const findings = await threadSleepInTestRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
