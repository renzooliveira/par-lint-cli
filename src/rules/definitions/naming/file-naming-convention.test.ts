import { describe, it, expect } from 'vitest';
import { fileNamingConventionRule } from './file-naming-convention.js';
import { categorizeFile } from '../../../discovery/categorizer.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import path from 'node:path';

const FIXTURES = path.resolve(import.meta.dirname, '../../../../fixtures');
const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('naming/file-naming-convention', () => {
  it('flags non-kebab-case filename', async () => {
    const file = categorizeFile('violations/naming/UserList.component.ts');
    const findings = await fileNamingConventionRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings[0]!.rule_id).toBe('naming/file-naming-convention');
    expect(findings[0]!.message).toContain('kebab-case');
  });

  it('flags missing type suffix in filename', async () => {
    const file = categorizeFile('violations/naming/userService.ts');
    const findings = await fileNamingConventionRule.run(file, config, FIXTURES);

    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings[0]!.message).toContain('kebab-case');
  });

  it('passes clean kebab-case filename', async () => {
    const file = categorizeFile('valid/naming/user-list.component.ts');
    const findings = await fileNamingConventionRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });

  it('passes service with correct naming', async () => {
    const file = categorizeFile('valid/naming/user.service.ts');
    const findings = await fileNamingConventionRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });

  it('skips non-ts files', async () => {
    const file = categorizeFile('some-file.html');
    const findings = await fileNamingConventionRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });

  it('skips index.ts', async () => {
    const file = categorizeFile('some-feature/index.ts');
    const findings = await fileNamingConventionRule.run(file, config, FIXTURES);

    expect(findings).toHaveLength(0);
  });
});
