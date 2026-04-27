import { describe, it, expect, vi } from 'vitest';
import { hardcodedSecretRule } from './hardcoded-secret.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import type { CategorizedFile } from '../../../discovery/categorizer.js';

vi.mock('../../../adapters/ast-grep.js', () => ({
  readSource: vi.fn(),
}));

import { readSource } from '../../../adapters/ast-grep.js';
const mockedRead = vi.mocked(readSource);

const config = parLintConfigSchema.parse({ project: { name: 'test' } });
const file: CategorizedFile = { path: 'src/app/api.service.ts', tags: ['is_typescript'] };

describe('security/hardcoded-secret', () => {
  it('detects hardcoded API key', async () => {
    mockedRead.mockResolvedValue(`
const apiKey = 'sk-1234567890abcdef';
`);
    const findings = await hardcodedSecretRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(1);
    expect(findings[0]!.severity).toBe('error');
    expect(findings[0]!.message).toContain('apiKey');
  });

  it('detects hardcoded password', async () => {
    mockedRead.mockResolvedValue(`
const password = "supersecret123";
`);
    const findings = await hardcodedSecretRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(1);
  });

  it('detects hardcoded token', async () => {
    mockedRead.mockResolvedValue(`
const authToken = 'eyJhbGciOiJIUzI1NiJ9.test';
`);
    const findings = await hardcodedSecretRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(1);
  });

  it('ignores environment variable usage', async () => {
    mockedRead.mockResolvedValue(`
const apiKey = process.env.API_KEY;
const token = import.meta.env.VITE_TOKEN;
const secret = environment.secret;
`);
    const findings = await hardcodedSecretRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('ignores short values (likely not real secrets)', async () => {
    mockedRead.mockResolvedValue(`
const token = 'test';
`);
    const findings = await hardcodedSecretRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('skips environment files', async () => {
    const envFile: CategorizedFile = { path: 'src/environments/environment.ts', tags: ['is_typescript'] };
    const findings = await hardcodedSecretRule.run(envFile, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('skips test files', async () => {
    const testFile: CategorizedFile = { path: 'src/app/api.spec.ts', tags: ['is_typescript'] };
    const findings = await hardcodedSecretRule.run(testFile, config, '/tmp');
    expect(findings).toHaveLength(0);
  });
});
