import { describe, it, expect, vi } from 'vitest';
import { enforcePathAliasRule } from './enforce-path-alias.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import type { CategorizedFile } from '../../../discovery/categorizer.js';

vi.mock('../../../adapters/ast-grep.js', () => ({
  readSource: vi.fn(),
}));

vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>();
  return {
    ...actual,
    existsSync: vi.fn((p: string) => p.includes('tsconfig.json')),
    readFileSync: vi.fn(() => '{ "compilerOptions": { "paths": { "@app/*": ["src/app/*"] } } }'),
  };
});

import { readSource } from '../../../adapters/ast-grep.js';
const mockedRead = vi.mocked(readSource);

const config = parLintConfigSchema.parse({ project: { name: 'test' } });
const file: CategorizedFile = { path: 'src/app/features/orders/order.service.ts', tags: ['is_typescript'] };

describe('imports/enforce-path-alias', () => {
  it('detects deep relative imports (3+ levels)', async () => {
    mockedRead.mockResolvedValue(`
import { UserService } from '../../../shared/services/user.service';
import { Config } from '../../../../core/config';
`);
    const findings = await enforcePathAliasRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(2);
    expect(findings[0]!.message).toContain('3 levels');
    expect(findings[1]!.message).toContain('4 levels');
  });

  it('ignores shallow relative imports', async () => {
    mockedRead.mockResolvedValue(`
import { OrderModel } from './order.model';
import { Helper } from '../shared/helper';
import { Utils } from '../../utils/date';
`);
    const findings = await enforcePathAliasRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('ignores alias imports', async () => {
    mockedRead.mockResolvedValue(`
import { UserService } from '@app/shared/services/user.service';
import { Config } from '@core/config';
`);
    const findings = await enforcePathAliasRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });
});
