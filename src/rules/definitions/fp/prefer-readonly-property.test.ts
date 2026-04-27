import { describe, it, expect, vi } from 'vitest';
import { preferReadonlyPropertyRule } from './prefer-readonly-property.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import type { CategorizedFile } from '../../../discovery/categorizer.js';

vi.mock('../../../adapters/ast-grep.js', () => ({
  readSource: vi.fn(),
}));

import { readSource } from '../../../adapters/ast-grep.js';
const mockedRead = vi.mocked(readSource);

const config = parLintConfigSchema.parse({ project: { name: 'test' } });
const file: CategorizedFile = { path: 'src/app/order.service.ts', tags: ['is_typescript'] };

describe('functional/prefer-readonly-property', () => {
  it('detects property never reassigned', async () => {
    mockedRead.mockResolvedValue(`
class OrderService {
  baseUrl = '/api/orders';

  getAll() {
    return fetch(this.baseUrl);
  }
}
`);
    const findings = await preferReadonlyPropertyRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(1);
    expect(findings[0]!.message).toContain('baseUrl');
  });

  it('ignores reassigned properties', async () => {
    mockedRead.mockResolvedValue(`
class Counter {
  count = 0;

  increment() {
    this.count = this.count + 1;
  }
}
`);
    const findings = await preferReadonlyPropertyRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('ignores already readonly properties', async () => {
    mockedRead.mockResolvedValue(`
class OrderService {
  readonly baseUrl = '/api/orders';
}
`);
    const findings = await preferReadonlyPropertyRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('ignores signal properties', async () => {
    mockedRead.mockResolvedValue(`
class Counter {
  count = signal(0);
  doubled = computed(() => this.count() * 2);
}
`);
    const findings = await preferReadonlyPropertyRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });
});
