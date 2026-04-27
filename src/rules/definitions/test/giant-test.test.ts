import { describe, it, expect } from 'vitest';
import { giantTestRule } from './giant-test.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('test/giant-test', () => {
  it('detects test longer than 30 lines', async () => {
    const file = categorizeFile('violations/test/giant-test.spec.ts');
    const findings = await giantTestRule.run(file, config, FIXTURES);

    expect(findings.length).toBe(1);
    expect(findings[0]!.message).toContain('lines');
  });

  it('does not flag short tests', async () => {
    const file = categorizeFile('valid/test/meaningful-assertions.spec.ts');
    const findings = await giantTestRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
