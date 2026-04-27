import { describe, it, expect } from 'vitest';
import { noImportantRule } from './no-important.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('scss/no-important', () => {
  it('detects !important usage', async () => {
    const file = categorizeFile('violations/scss/no-important.component.scss');
    const findings = await noImportantRule.run(file, config, FIXTURES);

    expect(findings.length).toBe(3);
    expect(findings[0]!.message).toContain('!important');
  });

  it('does not flag clean SCSS', async () => {
    const file = categorizeFile('valid/scss/no-important.component.scss');
    const findings = await noImportantRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
