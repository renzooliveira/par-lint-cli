import { describe, it, expect, vi } from 'vitest';
import { duplicateTypeShapeRule } from './duplicate-type-shape.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import type { CategorizedFile } from '../../../discovery/categorizer.js';

vi.mock('../../../adapters/ast-grep.js', () => ({
  readSource: vi.fn(),
}));

import { readSource } from '../../../adapters/ast-grep.js';
const mockedRead = vi.mocked(readSource);

const config = parLintConfigSchema.parse({ project: { name: 'test' } });
const file: CategorizedFile = { path: 'src/app/models.ts', tags: ['is_typescript'] };

describe('duplication/duplicate-type-shape', () => {
  it('detects interfaces with identical shapes', async () => {
    mockedRead.mockResolvedValue(`
interface UserResponse {
  id: string;
  name: string;
  email: string;
}

interface CustomerResponse {
  id: string;
  name: string;
  email: string;
}
`);
    const findings = await duplicateTypeShapeRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(1);
    expect(findings[0]!.message).toContain('UserResponse');
    expect(findings[0]!.message).toContain('CustomerResponse');
  });

  it('ignores types with different shapes', async () => {
    mockedRead.mockResolvedValue(`
interface User {
  id: string;
  name: string;
}

interface Order {
  id: string;
  total: number;
}
`);
    const findings = await duplicateTypeShapeRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('ignores single types', async () => {
    mockedRead.mockResolvedValue(`
interface User {
  id: string;
  name: string;
}
`);
    const findings = await duplicateTypeShapeRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });
});
