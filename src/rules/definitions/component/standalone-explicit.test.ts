import { describe, it, expect } from 'vitest';
import { standaloneExplicitRule } from './standalone-explicit.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('component/standalone-explicit', () => {
  it('detects standalone: true', async () => {
    const file = categorizeFile('violations/component/standalone-explicit.component.ts');
    const findings = await standaloneExplicitRule.run(file, config, FIXTURES);

    expect(findings.length).toBe(1);
    expect(findings[0]!.message).toContain('Angular 19');
  });

  it('does not flag component without standalone: true', async () => {
    const file = categorizeFile('valid/clean.component.ts');
    const findings = await standaloneExplicitRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
