import { describe, it, expect, vi } from 'vitest';
import { mixedConcernsInDirectoryRule } from './mixed-concerns-in-directory.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import type { CategorizedFile } from '../../../discovery/categorizer.js';

vi.mock('../../../adapters/ast-grep.js', () => ({
  readSource: vi.fn(),
}));

import { readSource } from '../../../adapters/ast-grep.js';
const mockedRead = vi.mocked(readSource);

const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('arch/mixed-concerns-in-directory', () => {
  it('detects directory with 4+ artifact types', async () => {
    const file: CategorizedFile = { path: 'src/app/orders/order.component.ts', tags: ['is_typescript'] };
    mockedRead.mockResolvedValue(`
import { OrderService } from './order.service';
import { OrderEntity } from './order.entity';
import { OrderGuard } from './order.guard';
`);
    const findings = await mixedConcernsInDirectoryRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(1);
    expect(findings[0]!.message).toContain('orders');
    expect(findings[0]!.message).toContain('4');
  });

  it('allows directory with 3 or fewer types', async () => {
    const file: CategorizedFile = { path: 'src/app/orders/order.component.ts', tags: ['is_typescript'] };
    mockedRead.mockResolvedValue(`
import { OrderService } from './order.service';
import { OrderModel } from './order.model';
`);
    const findings = await mixedConcernsInDirectoryRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('skips shared/core directories', async () => {
    const file: CategorizedFile = { path: 'src/app/shared/util.component.ts', tags: ['is_typescript'] };
    mockedRead.mockResolvedValue(`
import { A } from './a.service';
import { B } from './b.entity';
import { C } from './c.guard';
import { D } from './d.pipe';
`);
    const findings = await mixedConcernsInDirectoryRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });
});
