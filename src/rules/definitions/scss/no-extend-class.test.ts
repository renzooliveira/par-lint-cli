import { describe, it, expect } from 'vitest';
import { noExtendClassRule } from './no-extend-class.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('scss/no-extend-class', () => {
  it('detects @extend .class', async () => {
    const file = categorizeFile('violations/scss/extend-class.component.scss');
    const findings = await noExtendClassRule.run(file, config, FIXTURES);

    expect(findings.length).toBe(2);
  });

  it('does not flag @extend %placeholder', async () => {
    const file = categorizeFile('valid/scss/extend-placeholder.component.scss');
    const findings = await noExtendClassRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
