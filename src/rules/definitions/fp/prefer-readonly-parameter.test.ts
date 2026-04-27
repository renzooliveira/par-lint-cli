import { describe, it, expect, vi } from 'vitest';
import { preferReadonlyParameterRule } from './prefer-readonly-parameter.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import type { CategorizedFile } from '../../../discovery/categorizer.js';

vi.mock('../../../adapters/ast-grep.js', () => ({
  readSource: vi.fn(),
}));

import { readSource } from '../../../adapters/ast-grep.js';
const mockedRead = vi.mocked(readSource);

const config = parLintConfigSchema.parse({ project: { name: 'test' } });
const file: CategorizedFile = { path: 'src/app/order.service.ts', tags: ['is_typescript'] };

describe('functional/prefer-readonly-parameter', () => {
  it('detects object parameter without Readonly', async () => {
    mockedRead.mockResolvedValue(`
function processOrder(order: Order) {
  return order.id;
}
`);
    const findings = await preferReadonlyParameterRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(1);
    expect(findings[0]!.message).toContain('Readonly<Order>');
  });

  it('ignores primitive parameters', async () => {
    mockedRead.mockResolvedValue(`
function getName(id: string, count: number, active: boolean) {
  return id;
}
`);
    const findings = await preferReadonlyParameterRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('ignores Readonly-wrapped parameters', async () => {
    mockedRead.mockResolvedValue(`
function processOrder(order: Readonly<Order>) {
  return order.id;
}
`);
    const findings = await preferReadonlyParameterRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('ignores constructors', async () => {
    mockedRead.mockResolvedValue(`
class Service {
  constructor(private http: HttpClient) {}
}
`);
    const findings = await preferReadonlyParameterRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });
});
