import { describe, it, expect, vi } from 'vitest';
import { similarComponentRule } from './similar-component.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import type { CategorizedFile } from '../../../discovery/categorizer.js';

vi.mock('../../../adapters/ast-grep.js', () => ({
  readSource: vi.fn(),
}));

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  readdir: vi.fn(),
  stat: vi.fn(),
}));

import { readSource } from '../../../adapters/ast-grep.js';
import { readFile, readdir, stat } from 'node:fs/promises';
const mockedRead = vi.mocked(readSource);
const mockedReadFile = vi.mocked(readFile);
const mockedReaddir = vi.mocked(readdir);
const mockedStat = vi.mocked(stat);

const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('duplication/similar-component', () => {
  it('detects components with >70% similar template structure', async () => {
    const fileA: CategorizedFile = { path: 'src/app/pages/user-list/user-list.page.html', tags: ['is_template'] };

    mockedRead.mockResolvedValue(`
<ion-header>
  <ion-toolbar>
    <ion-title>Users</ion-title>
  </ion-toolbar>
</ion-header>
<ion-content>
  <ion-list>
    @for (user of users; track user.id) {
      <ion-item>
        <ion-label>{{ user.name }}</ion-label>
        <ion-badge slot="end">{{ user.status }}</ion-badge>
      </ion-item>
    }
  </ion-list>
</ion-content>
`);

    const siblingTemplate = `
<ion-header>
  <ion-toolbar>
    <ion-title>Orders</ion-title>
  </ion-toolbar>
</ion-header>
<ion-content>
  <ion-list>
    @for (order of orders; track order.id) {
      <ion-item>
        <ion-label>{{ order.name }}</ion-label>
        <ion-badge slot="end">{{ order.total }}</ion-badge>
      </ion-item>
    }
  </ion-list>
</ion-content>
`;

    mockedReaddir.mockResolvedValue([
      'user-list.page.html',
      'order-list.page.html',
    ] as any);
    mockedReadFile.mockImplementation(async (p: any) => {
      if (String(p).includes('order-list')) return siblingTemplate;
      return '';
    });

    const findings = await similarComponentRule.run(fileA, config, '/test');
    expect(findings).toHaveLength(1);
    expect(findings[0]!.message).toContain('order-list.page.html');
    expect(findings[0]!.message).toMatch(/\d+%/);
  });

  it('ignores components with different structure', async () => {
    const fileA: CategorizedFile = { path: 'src/app/pages/login/login.page.html', tags: ['is_template'] };

    mockedRead.mockResolvedValue(`
<ion-content>
  <form>
    <ion-item>
      <ion-input label="Email" type="email"></ion-input>
    </ion-item>
    <ion-item>
      <ion-input label="Password" type="password"></ion-input>
    </ion-item>
    <ion-button expand="block" type="submit">Login</ion-button>
  </form>
</ion-content>
`);

    const siblingTemplate = `
<ion-header>
  <ion-toolbar>
    <ion-title>Dashboard</ion-title>
  </ion-toolbar>
</ion-header>
<ion-content>
  <div class="stats">
    <ion-card>
      <ion-card-header>
        <ion-card-title>Revenue</ion-card-title>
      </ion-card-header>
      <ion-card-content>
        <canvas id="chart"></canvas>
      </ion-card-content>
    </ion-card>
  </div>
</ion-content>
`;

    mockedReaddir.mockResolvedValue([
      'login.page.html',
      'dashboard.page.html',
    ] as any);
    mockedReadFile.mockImplementation(async (p: any) => {
      if (String(p).includes('dashboard')) return siblingTemplate;
      return '';
    });

    const findings = await similarComponentRule.run(fileA, config, '/test');
    expect(findings).toHaveLength(0);
  });

  it('ignores non-template files', async () => {
    const file: CategorizedFile = { path: 'src/app/user.service.ts', tags: ['is_typescript'] };
    const findings = await similarComponentRule.run(file, config, '/test');
    expect(findings).toHaveLength(0);
  });

  it('ignores spec/test html files', async () => {
    const file: CategorizedFile = { path: 'src/app/user.component.spec.html', tags: ['is_template'] };
    const findings = await similarComponentRule.run(file, config, '/test');
    expect(findings).toHaveLength(0);
  });

  it('respects configurable similarity threshold', async () => {
    const fileA: CategorizedFile = { path: 'src/app/pages/a/a.page.html', tags: ['is_template'] };

    mockedRead.mockResolvedValue(`
<ion-content>
  <ion-list>
    <ion-item>
      <ion-label>Item A</ion-label>
    </ion-item>
  </ion-list>
</ion-content>
`);

    const siblingTemplate = `
<ion-content>
  <ion-list>
    <ion-item>
      <ion-label>Item B</ion-label>
      <ion-note>extra note</ion-note>
    </ion-item>
  </ion-list>
</ion-content>
`;

    mockedReaddir.mockResolvedValue(['a.page.html', 'b.page.html'] as any);
    mockedReadFile.mockImplementation(async (p: any) => {
      if (String(p).includes('b.page')) return siblingTemplate;
      return '';
    });

    const strictConfig = parLintConfigSchema.parse({
      project: { name: 'test' },
      rules: { 'duplication/similar-component': { similarity_threshold: 0.95 } },
    });
    const findings = await similarComponentRule.run(fileA, strictConfig, '/test');
    expect(findings).toHaveLength(0);
  });

  it('searches sibling directories for similar templates', async () => {
    const fileA: CategorizedFile = { path: 'src/app/pages/user-list/user-list.page.html', tags: ['is_template'] };

    mockedRead.mockResolvedValue(`
<ion-header>
  <ion-toolbar><ion-title>Users</ion-title></ion-toolbar>
</ion-header>
<ion-content>
  <ion-list>
    <ion-item><ion-label>Name</ion-label></ion-item>
  </ion-list>
</ion-content>
`);

    const similarTemplate = `
<ion-header>
  <ion-toolbar><ion-title>Tasks</ion-title></ion-toolbar>
</ion-header>
<ion-content>
  <ion-list>
    <ion-item><ion-label>Task</ion-label></ion-item>
  </ion-list>
</ion-content>
`;

    mockedReaddir.mockImplementation(async (p: any) => {
      const dir = String(p);
      if (dir.endsWith('user-list')) return ['user-list.page.html'] as any;
      if (dir.endsWith('pages')) return ['user-list', 'task-list'] as any;
      if (dir.endsWith('task-list')) return ['task-list.page.html'] as any;
      return [] as any;
    });

    mockedStat.mockImplementation(async (p: any) => {
      const s = String(p);
      if (s.endsWith('task-list')) return { isDirectory: () => true } as any;
      throw new Error('not found');
    });

    mockedReadFile.mockImplementation(async (p: any) => {
      if (String(p).includes('task-list')) return similarTemplate;
      return '';
    });

    const findings = await similarComponentRule.run(fileA, config, '/test');
    expect(findings).toHaveLength(1);
    expect(findings[0]!.message).toContain('task-list');
  });
});
