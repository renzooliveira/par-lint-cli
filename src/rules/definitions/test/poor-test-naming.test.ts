import { describe, it, expect } from 'vitest';
import { poorTestNamingRule } from './poor-test-naming.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('test/poor-test-naming', () => {
  it('detects generic test names', async () => {
    const file = categorizeFile('violations/test/poor-naming.spec.ts');
    const findings = await poorTestNamingRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(2);
  });

  it('does not flag descriptive names', async () => {
    const file = categorizeFile('valid/test/meaningful-assertions.spec.ts');
    const findings = await poorTestNamingRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
