import { describe, it, expect } from 'vitest';
import { deadCodeAfterReturnRule } from './dead-code-after-return.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('hygiene/dead-code-after-return', () => {
  it('flags code after return/throw', async () => {
    const file = categorizeFile('violations/hygiene/dead-code.service.ts');
    const findings = await deadCodeAfterReturnRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(2);
    expect(findings[0]!.rule_id).toBe('hygiene/dead-code-after-return');
  });

  it('passes clean code', async () => {
    const file = categorizeFile('valid/hygiene/no-dead-code.service.ts');
    const findings = await deadCodeAfterReturnRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
