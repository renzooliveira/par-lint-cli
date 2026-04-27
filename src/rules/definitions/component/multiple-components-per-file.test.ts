import { describe, it, expect } from 'vitest';
import { multipleComponentsPerFileRule } from './multiple-components-per-file.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');

describe('component/multiple-components-per-file', () => {
  const config = parLintConfigSchema.parse({ project: { name: 'test' } });

  it('detects 2+ @Component decorators in same file', async () => {
    const file = categorizeFile('violations/multiple-components.component.ts');
    const findings = await multipleComponentsPerFileRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(1);
    expect(findings[0]!.rule_id).toBe('component/multiple-components-per-file');
    expect(findings[0]!.message).toContain('2 @Component');
  });

  it('passes for single component', async () => {
    const file = categorizeFile('valid/clean.component.ts');
    const findings = await multipleComponentsPerFileRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
