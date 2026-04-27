import { describe, it, expect } from 'vitest';
import { effectWithoutCleanupRule } from './effect-without-cleanup.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('signals/effect-without-cleanup', () => {
  it('flags effect with addEventListener/setTimeout without onCleanup', async () => {
    const file = categorizeFile('violations/signals/effect-without-cleanup.component.ts');
    const findings = await effectWithoutCleanupRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings[0]!.rule_id).toBe('signals/effect-without-cleanup');
  });

  it('passes effect with onCleanup', async () => {
    const file = categorizeFile('valid/signals/effect-with-cleanup.component.ts');
    const findings = await effectWithoutCleanupRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
