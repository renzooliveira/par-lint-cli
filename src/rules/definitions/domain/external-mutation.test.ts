import { describe, it, expect } from 'vitest';
import { externalMutationRule } from './external-mutation.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');

describe('domain/external-mutation', () => {
  it('detects multiple direct property mutations on same object', async () => {
    const config = parLintConfigSchema.parse({ project: { name: 'test' } });
    const file = categorizeFile('violations/external-mutation.service.ts');
    const findings = await externalMutationRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings[0]!.rule_id).toBe('domain/external-mutation');
    expect(findings[0]!.severity).toBe('error');
  });

  it('does not flag clean component', async () => {
    const config = parLintConfigSchema.parse({ project: { name: 'test' } });
    const file = categorizeFile('valid/clean.component.ts');
    const findings = await externalMutationRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
