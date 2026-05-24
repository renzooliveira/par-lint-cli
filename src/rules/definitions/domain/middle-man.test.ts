import { describe, it, expect, vi } from 'vitest';
import { middleManRule } from './middle-man.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import type { CategorizedFile } from '../../../discovery/categorizer.js';

vi.mock('../../../adapters/ast-grep.js', () => ({
  readSource: vi.fn(),
}));

import { readSource } from '../../../adapters/ast-grep.js';
const mockedRead = vi.mocked(readSource);

const config = parLintConfigSchema.parse({ project: { name: 'test' } });
const file: CategorizedFile = { path: 'src/app/order.facade.ts', tags: ['is_typescript'] };

describe('domain/middle-man', () => {
  it('detects class where all methods delegate', async () => {
    mockedRead.mockResolvedValue(`
class OrderFacade {
  constructor(private svc: OrderService) {}
  getAll() {
    return this.svc.getAll();
  }
  getById(id: string) {
    return this.svc.getById(id);
  }
  create(data: any) {
    return this.svc.create(data);
  }
  delete(id: string) {
    return this.svc.delete(id);
  }
}
`);
    const findings = await middleManRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(1);
    expect(findings[0]!.message).toContain('OrderFacade');
    expect(findings[0]!.message).toContain('4/4');
  });

  it('ignores class with real logic', async () => {
    mockedRead.mockResolvedValue(`
class OrderService {
  constructor(private repo: OrderRepo) {}
  getAll() {
    return this.repo.getAll();
  }
  create(data: CreateOrderDto) {
    const validated = this.validate(data);
    const order = new Order(validated);
    return this.repo.save(order);
  }
  update(id: string, data: UpdateOrderDto) {
    const existing = this.repo.getById(id);
    existing.apply(data);
    return this.repo.save(existing);
  }
}
`);
    const findings = await middleManRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('ignores class with fewer than 3 methods', async () => {
    mockedRead.mockResolvedValue(`
class SmallFacade {
  constructor(private svc: Service) {}
  doA() {
    return this.svc.doA();
  }
  doB() {
    return this.svc.doB();
  }
}
`);
    const findings = await middleManRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });
});
