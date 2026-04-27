import { describe, it, expect } from 'vitest';
import { missingAsReadonlyRule } from './missing-asreadonly.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('signals/missing-asreadonly', () => {
  it('flags public writable signal without asReadonly in Injectable', async () => {
    const file = categorizeFile('violations/signals/missing-asreadonly.service.ts');
    const findings = await missingAsReadonlyRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(2);
    expect(findings[0]!.rule_id).toBe('signals/missing-asreadonly');
  });

  it('passes private signal with public asReadonly', async () => {
    const file = categorizeFile('valid/signals/with-asreadonly.service.ts');
    const findings = await missingAsReadonlyRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
