import { describe, it, expect } from 'vitest';
import { magicNumberInScssRule } from './magic-number-in-scss.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('naming/magic-number-in-scss', () => {
  it('flags magic numbers in SCSS properties', async () => {
    const file = categorizeFile('violations/naming/magic-numbers.component.scss');
    const findings = await magicNumberInScssRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(6);
    expect(findings[0]!.rule_id).toBe('naming/magic-number-in-scss');
  });

  it('passes when using variables and allowed values', async () => {
    const file = categorizeFile('valid/naming/no-magic-numbers.component.scss');
    const findings = await magicNumberInScssRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
