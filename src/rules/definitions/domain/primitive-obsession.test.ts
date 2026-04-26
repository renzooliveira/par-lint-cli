import { describe, it, expect } from 'vitest';
import { primitiveObsessionRule } from './primitive-obsession.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');

describe('domain/primitive-obsession', () => {
  it('flags function with 4+ primitive params', async () => {
    const config = parLintConfigSchema.parse({ project: { name: 'test' } });
    const file = categorizeFile('violations/primitive-obsession.service.ts');
    const findings = await primitiveObsessionRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(1);
    expect(findings[0]!.rule_id).toBe('domain/primitive-obsession');
    expect(findings[0]!.message).toContain('5 primitive');
  });

  it('passes for clean component', async () => {
    const config = parLintConfigSchema.parse({ project: { name: 'test' } });
    const file = categorizeFile('valid/clean.component.ts');
    const findings = await primitiveObsessionRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
