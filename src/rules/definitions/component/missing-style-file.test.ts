import { describe, it, expect } from 'vitest';
import { missingStyleFileRule } from './missing-style-file.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');

describe('component/missing-style-file', () => {
  const config = parLintConfigSchema.parse({ project: { name: 'test' } });

  it('detects component with .ts + .html but no .scss', async () => {
    const file = categorizeFile('violations/no-style-file.component.ts');
    const findings = await missingStyleFileRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(1);
    expect(findings[0]!.rule_id).toBe('component/missing-style-file');
    expect(findings[0]!.message).toContain('no-style-file');
  });

  it('passes when .scss exists', async () => {
    const file = categorizeFile('valid/clean.component.ts');
    const findings = await missingStyleFileRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
