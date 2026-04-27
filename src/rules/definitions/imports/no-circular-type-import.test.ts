import { describe, it, expect, vi } from 'vitest';
import { noCircularTypeImportRule } from './no-circular-type-import.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import type { CategorizedFile } from '../../../discovery/categorizer.js';

vi.mock('../../../adapters/ast-grep.js', () => ({
  readSource: vi.fn(),
}));

import { readSource } from '../../../adapters/ast-grep.js';
const mockedRead = vi.mocked(readSource);

const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('imports/no-circular-type-import', () => {
  it('detects circular type import', async () => {
    const file: CategorizedFile = { path: 'src/app/order.model.ts', tags: ['is_typescript'] };
    mockedRead
      .mockResolvedValueOnce(`import type { User } from './user.model';\nexport interface Order { user: User; }`)
      .mockResolvedValueOnce(`import type { Order } from './order.model';\nexport interface User { orders: Order[]; }`);

    const findings = await noCircularTypeImportRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(1);
    expect(findings[0]!.message).toContain('Circular');
  });

  it('ignores non-circular type import', async () => {
    const file: CategorizedFile = { path: 'src/app/order.model.ts', tags: ['is_typescript'] };
    mockedRead
      .mockResolvedValueOnce(`import type { User } from './user.model';\nexport interface Order { user: User; }`)
      .mockResolvedValueOnce(`export interface User { name: string; }`);

    const findings = await noCircularTypeImportRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('ignores non-type imports', async () => {
    const file: CategorizedFile = { path: 'src/app/order.service.ts', tags: ['is_typescript'] };
    mockedRead.mockResolvedValue(`import { HttpClient } from '@angular/common/http';`);

    const findings = await noCircularTypeImportRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });
});
