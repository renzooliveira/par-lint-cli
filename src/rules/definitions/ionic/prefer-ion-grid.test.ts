import { describe, it, expect, vi } from 'vitest';
import { preferIonGridRule } from './prefer-ion-grid.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import type { CategorizedFile } from '../../../discovery/categorizer.js';

vi.mock('../../../adapters/ast-grep.js', () => ({
  readSource: vi.fn(),
}));

import { readSource } from '../../../adapters/ast-grep.js';
const mockedRead = vi.mocked(readSource);

const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('ionic/prefer-ion-grid', () => {
  it('detects manual flex layout', async () => {
    const file: CategorizedFile = { path: 'src/app/pages/orders/orders.page.scss', tags: ['is_scss'] };
    mockedRead.mockResolvedValue(`
.container {
  display: flex;
  flex-wrap: wrap;
}
`);
    const findings = await preferIonGridRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(1);
    expect(findings[0]!.message).toContain('display: flex');
  });

  it('detects manual grid layout', async () => {
    const file: CategorizedFile = { path: 'src/app/pages/orders/orders.page.scss', tags: ['is_scss'] };
    mockedRead.mockResolvedValue(`
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
}
`);
    const findings = await preferIonGridRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(1);
  });

  it('ignores when ion-grid is already used', async () => {
    const file: CategorizedFile = { path: 'src/app/pages/orders/orders.page.scss', tags: ['is_scss'] };
    mockedRead.mockResolvedValue(`
ion-grid {
  padding: 16px;
}
ion-col {
  display: flex;
}
`);
    const findings = await preferIonGridRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('ignores non-ionic files', async () => {
    const file: CategorizedFile = { path: 'src/app/styles/global.scss', tags: ['is_scss'] };
    mockedRead.mockResolvedValue(`
.flex { display: flex; }
`);
    const findings = await preferIonGridRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });
});
