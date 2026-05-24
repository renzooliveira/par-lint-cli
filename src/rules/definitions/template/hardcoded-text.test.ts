import { describe, it, expect, vi } from 'vitest';
import { hardcodedTextRule } from './hardcoded-text.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import type { CategorizedFile } from '../../../discovery/categorizer.js';

vi.mock('../../../adapters/ast-grep.js', () => ({
  readSource: vi.fn(),
}));

import { readSource } from '../../../adapters/ast-grep.js';
const mockedRead = vi.mocked(readSource);

const config = parLintConfigSchema.parse({ project: { name: 'test' }, rules: { 'template/hardcoded-text': { enabled: true } } });
const file: CategorizedFile = { path: 'src/app/my.component.html', tags: ['is_template'] };

describe('template/hardcoded-text', () => {
  it('detects hardcoded text in tags', async () => {
    mockedRead.mockResolvedValue(`
<h1>Welcome to our application</h1>
<p>Please log in to continue</p>
`);
    const findings = await hardcodedTextRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(2);
  });

  it('ignores elements with i18n attribute', async () => {
    mockedRead.mockResolvedValue(`
<h1 i18n>Welcome to our application</h1>
`);
    const findings = await hardcodedTextRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('ignores translate pipe usage', async () => {
    mockedRead.mockResolvedValue(`
<h1>{{ 'WELCOME' | translate }}</h1>
`);
    const findings = await hardcodedTextRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('ignores interpolation-only content', async () => {
    mockedRead.mockResolvedValue(`
<span>{{ user.name }}</span>
`);
    const findings = await hardcodedTextRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('ignores HTML comments', async () => {
    mockedRead.mockResolvedValue(`
<!-- This is a comment with text -->
`);
    const findings = await hardcodedTextRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('ignores script/style blocks', async () => {
    mockedRead.mockResolvedValue(`
<script>const msg = "Hello world";</script>
<style>.title { content: "test value"; }</style>
`);
    const findings = await hardcodedTextRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('skips non-html files', async () => {
    const tsFile: CategorizedFile = { path: 'src/app/my.component.ts', tags: ['is_typescript'] };
    const findings = await hardcodedTextRule.run(tsFile, config, '/tmp');
    expect(findings).toHaveLength(0);
  });
});
