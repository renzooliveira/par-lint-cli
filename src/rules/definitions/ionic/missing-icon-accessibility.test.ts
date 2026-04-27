import { describe, it, expect } from 'vitest';
import { missingIconAccessibilityRule } from './missing-icon-accessibility.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('ionic/missing-icon-accessibility', () => {
  it('detects ion-icon without aria attributes', async () => {
    const file = categorizeFile('violations/ionic/missing-icon-a11y.component.html');
    const findings = await missingIconAccessibilityRule.run(file, config, FIXTURES);

    expect(findings.length).toBe(2);
  });

  it('does not flag icons with aria attributes', async () => {
    const file = categorizeFile('valid/ionic/icon-with-a11y.component.html');
    const findings = await missingIconAccessibilityRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
