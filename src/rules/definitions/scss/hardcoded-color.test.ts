import { describe, it, expect } from 'vitest';
import { hardcodedColorRule } from './hardcoded-color.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('scss/hardcoded-color', () => {
  it('detects hex, rgb, hsl colors', async () => {
    const file = categorizeFile('violations/hardcoded-colors.component.scss');
    const findings = await hardcodedColorRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(3);
    expect(findings.some((f) => f.message.includes('#ff0000'))).toBe(true);
    expect(findings.some((f) => f.message.includes('rgb'))).toBe(true);
    expect(findings[0]!.rule_id).toBe('scss/hardcoded-color');
  });

  it('does not flag variable-based colors', async () => {
    const file = categorizeFile('valid/clean.component.scss');
    const findings = await hardcodedColorRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
