import { describe, it, expect, vi } from 'vitest';
import { fileClassMismatchRule } from './file-class-mismatch.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import type { CategorizedFile } from '../../../discovery/categorizer.js';

vi.mock('../../../adapters/ast-grep.js', () => ({
  readSource: vi.fn(),
}));

import { readSource } from '../../../adapters/ast-grep.js';
const mockedRead = vi.mocked(readSource);

const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('naming/file-class-mismatch', () => {
  it('detects class name not matching file name', async () => {
    const file: CategorizedFile = { path: 'src/app/user-search.page.ts', tags: ['is_typescript'] };
    mockedRead.mockResolvedValue(`
export class SearchUsersPage {}
`);
    const findings = await fileClassMismatchRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(1);
    expect(findings[0]!.message).toContain('UserSearchPage');
  });

  it('accepts matching class name', async () => {
    const file: CategorizedFile = { path: 'src/app/user-search.page.ts', tags: ['is_typescript'] };
    mockedRead.mockResolvedValue(`
export class UserSearchPage {}
`);
    const findings = await fileClassMismatchRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('accepts case-insensitive match', async () => {
    const file: CategorizedFile = { path: 'src/app/user-search.service.ts', tags: ['is_typescript'] };
    mockedRead.mockResolvedValue(`
export class UserSearchservice {}
`);
    const findings = await fileClassMismatchRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('skips index files', async () => {
    const file: CategorizedFile = { path: 'src/app/index.ts', tags: ['is_typescript'] };
    const findings = await fileClassMismatchRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('accepts custom suffixes like .helper, .layout, .actions', async () => {
    const cases: [string, string][] = [
      ['src/app/task-attachments.helper.ts', 'export class TaskAttachmentsHelper {}'],
      ['src/app/tabs.layout.ts', 'export class TabsLayout {}'],
      ['src/app/task-detail.actions.ts', 'export class TaskDetailActions {}'],
      ['src/app/task-polling.helper.ts', 'export class TaskPollingHelper {}'],
    ];
    for (const [filePath, source] of cases) {
      const file: CategorizedFile = { path: filePath, tags: ['is_typescript'] };
      mockedRead.mockResolvedValue(source);
      const findings = await fileClassMismatchRule.run(file, config, '/tmp');
      expect(findings, `Expected 0 findings for ${filePath}`).toHaveLength(0);
    }
  });

  it('accepts bare file name like app.ts with class App', async () => {
    const file: CategorizedFile = { path: 'src/app/app.ts', tags: ['is_typescript'] };
    mockedRead.mockResolvedValue('export class App {}');
    const findings = await fileClassMismatchRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });
});
