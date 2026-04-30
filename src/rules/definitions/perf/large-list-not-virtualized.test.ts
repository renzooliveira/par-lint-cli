import { describe, it, expect, vi } from 'vitest';
import { largeListNotVirtualizedRule } from './large-list-not-virtualized.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import type { CategorizedFile } from '../../../discovery/categorizer.js';

vi.mock('../../../adapters/ast-grep.js', () => ({
  readSource: vi.fn(),
}));

import { readSource } from '../../../adapters/ast-grep.js';
const mockedRead = vi.mocked(readSource);

const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('perf/large-list-not-virtualized', () => {
  it('detects @for loop without virtual scroll', async () => {
    const file: CategorizedFile = { path: 'src/app/pages/list/list.page.html', tags: ['is_template'] };
    mockedRead.mockResolvedValue(`
<ion-content>
  <ion-list>
    @for (item of items; track item.id) {
      <ion-item>{{ item.name }}</ion-item>
    }
  </ion-list>
</ion-content>
`);
    const findings = await largeListNotVirtualizedRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(1);
    expect(findings[0]!.message).toContain('virtual');
  });

  it('detects *ngFor loop without virtual scroll', async () => {
    const file: CategorizedFile = { path: 'src/app/pages/list/list.page.html', tags: ['is_template'] };
    mockedRead.mockResolvedValue(`
<ion-list>
  <ion-item *ngFor="let item of items; trackBy: trackById">
    {{ item.name }}
  </ion-item>
</ion-list>
`);
    const findings = await largeListNotVirtualizedRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(1);
  });

  it('ignores when cdk-virtual-scroll-viewport is present', async () => {
    const file: CategorizedFile = { path: 'src/app/pages/list/list.page.html', tags: ['is_template'] };
    mockedRead.mockResolvedValue(`
<cdk-virtual-scroll-viewport itemSize="50">
  <ion-item *cdkVirtualFor="let item of items">
    {{ item.name }}
  </ion-item>
</cdk-virtual-scroll-viewport>
`);
    const findings = await largeListNotVirtualizedRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('ignores when ion-virtual-scroll is present', async () => {
    const file: CategorizedFile = { path: 'src/app/pages/list/list.page.html', tags: ['is_template'] };
    mockedRead.mockResolvedValue(`
<ion-virtual-scroll [items]="items">
  <ion-item *virtualItem="let item">
    {{ item.name }}
  </ion-item>
</ion-virtual-scroll>
`);
    const findings = await largeListNotVirtualizedRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('ignores with small-list comment', async () => {
    const file: CategorizedFile = { path: 'src/app/pages/list/list.page.html', tags: ['is_template'] };
    mockedRead.mockResolvedValue(`
<!-- small-list -->
<ion-list>
  @for (item of items; track item.id) {
    <ion-item>{{ item.name }}</ion-item>
  }
</ion-list>
`);
    const findings = await largeListNotVirtualizedRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('ignores non-template files', async () => {
    const file: CategorizedFile = { path: 'src/app/user.service.ts', tags: ['is_typescript'] };
    const findings = await largeListNotVirtualizedRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });
});
