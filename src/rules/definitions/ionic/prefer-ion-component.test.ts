import { describe, it, expect } from 'vitest';
import { preferIonComponentRule } from './prefer-ion-component.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('ionic/prefer-ion-component', () => {
  it('detects native select, textarea, range in Ionic template', async () => {
    const file = categorizeFile('violations/ionic/prefer-ion-component.component.html');
    const findings = await preferIonComponentRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(2);
    expect(findings.some((f) => f.message.includes('ion-select'))).toBe(true);
    expect(findings.some((f) => f.message.includes('ion-textarea'))).toBe(true);
  });

  it('does not flag proper Ionic components', async () => {
    const file = categorizeFile('valid/ionic/ion-components.component.html');
    const findings = await preferIonComponentRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
