import { describe, it, expect } from 'vitest';
import { computedSideEffectRule } from './computed-side-effect.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('signals/computed-side-effect', () => {
  it('flags side effects inside computed()', async () => {
    const file = categorizeFile('violations/signals/computed-side-effect.component.ts');
    const findings = await computedSideEffectRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings[0]!.rule_id).toBe('signals/computed-side-effect');
  });

  it('passes pure computed', async () => {
    const file = categorizeFile('valid/signals/pure-computed.component.ts');
    const findings = await computedSideEffectRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
