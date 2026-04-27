import { describe, it, expect } from 'vitest';
import { constructorInjectionRule } from './constructor-injection.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('component/constructor-injection', () => {
  it('detects constructor DI in component', async () => {
    const file = categorizeFile('violations/constructor-injection.component.ts');
    const findings = await constructorInjectionRule.run(file, config, FIXTURES);

    expect(findings.length).toBe(1);
    expect(findings[0]!.rule_id).toBe('component/constructor-injection');
    expect(findings[0]!.message).toContain('inject()');
  });

  it('does not flag component using inject()', async () => {
    const file = categorizeFile('valid/clean.component.ts');
    const findings = await constructorInjectionRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
