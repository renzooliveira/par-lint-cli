import { describe, it, expect, vi } from 'vitest';
import { preferExistingUtilityRule } from './prefer-existing-utility.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import type { CategorizedFile } from '../../../discovery/categorizer.js';

vi.mock('../../../adapters/ast-grep.js', () => ({
  readSource: vi.fn(),
}));

import { readSource } from '../../../adapters/ast-grep.js';
const mockedRead = vi.mocked(readSource);

const config = parLintConfigSchema.parse({ project: { name: 'test' } });
const file: CategorizedFile = { path: 'src/app/order.service.ts', tags: ['is_typescript'] };

describe('duplication/prefer-existing-utility', () => {
  it('detects local formatDate function', async () => {
    mockedRead.mockResolvedValue(`
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}
`);
    const findings = await preferExistingUtilityRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(1);
    expect(findings[0]!.message).toContain('formatDate');
    expect(findings[0]!.message).toContain('date.util');
  });

  it('detects local deepClone arrow function', async () => {
    mockedRead.mockResolvedValue(`
const deepClone = (obj: any) => JSON.parse(JSON.stringify(obj));
`);
    const findings = await preferExistingUtilityRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(1);
    expect(findings[0]!.message).toContain('structuredClone');
  });

  it('ignores non-common function names', async () => {
    mockedRead.mockResolvedValue(`
function processOrderData(order: Order) {
  return order;
}
`);
    const findings = await preferExistingUtilityRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('ignores utility files themselves', async () => {
    const utilFile: CategorizedFile = { path: 'src/app/utils/date.util.ts', tags: ['is_typescript'] };
    mockedRead.mockResolvedValue(`
function formatDate(date: Date) { return ''; }
`);
    const findings = await preferExistingUtilityRule.run(utilFile, config, '/tmp');
    expect(findings).toHaveLength(0);
  });
});
