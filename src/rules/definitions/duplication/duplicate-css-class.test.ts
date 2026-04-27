import { describe, it, expect } from 'vitest';
import { duplicateCssClassRule } from './duplicate-css-class.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('duplication/duplicate-css-class', () => {
  it('flags CSS classes duplicated across SCSS files', async () => {
    const file = categorizeFile('violations/duplication/dup-class-a.component.scss');
    const findings = await duplicateCssClassRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(2);
    expect(findings[0]!.rule_id).toBe('duplication/duplicate-css-class');
  });

  it('passes unique CSS classes', async () => {
    const file = categorizeFile('valid/duplication/unique-class.component.scss');
    const findings = await duplicateCssClassRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
