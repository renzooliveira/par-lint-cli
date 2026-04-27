import { describe, it, expect } from 'vitest';
import { hardcodedPxFontRule } from './hardcoded-px-font.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('responsive/hardcoded-px-font', () => {
  it('flags font-size in px', async () => {
    const file = categorizeFile('violations/responsive/px-font.component.scss');
    const findings = await hardcodedPxFontRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(3);
    expect(findings[0]!.rule_id).toBe('responsive/hardcoded-px-font');
  });

  it('passes font-size in rem/em', async () => {
    const file = categorizeFile('valid/responsive/rem-font.component.scss');
    const findings = await hardcodedPxFontRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });

  it('skips ion-icon contexts (glyphs use px intentionally)', async () => {
    const file = categorizeFile('valid/responsive/icon-px-font.component.scss');
    const findings = await hardcodedPxFontRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
