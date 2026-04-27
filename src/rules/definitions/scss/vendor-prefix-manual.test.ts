import { describe, it, expect } from 'vitest';
import { vendorPrefixManualRule } from './vendor-prefix-manual.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('scss/vendor-prefix-manual', () => {
  it('detects vendor prefixes', async () => {
    const file = categorizeFile('violations/scss/vendor-prefix.component.scss');
    const findings = await vendorPrefixManualRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(3);
  });

  it('does not flag clean scss', async () => {
    const file = categorizeFile('valid/scss/no-vendor-prefix.component.scss');
    const findings = await vendorPrefixManualRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
