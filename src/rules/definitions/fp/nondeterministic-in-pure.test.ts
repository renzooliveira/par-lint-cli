import { describe, it, expect } from 'vitest';
import { nondeterministicInPureRule } from './nondeterministic-in-pure.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('fp/nondeterministic-in-pure', () => {
  it('detects Math.random/Date.now in exported functions', async () => {
    const file = categorizeFile('violations/fp/nondeterministic.service.ts');
    const findings = await nondeterministicInPureRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(2);
  });

  it('does not flag injected dependencies', async () => {
    const file = categorizeFile('valid/fp/deterministic.service.ts');
    const findings = await nondeterministicInPureRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
