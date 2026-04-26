import { describe, it, expect } from 'vitest';
import { noExplicitAnyRule } from './no-explicit-any.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');

describe('component/no-explicit-any', () => {
  it('detects explicit any types', async () => {
    const config = parLintConfigSchema.parse({ project: { name: 'test' } });
    const file = categorizeFile('violations/explicit-any.component.ts');
    const findings = await noExplicitAnyRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings[0]!.rule_id).toBe('component/no-explicit-any');
  });

  it('does not flag clean component', async () => {
    const config = parLintConfigSchema.parse({ project: { name: 'test' } });
    const file = categorizeFile('valid/clean.component.ts');
    const findings = await noExplicitAnyRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
