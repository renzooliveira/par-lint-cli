import { describe, it, expect, vi } from 'vitest';
import { runtimeStateCheckRule } from './runtime-state-check.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import type { CategorizedFile } from '../../../discovery/categorizer.js';

vi.mock('../../../adapters/ast-grep.js', () => ({
  readSource: vi.fn(),
}));

import { readSource } from '../../../adapters/ast-grep.js';
const mockedRead = vi.mocked(readSource);

const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('domain/runtime-state-check', () => {
  it('detects runtime type guard that could be compile-time', async () => {
    const file: CategorizedFile = { path: 'src/app/domain/order.service.ts', tags: ['is_typescript'] };
    mockedRead.mockResolvedValue(`
function confirmOrder(order: Order) {
  if (order.status !== 'draft') {
    throw new Error('Can only confirm draft orders');
  }
  order.status = 'confirmed';
}
`);
    const findings = await runtimeStateCheckRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(1);
    expect(findings[0]!.message).toContain('status');
  });

  it('detects early return pattern on discriminant', async () => {
    const file: CategorizedFile = { path: 'src/app/domain/task.service.ts', tags: ['is_typescript'] };
    mockedRead.mockResolvedValue(`
function startTask(task: Task) {
  if (task.kind !== 'pending') return;
  task.kind = 'in-progress';
}
`);
    const findings = await runtimeStateCheckRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(1);
  });

  it('ignores legitimate runtime checks not on discriminants', async () => {
    const file: CategorizedFile = { path: 'src/app/domain/user.service.ts', tags: ['is_typescript'] };
    mockedRead.mockResolvedValue(`
function validateUser(user: User) {
  if (!user.email) {
    throw new Error('Email is required');
  }
  if (user.age < 18) {
    throw new Error('Must be 18+');
  }
}
`);
    const findings = await runtimeStateCheckRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('ignores spec/test files', async () => {
    const file: CategorizedFile = { path: 'src/app/domain/order.spec.ts', tags: ['is_typescript'] };
    mockedRead.mockResolvedValue(`
function helper(order: Order) {
  if (order.status !== 'draft') throw new Error('test');
}
`);
    const findings = await runtimeStateCheckRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('detects multiple discriminant checks in same function', async () => {
    const file: CategorizedFile = { path: 'src/app/domain/workflow.service.ts', tags: ['is_typescript'] };
    mockedRead.mockResolvedValue(`
function processItem(item: WorkItem) {
  if (item.type !== 'task') {
    throw new Error('Only tasks allowed');
  }
  if (item.state !== 'ready') {
    throw new Error('Must be ready');
  }
  item.state = 'processing';
}
`);
    const findings = await runtimeStateCheckRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(2);
  });

  it('ignores non-domain files', async () => {
    const file: CategorizedFile = { path: 'src/app/utils/helpers.ts', tags: ['is_typescript'] };
    mockedRead.mockResolvedValue(`
function checkStatus(order: Order) {
  if (order.status !== 'draft') throw new Error('nope');
}
`);
    const findings = await runtimeStateCheckRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });
});
