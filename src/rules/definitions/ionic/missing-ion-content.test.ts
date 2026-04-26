import { describe, it, expect } from 'vitest';
import { missingIonContentRule } from './missing-ion-content.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');

describe('ionic/missing-ion-content', () => {
  it('detects page without ion-content', async () => {
    const config = parLintConfigSchema.parse({ project: { name: 'test' } });
    const file = categorizeFile('violations/missing-ion-content.page.html');
    const findings = await missingIonContentRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(1);
    expect(findings[0]!.rule_id).toBe('ionic/missing-ion-content');
  });

  it('skips non-page templates', async () => {
    const config = parLintConfigSchema.parse({ project: { name: 'test' } });
    const file = categorizeFile('valid/clean.component.html');
    const findings = await missingIonContentRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
