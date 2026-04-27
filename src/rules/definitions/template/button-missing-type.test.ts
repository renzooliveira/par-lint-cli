import { describe, it, expect } from 'vitest';
import { buttonMissingTypeRule } from './button-missing-type.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');

describe('template/button-missing-type', () => {
  const config = parLintConfigSchema.parse({ project: { name: 'test' } });

  it('detects buttons without type attribute', async () => {
    const file = categorizeFile('violations/template/button-missing-type.component.html');
    const findings = await buttonMissingTypeRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(2);
    expect(findings[0]!.rule_id).toBe('template/button-missing-type');
    expect(findings[0]!.message).toContain('type');
  });

  it('passes when all buttons have type', async () => {
    const file = categorizeFile('valid/template/clean-buttons.component.html');
    const findings = await buttonMissingTypeRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
