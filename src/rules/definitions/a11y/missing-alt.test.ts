import { describe, it, expect } from 'vitest';
import { missingAltRule } from './missing-alt.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('a11y/missing-alt', () => {
  it('detects img tags without alt', async () => {
    const file = categorizeFile('violations/missing-a11y.component.html');
    const findings = await missingAltRule.run(file, config, FIXTURES);

    expect(findings.length).toBe(2);
    expect(findings[0]!.rule_id).toBe('a11y/missing-alt');
    expect(findings[0]!.message).toContain('missing alt');
  });

  it('does not flag img with alt', async () => {
    const file = categorizeFile('valid/clean.component.html');
    const findings = await missingAltRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
