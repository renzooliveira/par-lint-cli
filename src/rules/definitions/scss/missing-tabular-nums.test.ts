import { describe, it, expect, vi } from 'vitest';
import { missingTabularNumsRule } from './missing-tabular-nums.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import type { CategorizedFile } from '../../../discovery/categorizer.js';

vi.mock('../../../adapters/ast-grep.js', () => ({
  readSource: vi.fn(),
}));

import { readSource } from '../../../adapters/ast-grep.js';
const mockedRead = vi.mocked(readSource);

const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('scss/missing-tabular-nums', () => {
  it('detects table cell styles without tabular-nums', async () => {
    const file: CategorizedFile = { path: 'src/app/pages/report/report.page.scss', tags: ['is_scss'] };
    mockedRead.mockResolvedValue(`
.report-table {
  td {
    font-size: 14px;
    text-align: right;
  }
}
`);
    const findings = await missingTabularNumsRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(1);
    expect(findings[0]!.message).toContain('tabular-nums');
  });

  it('ignores when tabular-nums is present', async () => {
    const file: CategorizedFile = { path: 'src/app/pages/report/report.page.scss', tags: ['is_scss'] };
    mockedRead.mockResolvedValue(`
.report-table {
  td {
    font-size: 14px;
    font-variant-numeric: tabular-nums;
    text-align: right;
  }
}
`);
    const findings = await missingTabularNumsRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('ignores files without table-related selectors', async () => {
    const file: CategorizedFile = { path: 'src/app/pages/home/home.page.scss', tags: ['is_scss'] };
    mockedRead.mockResolvedValue(`
.hero {
  font-size: 24px;
  text-align: center;
}
`);
    const findings = await missingTabularNumsRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('detects th without tabular-nums too', async () => {
    const file: CategorizedFile = { path: 'src/app/components/grid.component.scss', tags: ['is_scss'] };
    mockedRead.mockResolvedValue(`
table {
  th {
    padding: 8px;
  }
}
`);
    const findings = await missingTabularNumsRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(1);
  });

  it('ignores non-scss files', async () => {
    const file: CategorizedFile = { path: 'src/app/user.service.ts', tags: ['is_typescript'] };
    const findings = await missingTabularNumsRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('ignores when global body has tabular-nums', async () => {
    const file: CategorizedFile = { path: 'src/app/pages/report/report.page.scss', tags: ['is_scss'] };
    mockedRead.mockResolvedValue(`
body {
  font-variant-numeric: tabular-nums;
}

.report-table td {
  text-align: right;
}
`);
    const findings = await missingTabularNumsRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });
});
