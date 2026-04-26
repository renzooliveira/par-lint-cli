import { describe, it, expect } from 'vitest';
import { inlineStylesRule } from './inline-styles.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');

describe('component/inline-styles', () => {
  it('detects inline style attributes', async () => {
    const config = parLintConfigSchema.parse({ project: { name: 'test' } });
    const file = categorizeFile('violations/inline-styles.component.html');
    const findings = await inlineStylesRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(2);
    expect(findings[0]!.rule_id).toBe('component/inline-styles');
  });

  it('does not flag clean template', async () => {
    const config = parLintConfigSchema.parse({ project: { name: 'test' } });
    const file = categorizeFile('valid/clean.component.html');
    const findings = await inlineStylesRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
