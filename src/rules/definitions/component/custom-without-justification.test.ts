import { describe, it, expect, vi } from 'vitest';
import { customWithoutJustificationRule } from './custom-without-justification.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import type { CategorizedFile } from '../../../discovery/categorizer.js';

vi.mock('../../../adapters/ast-grep.js', () => ({
  readSource: vi.fn(),
}));

import { readSource } from '../../../adapters/ast-grep.js';
const mockedRead = vi.mocked(readSource);

const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('component/custom-without-justification', () => {
  it('detects custom component with mostly non-Ionic elements', async () => {
    const file: CategorizedFile = { path: 'src/app/components/fancy-card/fancy-card.component.html', tags: ['is_template'] };
    mockedRead.mockResolvedValue(`
<div class="card">
  <div class="card-header">
    <h3>{{ title }}</h3>
    <span class="badge">{{ count }}</span>
  </div>
  <div class="card-body">
    <p>{{ description }}</p>
    <a href="#" class="link">Read more</a>
  </div>
  <div class="card-footer">
    <button class="btn">Action</button>
  </div>
</div>
`);
    const findings = await customWithoutJustificationRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(1);
    expect(findings[0]!.message).toContain('non-Ionic');
  });

  it('ignores when mostly Ionic elements', async () => {
    const file: CategorizedFile = { path: 'src/app/components/user-card/user-card.component.html', tags: ['is_template'] };
    mockedRead.mockResolvedValue(`
<ion-card>
  <ion-card-header>
    <ion-card-title>{{ user.name }}</ion-card-title>
  </ion-card-header>
  <ion-card-content>
    <ion-label>{{ user.email }}</ion-label>
    <ion-badge>{{ user.role }}</ion-badge>
  </ion-card-content>
</ion-card>
`);
    const findings = await customWithoutJustificationRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('ignores with justification comment', async () => {
    const file: CategorizedFile = { path: 'src/app/components/chart/chart.component.html', tags: ['is_template'] };
    mockedRead.mockResolvedValue(`
<!-- custom: canvas-based chart not available in Ionic -->
<div class="chart-container">
  <canvas id="chart"></canvas>
  <div class="legend">
    <span>Label 1</span>
    <span>Label 2</span>
  </div>
</div>
`);
    const findings = await customWithoutJustificationRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('ignores non-component html files', async () => {
    const file: CategorizedFile = { path: 'src/app/pages/home/home.page.html', tags: ['is_template'] };
    mockedRead.mockResolvedValue(`
<div class="custom"><span>text</span><p>text</p><a>link</a><div>box</div></div>
`);
    const findings = await customWithoutJustificationRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('ignores non-template files', async () => {
    const file: CategorizedFile = { path: 'src/app/user.service.ts', tags: ['is_typescript'] };
    const findings = await customWithoutJustificationRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });
});
