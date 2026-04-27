import { describe, it, expect, vi } from 'vitest';
import { structuralCloneRule } from './structural-clone.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import type { CategorizedFile } from '../../../discovery/categorizer.js';

vi.mock('../../../adapters/ast-grep.js', () => ({
  readSource: vi.fn(),
}));

import { readSource } from '../../../adapters/ast-grep.js';
const mockedRead = vi.mocked(readSource);

const config = parLintConfigSchema.parse({ project: { name: 'test' } });
const file: CategorizedFile = { path: 'src/app/order.service.ts', tags: ['is_typescript'] };

describe('duplication/structural-clone', () => {
  it('detects structurally identical methods', async () => {
    mockedRead.mockResolvedValue(`
class Service {
  getUsers() {
    const data = this.http.get('/api/users');
    const mapped = data.pipe(map(x => x));
    return mapped;
  }
  getOrders() {
    const data = this.http.get('/api/orders');
    const mapped = data.pipe(map(x => x));
    return mapped;
  }
}
`);
    const findings = await structuralCloneRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(1);
    expect(findings[0]!.message).toContain('getUsers');
    expect(findings[0]!.message).toContain('getOrders');
  });

  it('ignores methods with different structure', async () => {
    mockedRead.mockResolvedValue(`
class Service {
  getUsers() {
    return this.http.get('/api/users');
  }
  createOrder(data: Order) {
    this.validate(data);
    return this.http.post('/api/orders', data);
  }
}
`);
    const findings = await structuralCloneRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('ignores short methods', async () => {
    mockedRead.mockResolvedValue(`
class Service {
  getA() {
    return 1;
  }
  getB() {
    return 2;
  }
}
`);
    const findings = await structuralCloneRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });
});
