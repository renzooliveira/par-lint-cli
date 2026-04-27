import { describe, it, expect } from 'vitest';
import { fontDisplayMissingRule } from './font-display-missing.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('perf/font-display-missing', () => {
  it('flags @font-face without font-display', async () => {
    const file = categorizeFile('violations/perf/font-no-display.scss');
    const findings = await fontDisplayMissingRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(2);
    expect(findings[0]!.rule_id).toBe('perf/font-display-missing');
  });

  it('passes @font-face with font-display', async () => {
    const file = categorizeFile('valid/perf/font-with-display.scss');
    const findings = await fontDisplayMissingRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
