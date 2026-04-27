import { describe, it, expect } from 'vitest';
import { selectorPrefixMismatchRule } from './selector-prefix-mismatch.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');

describe('component/selector-prefix-mismatch', () => {
  it('detects selector without app- prefix', async () => {
    const config = parLintConfigSchema.parse({ project: { name: 'test' } });
    const file = categorizeFile('violations/wrong-prefix.component.ts');
    const findings = await selectorPrefixMismatchRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(1);
    expect(findings[0]!.rule_id).toBe('component/selector-prefix-mismatch');
    expect(findings[0]!.message).toContain('xyz-wrong-prefix');
  });

  it('passes for correct prefix', async () => {
    const config = parLintConfigSchema.parse({ project: { name: 'test' } });
    const file = categorizeFile('valid/clean.component.ts');
    const findings = await selectorPrefixMismatchRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });

  it('respects custom prefix option', async () => {
    const config = parLintConfigSchema.parse({
      project: { name: 'test' },
      rules: { 'component/selector-prefix-mismatch': { enabled: true, options: { prefix: 'xyz' } } },
    });
    const file = categorizeFile('violations/wrong-prefix.component.ts');
    const findings = await selectorPrefixMismatchRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
