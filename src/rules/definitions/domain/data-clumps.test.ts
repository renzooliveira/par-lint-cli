import { describe, it, expect, vi } from 'vitest';
import { dataClumpsRule } from './data-clumps.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import type { CategorizedFile } from '../../../discovery/categorizer.js';

vi.mock('../../../adapters/ast-grep.js', () => ({
  readSource: vi.fn(),
}));

import { readSource } from '../../../adapters/ast-grep.js';
const mockedRead = vi.mocked(readSource);

const config = parLintConfigSchema.parse({ project: { name: 'test' } });
const file: CategorizedFile = { path: 'src/app/order.service.ts', tags: ['is_typescript'] };

describe('domain/data-clumps', () => {
  it('detects same 3 params in 2 functions', async () => {
    mockedRead.mockResolvedValue(`
function createOrder(userId: string, productId: string, quantity: number) {}
function updateOrder(userId: string, productId: string, quantity: number) {}
`);
    const findings = await dataClumpsRule.run(file, config, '/tmp');
    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings[0]!.message).toContain('createOrder');
    expect(findings[0]!.message).toContain('updateOrder');
  });

  it('detects clumps in class methods', async () => {
    mockedRead.mockResolvedValue(`
class OrderService {
  create(name: string, email: string, phone: string) {}
  update(name: string, email: string, phone: string) {}
}
`);
    const findings = await dataClumpsRule.run(file, config, '/tmp');
    expect(findings.length).toBeGreaterThanOrEqual(1);
  });

  it('ignores functions with fewer than 3 shared params', async () => {
    mockedRead.mockResolvedValue(`
function create(userId: string, name: string) {}
function update(userId: string, name: string) {}
`);
    const findings = await dataClumpsRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('ignores single occurrence', async () => {
    mockedRead.mockResolvedValue(`
function create(userId: string, productId: string, quantity: number) {}
function unrelated(a: number, b: number, c: number) {}
`);
    const findings = await dataClumpsRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });
});
