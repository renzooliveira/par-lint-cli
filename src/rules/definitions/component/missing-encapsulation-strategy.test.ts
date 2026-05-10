import { describe, it, expect } from 'vitest';
import { missingEncapsulationStrategyRule } from './missing-encapsulation-strategy.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');

describe('component/missing-encapsulation-strategy', () => {
  const config = parLintConfigSchema.parse({ project: { name: 'test' } });

  it('detects @Component without encapsulation', async () => {
    const file = categorizeFile('violations/no-encapsulation.component.ts');
    const findings = await missingEncapsulationStrategyRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(1);
    expect(findings[0]!.rule_id).toBe('component/missing-encapsulation-strategy');
    expect(findings[0]!.message).toContain('encapsulation');
  });

  it('passes when encapsulation is set', async () => {
    const file = categorizeFile('valid/with-encapsulation.component.ts');
    const findings = await missingEncapsulationStrategyRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
