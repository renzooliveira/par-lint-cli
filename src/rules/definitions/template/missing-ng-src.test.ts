import { describe, it, expect } from 'vitest';
import { missingNgSrcRule } from './missing-ng-src.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');

describe('template/missing-ngSrc', () => {
  const config = parLintConfigSchema.parse({ project: { name: 'test' } });

  it('detects <img src> without ngSrc', async () => {
    const file = categorizeFile('violations/template/missing-ngsrc.component.html');
    const findings = await missingNgSrcRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(2);
    expect(findings[0]!.rule_id).toBe('template/missing-ngSrc');
    expect(findings[0]!.message).toContain('ngSrc');
  });

  it('passes when ngSrc is used', async () => {
    const file = categorizeFile('valid/template/ngsrc-only.component.html');
    const findings = await missingNgSrcRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
