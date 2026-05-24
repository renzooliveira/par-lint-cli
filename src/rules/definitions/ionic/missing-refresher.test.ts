import { describe, it, expect, vi } from 'vitest';
import { missingRefresherRule } from './missing-refresher.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import type { CategorizedFile } from '../../../discovery/categorizer.js';

vi.mock('../../../adapters/ast-grep.js', () => ({
  readSource: vi.fn(),
}));

import { readSource } from '../../../adapters/ast-grep.js';
const mockedRead = vi.mocked(readSource);

const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('ionic/missing-refresher', () => {
  it('detects ion-list with ngFor but no refresher', async () => {
    const file: CategorizedFile = { path: 'src/app/pages/orders/orders.page.html', tags: ['is_template'] };
    mockedRead.mockResolvedValue(`
<ion-content>
  <ion-list>
    <ion-item *ngFor="let order of orders">{{ order.name }}</ion-item>
  </ion-list>
</ion-content>
`);
    const findings = await missingRefresherRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(1);
  });

  it('ignores page with refresher', async () => {
    const file: CategorizedFile = { path: 'src/app/pages/orders/orders.page.html', tags: ['is_template'] };
    mockedRead.mockResolvedValue(`
<ion-content>
  <ion-refresher slot="fixed" (ionRefresh)="refresh($event)">
    <ion-refresher-content></ion-refresher-content>
  </ion-refresher>
  <ion-list>
    <ion-item *ngFor="let order of orders">{{ order.name }}</ion-item>
  </ion-list>
</ion-content>
`);
    const findings = await missingRefresherRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('ignores list without data binding', async () => {
    const file: CategorizedFile = { path: 'src/app/pages/settings/settings.page.html', tags: ['is_template'] };
    mockedRead.mockResolvedValue(`
<ion-content>
  <ion-list>
    <ion-item>Option 1</ion-item>
    <ion-item>Option 2</ion-item>
  </ion-list>
</ion-content>
`);
    const findings = await missingRefresherRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });
});
