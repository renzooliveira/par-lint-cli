import { describe, it, expect, vi } from 'vitest';
import { noCrossSliceImportRule } from './no-cross-slice-import.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import type { CategorizedFile } from '../../../discovery/categorizer.js';

vi.mock('../../../adapters/ast-grep.js', () => ({
  readSource: vi.fn(),
}));

import { readSource } from '../../../adapters/ast-grep.js';
const mockedRead = vi.mocked(readSource);

const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('arch/no-cross-slice-import', () => {
  it('detects cross-slice import between features', async () => {
    const file: CategorizedFile = { path: 'src/app/features/orders/order.service.ts', tags: ['is_typescript'] };
    mockedRead.mockResolvedValue(`
import { UserService } from '../users/user.service';
`);
    const findings = await noCrossSliceImportRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(1);
    expect(findings[0]!.message).toContain('features/orders');
    expect(findings[0]!.message).toContain('features/users');
  });

  it('allows imports within same slice', async () => {
    const file: CategorizedFile = { path: 'src/app/features/orders/order.service.ts', tags: ['is_typescript'] };
    mockedRead.mockResolvedValue(`
import { OrderModel } from './order.model';
import { OrderHelper } from './helpers/order.helper';
`);
    const findings = await noCrossSliceImportRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('allows imports from shared/core', async () => {
    const file: CategorizedFile = { path: 'src/app/features/orders/order.service.ts', tags: ['is_typescript'] };
    mockedRead.mockResolvedValue(`
import { HttpClient } from '@angular/common/http';
import { SharedUtil } from '@shared/utils';
`);
    const findings = await noCrossSliceImportRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('ignores files not in feature directories', async () => {
    const file: CategorizedFile = { path: 'src/app/shared/util.ts', tags: ['is_typescript'] };
    mockedRead.mockResolvedValue(`
import { Something } from '../features/orders/order.model';
`);
    const findings = await noCrossSliceImportRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });
});
