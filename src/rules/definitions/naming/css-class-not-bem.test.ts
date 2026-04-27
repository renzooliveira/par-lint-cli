import { describe, it, expect } from 'vitest';
import { cssClassNotBemRule } from './css-class-not-bem.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('naming/css-class-not-bem', () => {
  it('flags non-BEM class names', async () => {
    const file = categorizeFile('violations/naming/bad-bem.component.scss');
    const findings = await cssClassNotBemRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(3);
    expect(findings[0]!.rule_id).toBe('naming/css-class-not-bem');
  });

  it('passes correct BEM names', async () => {
    const file = categorizeFile('valid/naming/correct-bem.component.scss');
    const findings = await cssClassNotBemRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
