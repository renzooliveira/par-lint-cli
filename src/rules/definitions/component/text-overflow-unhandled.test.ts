import { describe, it, expect, vi } from 'vitest';
import { textOverflowUnhandledRule } from './text-overflow-unhandled.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import type { CategorizedFile } from '../../../discovery/categorizer.js';

vi.mock('../../../adapters/ast-grep.js', () => ({
  readSource: vi.fn(),
}));

import { readSource } from '../../../adapters/ast-grep.js';
const mockedRead = vi.mocked(readSource);

const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('component/text-overflow-unhandled', () => {
  it('detects dynamic text binding without overflow handling', async () => {
    const file: CategorizedFile = { path: 'src/app/pages/user/user.page.html', tags: ['is_template'] };
    mockedRead.mockResolvedValue(`
<ion-content>
  <h2>{{ user.name }}</h2>
  <p>{{ user.description }}</p>
</ion-content>
`);
    const findings = await textOverflowUnhandledRule.run(file, config, '/tmp');
    expect(findings.length).toBeGreaterThanOrEqual(1);
  });

  it('ignores text with truncate class', async () => {
    const file: CategorizedFile = { path: 'src/app/pages/user/user.page.html', tags: ['is_template'] };
    mockedRead.mockResolvedValue(`
<ion-content>
  <h2 class="truncate">{{ user.name }}</h2>
  <p class="line-clamp-2">{{ user.description }}</p>
</ion-content>
`);
    const findings = await textOverflowUnhandledRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('ignores text with ion-text-wrap', async () => {
    const file: CategorizedFile = { path: 'src/app/pages/user/user.page.html', tags: ['is_template'] };
    mockedRead.mockResolvedValue(`
<ion-label class="ion-text-wrap">{{ user.name }}</ion-label>
`);
    const findings = await textOverflowUnhandledRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('ignores static text (no binding)', async () => {
    const file: CategorizedFile = { path: 'src/app/pages/about/about.page.html', tags: ['is_template'] };
    mockedRead.mockResolvedValue(`
<ion-content>
  <h2>About Us</h2>
  <p>Welcome to our app.</p>
</ion-content>
`);
    const findings = await textOverflowUnhandledRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('ignores non-html files', async () => {
    const file: CategorizedFile = { path: 'src/app/user.service.ts', tags: ['is_typescript'] };
    const findings = await textOverflowUnhandledRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('ignores bindings inside ion-badge/ion-chip (small containers)', async () => {
    const file: CategorizedFile = { path: 'src/app/pages/user/user.page.html', tags: ['is_template'] };
    mockedRead.mockResolvedValue(`
<ion-badge>{{ user.status }}</ion-badge>
<ion-chip>{{ user.role }}</ion-chip>
`);
    const findings = await textOverflowUnhandledRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });
});
