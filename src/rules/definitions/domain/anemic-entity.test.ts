import { describe, it, expect } from 'vitest';
import { anemicEntityRule } from './anemic-entity.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');

describe('domain/anemic-entity', () => {
  it('detects entity with many properties and no methods', async () => {
    const config = parLintConfigSchema.parse({ project: { name: 'test' } });
    const file = categorizeFile('violations/anemic-entity.model.ts');
    const findings = await anemicEntityRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(1);
    expect(findings[0]!.rule_id).toBe('domain/anemic-entity');
    expect(findings[0]!.message).toContain('UserEntity');
  });

  it('does not flag non-entity files', async () => {
    const config = parLintConfigSchema.parse({ project: { name: 'test' } });
    const file = categorizeFile('valid/clean.component.ts');
    const findings = await anemicEntityRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
