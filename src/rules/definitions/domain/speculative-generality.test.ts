import { describe, it, expect, vi } from 'vitest';
import { speculativeGeneralityRule } from './speculative-generality.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import type { CategorizedFile } from '../../../discovery/categorizer.js';

vi.mock('../../../adapters/ast-grep.js', () => ({
  readSource: vi.fn(),
}));

import { readSource } from '../../../adapters/ast-grep.js';
const mockedRead = vi.mocked(readSource);

const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('domain/speculative-generality', () => {
  it('detects optional parameters never used', async () => {
    const file: CategorizedFile = { path: 'src/app/services/user.service.ts', tags: ['is_typescript'] };
    mockedRead.mockResolvedValue(`
export function getUsers(filter?: string, page?: number, includeDeleted?: boolean) {
  return this.http.get('/users');
}
`);
    const findings = await speculativeGeneralityRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(1);
    expect(findings[0]!.message).toContain('optional');
  });

  it('detects generic type always used with same concrete type', async () => {
    const file: CategorizedFile = { path: 'src/app/services/cache.service.ts', tags: ['is_typescript'] };
    mockedRead.mockResolvedValue(`
export class CacheService<T> {
  private data: T[] = [];
  get(): T[] { return this.data; }
}

const userCache = new CacheService<string>();
const nameCache = new CacheService<string>();
const tagCache = new CacheService<string>();
`);
    const findings = await speculativeGeneralityRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(1);
    expect(findings[0]!.message).toContain('string');
  });

  it('ignores optional params that are used in body', async () => {
    const file: CategorizedFile = { path: 'src/app/services/user.service.ts', tags: ['is_typescript'] };
    mockedRead.mockResolvedValue(`
export function getUsers(filter?: string) {
  if (filter) {
    return this.http.get('/users?filter=' + filter);
  }
  return this.http.get('/users');
}
`);
    const findings = await speculativeGeneralityRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('ignores generic used with multiple concrete types', async () => {
    const file: CategorizedFile = { path: 'src/app/services/cache.service.ts', tags: ['is_typescript'] };
    mockedRead.mockResolvedValue(`
export class CacheService<T> {
  private data: T[] = [];
}

const userCache = new CacheService<User>();
const orderCache = new CacheService<Order>();
`);
    const findings = await speculativeGeneralityRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('ignores spec/test files', async () => {
    const file: CategorizedFile = { path: 'src/app/services/user.spec.ts', tags: ['is_typescript'] };
    mockedRead.mockResolvedValue(`
export function helper(opt?: string) {
  return 'test';
}
`);
    const findings = await speculativeGeneralityRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });
});
