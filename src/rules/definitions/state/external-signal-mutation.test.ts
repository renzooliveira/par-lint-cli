import { describe, it, expect } from 'vitest';
import { externalSignalMutationRule } from './external-signal-mutation.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');

describe('state/external-signal-mutation', () => {
  const config = parLintConfigSchema.parse({ project: { name: 'test' } });

  it('detects signal mutation from outside owner', async () => {
    const file = categorizeFile('violations/external-signal-mutation.component.ts');
    const findings = await externalSignalMutationRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings[0]!.rule_id).toBe('state/external-signal-mutation');
    expect(findings[0]!.severity).toBe('error');
  });

  it('does not flag Map.set or Set.add', async () => {
    const file = categorizeFile('valid/map-set-usage.component.ts');
    const findings = await externalSignalMutationRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });

  it('ignores files matching ignore patterns (store, state)', async () => {
    const file = categorizeFile('valid/task.store.ts');
    const findings = await externalSignalMutationRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
