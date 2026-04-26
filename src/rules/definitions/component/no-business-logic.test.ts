import { describe, it, expect } from 'vitest';
import { noBusinessLogicRule } from './no-business-logic.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');

describe('component/no-business-logic', () => {
  it('detects excessive branching in component', async () => {
    const config = parLintConfigSchema.parse({ project: { name: 'test' } });
    const file = categorizeFile('violations/business-logic.component.ts');
    const findings = await noBusinessLogicRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings[0]!.rule_id).toBe('component/no-business-logic');
    expect(findings[0]!.message).toContain('branching');
  });

  it('does not flag clean component', async () => {
    const config = parLintConfigSchema.parse({ project: { name: 'test' } });
    const file = categorizeFile('valid/clean.component.ts');
    const findings = await noBusinessLogicRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
