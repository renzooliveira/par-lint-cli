import { describe, it, expect } from 'vitest';
import { duplicateAttributeRule } from './duplicate-attribute.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');

describe('template/duplicate-attribute', () => {
  const config = parLintConfigSchema.parse({ project: { name: 'test' } });

  it('detects duplicate attributes on elements', async () => {
    const file = categorizeFile('violations/template/duplicate-attribute.component.html');
    const findings = await duplicateAttributeRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(2);
    expect(findings[0]!.message).toContain('class');
    expect(findings[1]!.message).toContain('id');
  });

  it('passes for unique attributes', async () => {
    const file = categorizeFile('valid/template/clean-buttons.component.html');
    const findings = await duplicateAttributeRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
