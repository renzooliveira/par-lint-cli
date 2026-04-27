import { describe, it, expect } from 'vitest';
import { noRelativeParentBeyondTwoRule } from './no-relative-parent-beyond-two.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('imports/no-relative-parent-beyond-two', () => {
  it('flags imports with 3+ ../', async () => {
    const file = categorizeFile('violations/imports/deep-relative.service.ts');
    const findings = await noRelativeParentBeyondTwoRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(2);
    expect(findings[0]!.rule_id).toBe('imports/no-relative-parent-beyond-two');
  });

  it('passes imports with <=2 ../', async () => {
    const file = categorizeFile('valid/imports/shallow-relative.service.ts');
    const findings = await noRelativeParentBeyondTwoRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
