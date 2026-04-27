import { describe, it, expect } from 'vitest';
import { wildcardNotLastRule } from './wildcard-not-last.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('routing/wildcard-not-last', () => {
  it('detects ** not as last route', async () => {
    const file = categorizeFile('violations/routing/wildcard-not-last.routes.ts');
    const findings = await wildcardNotLastRule.run(file, config, FIXTURES);

    expect(findings.length).toBe(1);
    expect(findings[0]!.severity).toBe('error');
  });

  it('does not flag ** as last route', async () => {
    const file = categorizeFile('valid/routing/wildcard-last.routes.ts');
    const findings = await wildcardNotLastRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
