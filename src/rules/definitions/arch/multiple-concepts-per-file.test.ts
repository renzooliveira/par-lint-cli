import { describe, it, expect, vi } from 'vitest';
import { multipleConceptsPerFileRule } from './multiple-concepts-per-file.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import type { CategorizedFile } from '../../../discovery/categorizer.js';

vi.mock('../../../adapters/ast-grep.js', () => ({
  readSource: vi.fn(),
}));

import { readSource } from '../../../adapters/ast-grep.js';
const mockedRead = vi.mocked(readSource);

const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('arch/multiple-concepts-per-file', () => {
  it('detects file exporting multiple unrelated domain types', async () => {
    const file: CategorizedFile = { path: 'src/app/shared/models.ts', tags: ['is_typescript'] };
    mockedRead.mockResolvedValue(`
export interface User {
  id: string;
  name: string;
}

export interface Order {
  id: string;
  total: number;
}

export interface Product {
  id: string;
  price: number;
}
`);
    const findings = await multipleConceptsPerFileRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(1);
    expect(findings[0]!.message).toContain('3');
  });

  it('ignores file with single export', async () => {
    const file: CategorizedFile = { path: 'src/app/models/user.model.ts', tags: ['is_typescript'] };
    mockedRead.mockResolvedValue(`
export interface User {
  id: string;
  name: string;
}
`);
    const findings = await multipleConceptsPerFileRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('ignores index/barrel files', async () => {
    const file: CategorizedFile = { path: 'src/app/models/index.ts', tags: ['is_typescript'] };
    mockedRead.mockResolvedValue(`
export { User } from './user.model';
export { Order } from './order.model';
export { Product } from './product.model';
`);
    const findings = await multipleConceptsPerFileRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('ignores related types (one uses the other)', async () => {
    const file: CategorizedFile = { path: 'src/app/models/user.model.ts', tags: ['is_typescript'] };
    mockedRead.mockResolvedValue(`
export interface User {
  id: string;
  address: UserAddress;
}

export interface UserAddress {
  street: string;
  city: string;
}
`);
    const findings = await multipleConceptsPerFileRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('ignores enum + type in same concept', async () => {
    const file: CategorizedFile = { path: 'src/app/models/order.model.ts', tags: ['is_typescript'] };
    mockedRead.mockResolvedValue(`
export enum OrderStatus {
  DRAFT = 'draft',
  CONFIRMED = 'confirmed',
}

export interface Order {
  id: string;
  status: OrderStatus;
}
`);
    const findings = await multipleConceptsPerFileRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('ignores spec/test files', async () => {
    const file: CategorizedFile = { path: 'src/app/models.spec.ts', tags: ['is_typescript'] };
    mockedRead.mockResolvedValue(`
export interface MockUser { id: string; }
export interface MockOrder { id: string; }
export interface MockProduct { id: string; }
`);
    const findings = await multipleConceptsPerFileRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });
});
