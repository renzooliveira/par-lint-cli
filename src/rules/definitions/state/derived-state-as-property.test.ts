import { describe, it, expect } from 'vitest';
import { derivedStateAsPropertyRule } from './derived-state-as-property.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');

describe('state/derived-state-as-property', () => {
  it('detects multiple derived assignments in ngOnInit', async () => {
    const config = parLintConfigSchema.parse({ project: { name: 'test' } });
    const file = categorizeFile('violations/derived-state.component.ts');
    const findings = await derivedStateAsPropertyRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(1);
    expect(findings[0]!.rule_id).toBe('state/derived-state-as-property');
    expect(findings[0]!.message).toContain('computed()');
  });

  it('does not flag component without ngOnInit assignments', async () => {
    const config = parLintConfigSchema.parse({ project: { name: 'test' } });
    const file = categorizeFile('valid/clean.component.ts');
    const findings = await derivedStateAsPropertyRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
