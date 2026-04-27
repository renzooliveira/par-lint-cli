import { describe, it, expect } from 'vitest';
import { noNgmoduleRule } from './no-ngmodule.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('component/no-ngmodule', () => {
  it('detects @NgModule usage', async () => {
    const file = categorizeFile('violations/component/ngmodule.component.ts');
    const findings = await noNgmoduleRule.run(file, config, FIXTURES);

    expect(findings.length).toBe(1);
    expect(findings[0]!.message).toContain('standalone');
  });

  it('does not flag clean component', async () => {
    const file = categorizeFile('valid/clean.component.ts');
    const findings = await noNgmoduleRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
