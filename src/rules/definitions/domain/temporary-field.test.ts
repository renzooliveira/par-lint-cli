import { describe, it, expect, vi } from 'vitest';
import { temporaryFieldRule } from './temporary-field.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import type { CategorizedFile } from '../../../discovery/categorizer.js';

vi.mock('../../../adapters/ast-grep.js', () => ({
  readSource: vi.fn(),
}));

import { readSource } from '../../../adapters/ast-grep.js';
const mockedRead = vi.mocked(readSource);

const config = parLintConfigSchema.parse({ project: { name: 'test' } });
const file: CategorizedFile = { path: 'src/app/order.service.ts', tags: ['is_typescript'] };

describe('domain/temporary-field', () => {
  it('detects field used in only one method', async () => {
    mockedRead.mockResolvedValue(`
class OrderService {
  tempResult: string;

  process() {
    this.tempResult = 'done';
    console.log(this.tempResult);
  }

  other() {
    console.log('no field usage');
  }
}
`);
    const findings = await temporaryFieldRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(1);
    expect(findings[0]!.message).toContain('tempResult');
    expect(findings[0]!.message).toContain('process');
  });

  it('ignores field used in multiple methods', async () => {
    mockedRead.mockResolvedValue(`
class OrderService {
  count: number;

  increment() {
    this.count++;
  }

  getCount() {
    return this.count;
  }
}
`);
    const findings = await temporaryFieldRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('ignores field used only in constructor', async () => {
    mockedRead.mockResolvedValue(`
class OrderService {
  name: string;

  constructor() {
    this.name = 'default';
  }
}
`);
    const findings = await temporaryFieldRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('ignores lifecycle/subscription fields', async () => {
    mockedRead.mockResolvedValue(`
class MyComponent {
  subscription: Subscription;

  ngOnInit() {
    this.subscription = this.svc.get().subscribe();
  }
}
`);
    const findings = await temporaryFieldRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });
});
