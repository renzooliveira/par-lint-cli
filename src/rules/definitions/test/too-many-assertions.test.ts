import { describe, it, expect } from 'vitest';
import { tooManyAssertionsRule } from './too-many-assertions.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('test/too-many-assertions', () => {
  it('flags test with >5 assertions', async () => {
    const file = categorizeFile('violations/test/too-many-assertions.spec.ts');
    const findings = await tooManyAssertionsRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings[0]!.rule_id).toBe('test/too-many-assertions');
  });

  it('passes test with few assertions', async () => {
    const file = categorizeFile('valid/test/real-spec.spec.ts');
    const findings = await tooManyAssertionsRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
