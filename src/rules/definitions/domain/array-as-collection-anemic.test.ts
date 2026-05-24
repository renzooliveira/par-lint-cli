import { describe, it, expect, vi } from 'vitest';
import { arrayAsCollectionAnemicRule } from './array-as-collection-anemic.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import type { CategorizedFile } from '../../../discovery/categorizer.js';

vi.mock('../../../adapters/ast-grep.js', () => ({
  readSource: vi.fn(),
}));

import { readSource } from '../../../adapters/ast-grep.js';
const mockedRead = vi.mocked(readSource);

const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('domain/array-as-collection-anemic', () => {
  it('detects exposed array with repeated consumer operations', async () => {
    const file: CategorizedFile = { path: 'src/app/domain/order.entity.ts', tags: ['is_typescript'] };
    mockedRead.mockResolvedValue(`
export class Order {
  items: OrderItem[] = [];

  get total() {
    return this.items.filter(i => i.active).reduce((sum, i) => sum + i.price, 0);
  }

  get activeItems() {
    return this.items.filter(i => i.active);
  }

  get itemCount() {
    return this.items.filter(i => i.active).length;
  }
}
`);
    const findings = await arrayAsCollectionAnemicRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(1);
    expect(findings[0]!.message).toContain('items');
  });

  it('ignores array with single usage', async () => {
    const file: CategorizedFile = { path: 'src/app/domain/user.entity.ts', tags: ['is_typescript'] };
    mockedRead.mockResolvedValue(`
export class User {
  roles: string[] = [];

  hasRole(role: string) {
    return this.roles.includes(role);
  }
}
`);
    const findings = await arrayAsCollectionAnemicRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('ignores non-class files', async () => {
    const file: CategorizedFile = { path: 'src/app/utils/helpers.ts', tags: ['is_typescript'] };
    mockedRead.mockResolvedValue(`
const items: string[] = [];
items.filter(x => x).map(x => x);
items.filter(x => x).reduce((a, b) => a + b);
items.filter(x => x).length;
`);
    const findings = await arrayAsCollectionAnemicRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('ignores spec/test files', async () => {
    const file: CategorizedFile = { path: 'src/app/domain/order.spec.ts', tags: ['is_typescript'] };
    mockedRead.mockResolvedValue(`
export class TestOrder {
  items: Item[] = [];
  a() { return this.items.filter(i => i).map(i => i); }
  b() { return this.items.filter(i => i).reduce((s, i) => s); }
  c() { return this.items.filter(i => i).length; }
}
`);
    const findings = await arrayAsCollectionAnemicRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('detects with threshold of 3 chain usages', async () => {
    const file: CategorizedFile = { path: 'src/app/domain/project.entity.ts', tags: ['is_typescript'] };
    mockedRead.mockResolvedValue(`
export class Project {
  tasks: Task[] = [];

  getActiveTasks() { return this.tasks.filter(t => t.active); }
  getCompletedTasks() { return this.tasks.filter(t => t.done); }
  getTaskCount() { return this.tasks.filter(t => t.active).length; }
}
`);
    const findings = await arrayAsCollectionAnemicRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(1);
  });
});
