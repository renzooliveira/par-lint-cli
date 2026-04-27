import { describe, it, expect, vi } from 'vitest';
import { contextMismatchRule } from './context-mismatch.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import type { CategorizedFile } from '../../../discovery/categorizer.js';

vi.mock('../../../adapters/ast-grep.js', () => ({
  readSource: vi.fn(),
}));

import { readSource } from '../../../adapters/ast-grep.js';
const mockedRead = vi.mocked(readSource);

const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('naming/context-mismatch', () => {
  it('detects generic name in feature directory', async () => {
    const file: CategorizedFile = { path: 'src/app/features/user-form/attachment.model.ts', tags: ['is_typescript'] };
    mockedRead.mockResolvedValue(`
export interface Attachment {
  id: string;
  url: string;
}
`);
    const findings = await contextMismatchRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(1);
    expect(findings[0]!.message).toContain('UserFormAttachment');
  });

  it('ignores prefixed names', async () => {
    const file: CategorizedFile = { path: 'src/app/features/user-form/user-form-attachment.model.ts', tags: ['is_typescript'] };
    mockedRead.mockResolvedValue(`
export interface UserFormAttachment {
  id: string;
}
`);
    const findings = await contextMismatchRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('ignores non-generic names', async () => {
    const file: CategorizedFile = { path: 'src/app/features/orders/order-processor.service.ts', tags: ['is_typescript'] };
    mockedRead.mockResolvedValue(`
export class OrderProcessor {}
`);
    const findings = await contextMismatchRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('ignores files outside feature directories', async () => {
    const file: CategorizedFile = { path: 'src/app/shared/attachment.model.ts', tags: ['is_typescript'] };
    mockedRead.mockResolvedValue(`
export interface Attachment { id: string; }
`);
    const findings = await contextMismatchRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });
});
