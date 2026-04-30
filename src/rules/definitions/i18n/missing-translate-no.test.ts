import { describe, it, expect, vi } from 'vitest';
import { missingTranslateNoRule } from './missing-translate-no.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import type { CategorizedFile } from '../../../discovery/categorizer.js';

vi.mock('../../../adapters/ast-grep.js', () => ({
  readSource: vi.fn(),
}));

import { readSource } from '../../../adapters/ast-grep.js';
const mockedRead = vi.mocked(readSource);

const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('i18n/missing-translate-no', () => {
  it('detects brand/code elements without translate=no', async () => {
    const file: CategorizedFile = { path: 'src/app/pages/about/about.page.html', tags: ['is_template'] };
    mockedRead.mockResolvedValue(`
<p>Powered by <span class="brand-name">PAR Task Orchestrator</span></p>
`);
    const findings = await missingTranslateNoRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(1);
    expect(findings[0]!.message).toContain('translate="no"');
  });

  it('ignores elements with translate=no already set', async () => {
    const file: CategorizedFile = { path: 'src/app/pages/about/about.page.html', tags: ['is_template'] };
    mockedRead.mockResolvedValue(`
<p>Powered by <span class="brand-name" translate="no">PAR Task Orchestrator</span></p>
<code translate="no">npm install @par/lint</code>
`);
    const findings = await missingTranslateNoRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('detects code/pre/kbd/samp elements without translate=no', async () => {
    const file: CategorizedFile = { path: 'src/app/pages/docs/docs.page.html', tags: ['is_template'] };
    mockedRead.mockResolvedValue(`
<p>Run <code>par-lint review</code> to scan.</p>
<pre>const x = 1;</pre>
<kbd>Ctrl+C</kbd>
`);
    const findings = await missingTranslateNoRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(3);
  });

  it('ignores regular text elements', async () => {
    const file: CategorizedFile = { path: 'src/app/pages/home/home.page.html', tags: ['is_template'] };
    mockedRead.mockResolvedValue(`
<h1>Welcome to our app</h1>
<p>Get started by creating a project.</p>
`);
    const findings = await missingTranslateNoRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('ignores non-template files', async () => {
    const file: CategorizedFile = { path: 'src/app/user.service.ts', tags: ['is_typescript'] };
    const findings = await missingTranslateNoRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('detects var/samp elements without translate=no', async () => {
    const file: CategorizedFile = { path: 'src/app/pages/help/help.page.html', tags: ['is_template'] };
    mockedRead.mockResolvedValue(`
<p>Set <var>API_KEY</var> in your environment.</p>
<samp>Error: ENOENT</samp>
`);
    const findings = await missingTranslateNoRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(2);
  });
});
