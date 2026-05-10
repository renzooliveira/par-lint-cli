import { describe, it, expect, vi } from 'vitest';
import { missingIonBackButtonRule } from './missing-ion-back-button.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import type { CategorizedFile } from '../../../discovery/categorizer.js';

vi.mock('../../../adapters/ast-grep.js', () => ({
  readSource: vi.fn(),
}));

import { readSource } from '../../../adapters/ast-grep.js';
const mockedRead = vi.mocked(readSource);

const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('ionic/missing-ion-back-button', () => {
  it('detects missing back button in non-root page', async () => {
    const file: CategorizedFile = { path: 'src/app/pages/orders/orders.page.html', tags: ['is_template'] };
    mockedRead.mockResolvedValue(`
<ion-header>
  <ion-toolbar>
    <ion-title>Orders</ion-title>
  </ion-toolbar>
</ion-header>
<ion-content></ion-content>
`);
    const findings = await missingIonBackButtonRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(1);
    expect(findings[0]!.message).toContain('ion-back-button');
  });

  it('ignores page with back button', async () => {
    const file: CategorizedFile = { path: 'src/app/pages/detail/detail.page.html', tags: ['is_template'] };
    mockedRead.mockResolvedValue(`
<ion-header>
  <ion-toolbar>
    <ion-buttons slot="start">
      <ion-back-button defaultHref="/list"></ion-back-button>
    </ion-buttons>
    <ion-title>Detail</ion-title>
  </ion-toolbar>
</ion-header>
`);
    const findings = await missingIonBackButtonRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('ignores root pages', async () => {
    const file: CategorizedFile = { path: 'src/app/pages/home/home.page.html', tags: ['is_template'] };
    mockedRead.mockResolvedValue(`
<ion-header>
  <ion-toolbar>
    <ion-title>Home</ion-title>
  </ion-toolbar>
</ion-header>
`);
    const findings = await missingIonBackButtonRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('ignores pages without header', async () => {
    const file: CategorizedFile = { path: 'src/app/pages/modal/modal.page.html', tags: ['is_template'] };
    mockedRead.mockResolvedValue(`
<ion-content>
  <p>Modal content</p>
</ion-content>
`);
    const findings = await missingIonBackButtonRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });
});
