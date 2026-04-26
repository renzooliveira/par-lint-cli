import { describe, it, expect } from 'vitest';
import { scssFileTooLongRule } from './file-too-long.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');

describe('scss/file-too-long', () => {
  it('does not flag short scss files', async () => {
    const config = parLintConfigSchema.parse({ project: { name: 'test' } });
    const file = categorizeFile('valid/clean.component.scss');
    const findings = await scssFileTooLongRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });

  it('flags scss files exceeding maxLines', async () => {
    const config = parLintConfigSchema.parse({
      project: { name: 'test' },
      rules: { 'scss/file-too-long': { enabled: true, options: { maxLines: 5 } } },
    });

    const file = categorizeFile('violations/hardcoded-colors.component.scss');
    const findings = await scssFileTooLongRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(1);
    expect(findings[0]!.rule_id).toBe('scss/file-too-long');
    expect(findings[0]!.severity).toBe('error');
    expect(findings[0]!.message).toContain('SCSS file too long');
  });
});
